import { CredentialService } from "./../services/CredentialService";
import express, {
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";
import { AuthController } from "../controllers/AuthController";
import { UserService } from "../services/UserService";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";
import logger from "../config/logger";
import registerValidator from "../validators/register-validator";
import { TokenService } from "../services/TokenService";
import { RefreshToken } from "../entity/RefreshToken";
import loginValidator from "../validators/login-validator";
import authenticate from "../middlewares/authenticate";
import { AuthRequest } from "../types";
import validateResfreshToken from "../middlewares/validateResfreshToken";
import parseRefreshToken from "../middlewares/parseRefreshToken";

const router = express.Router();

//This three lines is called dependency injection where we are passing the dependency to the constructor from outside
const userRepository = AppDataSource.getRepository(User);
const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
const userService = new UserService(userRepository);
const tokenService = new TokenService(refreshTokenRepository);
const credentialService = new CredentialService();
const authController = new AuthController(
  userService,
  tokenService,
  credentialService,
  logger,
);

router.post("/register", registerValidator, (async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  await authController.register(req, res, next);
}) as RequestHandler);

router.post(
  "/login",
  loginValidator,
  (req: Request, res: Response, next: NextFunction) =>
    authController.login(req, res, next) as unknown as RequestHandler,
);

router.get(
  "/self",
  authenticate as RequestHandler,
  (req: Request, res: Response) =>
    authController.self(req as AuthRequest, res) as unknown as RequestHandler,
);

router.post(
  "/refresh",
  validateResfreshToken as RequestHandler,
  (req: Request, res: Response, next: NextFunction) =>
    authController.refresh(
      req as AuthRequest,
      res,
      next,
    ) as unknown as RequestHandler,
);

//Always post request
router.post(
  "/logout",
  authenticate as RequestHandler,
  parseRefreshToken as RequestHandler,
  (req: Request, res: Response, next: NextFunction) =>
    authController.logout(
      req as AuthRequest,
      res,
      next,
    ) as unknown as RequestHandler,
);

export default router;
