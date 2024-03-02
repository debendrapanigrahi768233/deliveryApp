import express, { NextFunction, Request, Response } from "express";
import logger from "./config/logger";
import createHttpError, { HttpError } from "http-errors";

const app = express();

app.get("/", async (req, res, next) => {
  const error = createHttpError(401, "error created");
  // throw error;
  return next(error);
  // res.send("welcome to auth service");
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
  // if (err instanceof Error) {
  logger.error(err.message);
  const statusCode = err.statusCode || 500;
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
