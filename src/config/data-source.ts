import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../entity/User";
import { CONFIG } from ".";
import { RefreshToken } from "../entity/RefreshToken";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: CONFIG.DB_HOST,
  port: Number(CONFIG.DB_PORT),
  username: CONFIG.DB_USERNAME,
  password: CONFIG.DB_PASSWORD,
  database: CONFIG.DB_NAME,
  //Dont use syncronize in production as true
  // synchronize: CONFIG.NODE_ENV === "test" || CONFIG.NODE_ENV === "dev",
  synchronize: false, //Here since from the test we are manually calling the synchronise do we commented it and kept it false here
  logging: false,
  entities: [User, RefreshToken],
  migrations: [],
  subscribers: [],
});
