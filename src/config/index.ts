import { config } from "dotenv";
import path from "path";

config({
  path: path.join(__dirname, `../../.env.${process.env.NODE_ENV || "dev"}`),
});

const {
  PORT,
  NODE_ENV,
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USERNAME,
  DB_PASSWORD,
  SECRET_TOKEN_KEY,
  JWKS_URI,
  PRIVATE_KEY,
} = process.env;

export const CONFIG = {
  PORT,
  NODE_ENV,
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USERNAME,
  DB_PASSWORD,
  SECRET_TOKEN_KEY,
  JWKS_URI,
  PRIVATE_KEY,
};
