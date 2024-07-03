import "reflect-metadata";

import express, { NextFunction, Request, Response } from "express";
import logger from "./config/logger";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import createHttpError, { HttpError } from "http-errors";
import authRouter from "./routes/auth";
import cookieParser from "cookie-parser";
import tenantRouter from "./routes/tenant";

const app = express();
app.use(express.static("public"));
app.use(cookieParser());
app.use(express.json());

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.get("/", async (req, res, next) => {
  res.send("welcome to auth service");
});

app.use("/auth", authRouter);
app.use("/tenants", tenantRouter);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
  // if (err instanceof Error) {
  logger.error(err.message);
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    errors: [
      {
        type: err.name,
        msg: err.message,
        path: "",
        location: "",
      },
    ],
  });
  // }
});

export default app;
