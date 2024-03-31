import { Request } from "express";
import { expressjwt } from "express-jwt";
import { CONFIG } from "../config";
import { AuthCookie, IRefreshTokenPayload } from "../types";
import { AppDataSource } from "../config/data-source";
import { RefreshToken } from "../entity/RefreshToken";
import logger from "../config/logger";

//It will return a middleware that we can directly plug into our route
export default expressjwt({
  secret: String(CONFIG.SECRET_TOKEN_KEY),
  algorithms: ["HS256"],
  getToken(req: Request) {
    const { refreshToken } = req.cookies as AuthCookie;
    return refreshToken;
  },
  async isRevoked(req: Request, token) {
    try {
      const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);
      const refreshToken = refreshTokenRepo.findOne({
        where: {
          id: Number((token?.payload as IRefreshTokenPayload).id),
          user: { id: Number(token?.payload.sub) },
        },
      });
      return refreshToken === null;
    } catch (err) {
      logger.error("Error while fetching the refresh token", {
        id: token?.payload as IRefreshTokenPayload,
      });
    }
    return true;
  },
});
