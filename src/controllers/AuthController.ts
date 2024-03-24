import { Response } from "express";
// import { AppDataSource } from "../config/data-source";
// import { User } from "../entity/User";
import { RegisterUserRequest } from "../types";
import { UserService } from "../services/UserService";
import { NextFunction } from "express-serve-static-core";
import { Logger } from "winston";
import { validationResult } from "express-validator";
import { JwtPayload } from "jsonwebtoken";
import { AppDataSource } from "../config/data-source";
import { RefreshToken } from "../entity/RefreshToken";
import { TokenService } from "../services/TokenService";

export class AuthController {
  userService: UserService;
  logger: Logger;
  tokenService: TokenService;
  constructor(
    userService: UserService,
    logger: Logger,
    tokenService: TokenService,
  ) {
    this.userService = userService;
    this.logger = logger;
    this.tokenService = tokenService;
  }

  async register(req: RegisterUserRequest, res: Response, next: NextFunction) {
    //Validating email
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }

    const { firstName, lastName, email, password } = req.body;

    // const userService = new UserService();
    this.logger.debug("Received details of the user to register", {
      firstName,
      lastName,
      email,
      password: "*******",
    });
    try {
      const user = await this.userService.create({
        firstName,
        lastName,
        email,
        password,
      });
      this.logger.info("The user has been created", { id: user.id });

      const payload: JwtPayload = {
        sub: String(user.id),
        role: user.role,
      };

      const accessToken = this.tokenService.generateAccessToken(payload);

      // //Persist the refresh token
      const MS_IN_YEAR = 1000 * 60 * 60 * 24 * 365; //If leap year then 1y->366
      const refreshRepository = AppDataSource.getRepository(RefreshToken);
      const newRefreshToken = await refreshRepository.save({
        user: user,
        expiresAt: new Date(Date.now() + MS_IN_YEAR),
      });

      // const secretToken: string = String(CONFIG.SECRET_TOKEN_KEY);
      // const refreshToken = sign(payload, secretToken, {
      //   algorithm: "HS256",
      //   expiresIn: "1y",
      //   issuer: "auth-service",
      //   jwtid: String(newRefreshToken.id),
      // });

      const refreshToken = this.tokenService.generateRefreshToken({
        ...payload,
        id: String(newRefreshToken.id),
      });

      res.cookie("accessToken", accessToken, {
        domain: "localhost",
        sameSite: "strict", //So that this cookie will be saved to the same host as of your url
        maxAge: 1000 * 60 * 60, //1000 is 1 sec we keep it 1 hr
        httpOnly: true, // very important
      });

      res.cookie("refreshToken", refreshToken, {
        domain: "localhost",
        sameSite: "strict", //So that this cookie will be saved to the same host as of your url
        maxAge: 1000 * 60 * 60 * 24 * 365, //1 year
        httpOnly: true, // very important
      });
      res.status(201).json({ id: user.id });
    } catch (e) {
      next(e);
      return;
    }
  }
}
