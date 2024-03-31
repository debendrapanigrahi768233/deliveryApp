import { JwtPayload, sign } from "jsonwebtoken";
import fs from "fs";
import path from "path";
import createHttpError from "http-errors";
import { CONFIG } from "../config";
import { User } from "../entity/User";
import { RefreshToken } from "../entity/RefreshToken";
import { Repository } from "typeorm";

//All database query we delegate to token service
export class TokenService {
  constructor(private refreshTokenRepository: Repository<RefreshToken>) {}
  generateAccessToken(payload: JwtPayload) {
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
      //   next(error);
      //   return;
      throw error;
    }
    const accessToken = sign(payload, privateKey, {
      algorithm: "RS256",
      expiresIn: "1h",
      issuer: "auth-service",
    });
    return accessToken;
  }

  generateRefreshToken(payload: JwtPayload) {
    const secretToken: string = String(CONFIG.SECRET_TOKEN_KEY);
    const refreshToken = sign(payload, secretToken, {
      algorithm: "HS256",
      expiresIn: "1y",
      issuer: "auth-service",
      jwtid: String(payload.id),
    });
    return refreshToken;
  }

  //Persist the refresh token
  async persistRefreshToken(user: User) {
    const MS_IN_YEAR = 1000 * 60 * 60 * 24 * 365; //If leap year then 1y->366
    // const refreshRepository = AppDataSource.getRepository(RefreshToken);
    // const newRefreshToken = await refreshRepository.save({
    const newRefreshToken = await this.refreshTokenRepository.save({
      user: user,
      expiresAt: new Date(Date.now() + MS_IN_YEAR),
    });
    return newRefreshToken;
  }

  async deleteRefreshToken(tokenId: number) {
    return await this.refreshTokenRepository.delete({ id: tokenId });
  }
}
