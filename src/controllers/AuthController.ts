import { Response } from "express";
// import { AppDataSource } from "../config/data-source";
// import { User } from "../entity/User";
import { RegisterUserRequest } from "../types";
import { UserService } from "../services/UserService";
import { NextFunction } from "express-serve-static-core";
import { Logger } from "winston";
import { validationResult } from "express-validator";

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
      res.status(201).json({ id: user.id });
    } catch (e) {
      next(e);
      return;
    }
  }
}
