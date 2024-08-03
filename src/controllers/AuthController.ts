import { Response } from "express";
// import { AppDataSource } from "../config/data-source";
// import { User } from "../entity/User";
import { AuthRequest, RegisterUserRequest } from "../types";
import { UserService } from "../services/UserService";
import { NextFunction } from "express-serve-static-core";
import { Logger } from "winston";
import { validationResult } from "express-validator";
import { JwtPayload } from "jsonwebtoken";
import { TokenService } from "../services/TokenService";
import createHttpError from "http-errors";
import { CredentialService } from "../services/CredentialService";
import { Roles } from "../constants";

//All services are infused as dependency injection
export class AuthController {
  userService: UserService;
  tokenService: TokenService;
  credentialService: CredentialService;
  logger: Logger;

  constructor(
    userService: UserService,
    tokenService: TokenService,
    credentialService: CredentialService,
    logger: Logger,
  ) {
    this.userService = userService;
    this.tokenService = tokenService;
    this.credentialService = credentialService;
    this.logger = logger;
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
        role: Roles.CUSTOMER,
      });
      this.logger.info("The user has been created", { id: user.id });

      const payload: JwtPayload = {
        sub: String(user.id),
        role: user.role,
      };

      const accessToken = this.tokenService.generateAccessToken(payload);
      const newRefreshToken = await this.tokenService.persistRefreshToken(user);

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

  async login(req: RegisterUserRequest, res: Response, next: NextFunction) {
    //Validating email
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }

    const { email, password } = req.body;

    // const userService = new UserService();
    this.logger.debug("Request to login a user", {
      email,
      password: "*******",
    });

    //Check if userName(email) exists inside the database
    //Compare password
    //Generate tokens
    //Add token to cookies
    //Return the response (id)

    try {
      const user = await this.userService.findByEmail(email);
      if (!user) {
        const error = createHttpError(
          400,
          "Email or password does not matched",
        );
        next(error);
        return;
      }

      //Compare password
      const passwordMatched = await this.credentialService.comparePassword(
        password,
        user.password,
      );

      if (!passwordMatched) {
        const error = createHttpError(
          400,
          "Email or password does not matched",
        );
        next(error);
        return;
      }

      const payload: JwtPayload = {
        sub: String(user.id),
        role: user.role,
      };

      const accessToken = this.tokenService.generateAccessToken(payload);
      const newRefreshToken = await this.tokenService.persistRefreshToken(user);

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
      this.logger.info("User has been successfully logged in", {
        id: user.id,
      });
      res.status(200).json({ id: user.id });
    } catch (e) {
      next(e);
      return;
    }
  }

  async self(req: AuthRequest, res: Response) {
    //token req.auth.id
    // console.log(req.auth);
    const user = await this.userService.findById(Number(req.auth.sub));
    res.json({ ...user, password: undefined });
  }

  async refresh(req: AuthRequest, res: Response, next: NextFunction) {
    // console.log(req.auth);

    try {
      //If its coming here after passing through the middleware it means my Refresh token is not revoked and its a valid one so i need to return a new a access token
      const payload: JwtPayload = {
        sub: String(req.auth.sub),
        role: req.auth.role,
      };

      const accessToken = this.tokenService.generateAccessToken(payload);

      const user = await this.userService.findById(Number(req.auth.sub));
      if (!user) {
        const error = createHttpError(
          400,
          "User with the token could not find",
        );
        next(error);
        return;
      }
      const newRefreshToken = await this.tokenService.persistRefreshToken(user);

      //Delete old refresh Token ( RefreshToken Rotation)
      await this.tokenService.deleteRefreshToken(Number(req.auth.id));

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
      this.logger.info("User has been successfully logged in", {
        id: user.id,
      });
      res.status(200).json({ id: user.id });
    } catch (err) {
      next(err);
      return;
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    //Delete the refresh Token by getting the refresh id inside the token
    try {
      await this.tokenService.deleteRefreshToken(Number(req.auth.id));
      this.logger.info("Refresh token has been deleted", {
        id: req.auth.id,
      });
      this.logger.info("User has been succesfully logged out", {
        id: req.auth.sub,
      });
      res.clearCookie("refreshToken");
      res.clearCookie("accessToken");
      res.json({});
    } catch (err) {
      next(err);
      return;
    }
  }
}
