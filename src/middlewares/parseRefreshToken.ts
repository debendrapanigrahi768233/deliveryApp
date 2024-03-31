import { Request } from "express";
import { expressjwt } from "express-jwt";
import { CONFIG } from "../config";
import { AuthCookie } from "../types";

//It will return a middleware that we can directly plug into our route
export default expressjwt({
  secret: String(CONFIG.SECRET_TOKEN_KEY),
  algorithms: ["HS256"],
  getToken(req: Request) {
    const { refreshToken } = req.cookies as AuthCookie;
    return refreshToken;
  },
});
