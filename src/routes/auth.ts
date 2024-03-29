import express, { NextFunction, Request, Response } from "express";
import { AuthController } from "../controllers/AuthController";
import { UserService } from "../services/UserService";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";
import logger from "../config/logger";
import registerValidator from "../validators/register-validator";
import { TokenService } from "../services/TokenService";
import { RefreshToken } from "../entity/RefreshToken";

const router = express.Router();

//This three lines is called dependency injection where we are passing the dependency to the constructor from outside
const userRepository = AppDataSource.getRepository(User);
const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
const userService = new UserService(userRepository);
const tokenService = new TokenService(refreshTokenRepository);
const authController = new AuthController(userService, tokenService, logger);

router.post(
  "/register",
  registerValidator,
  (req: Request, res: Response, next: NextFunction) =>
    authController.register(req, res, next),
);

export default router;
