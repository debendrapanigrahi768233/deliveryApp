import "reflect-metadata";

import express from "express";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import createHttpError, { HttpError } from "http-errors";
import authRouter from "./routes/auth";
import cookieParser from "cookie-parser";
import tenantRouter from "./routes/tenant";
import userRouter from "./routes/user";
import cors from "cors";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";

const app = express();
app.use(
  cors({
    origin: ["http://localhost:5174", "http://localhost:5173"],
    credentials: true,
  }),
);
app.use(express.static("public"));
app.use(cookieParser());
app.use(express.json());

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.get("/", (req, res, next) => {
  res.send("welcome to auth service");
});

app.use("/auth", authRouter);
app.use("/tenants", tenantRouter);
app.use("/users", userRouter);

app.use(globalErrorHandler);

export default app;
