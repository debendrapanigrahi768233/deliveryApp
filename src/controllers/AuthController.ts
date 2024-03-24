import { CONFIG } from "../config/index";
import { Response } from "express";
import fs from "fs";

// import { AppDataSource } from "../config/data-source";
// import { User } from "../entity/User";
import { RegisterUserRequest } from "../types";
import { UserService } from "../services/UserService";
import { NextFunction } from "express-serve-static-core";
import { Logger } from "winston";
import { validationResult } from "express-validator";
import { JwtPayload, sign } from "jsonwebtoken";
import path from "path";
import createHttpError from "http-errors";

export class AuthController {
  userService: UserService;
  logger: Logger;
  constructor(userService: UserService, logger: Logger) {
    this.userService = userService;
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
      });
      this.logger.info("The user has been created", { id: user.id });

      let privateKey: Buffer;
      try {
        privateKey = fs.readFileSync(
          path.join(__dirname, "../../certs/private.pem"),
        );
      } catch (err) {
        const error = createHttpError(
          500,
          "Error while reading private key file",
        );
        next(error);
        return;
      }

      const payload: JwtPayload = {
        sub: String(user.id),
        role: user.role,
      };

      const accessToken = sign(payload, privateKey, {
        algorithm: "RS256",
        expiresIn: "1h",
        issuer: "auth-service",
      });

      const secretToken: string = String(CONFIG.SECRET_TOKEN_KEY);

      const refreshToken = sign(payload, secretToken, {
        algorithm: "HS256",
        expiresIn: "1y",
        issuer: "auth-service",
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
