import winston from "winston";
import { CONFIG } from ".";
const logger = winston.createLogger({
  level: "info",
  defaultMeta: {
    serviceName: "auth-service",
  },
  transports: [
    new winston.transports.File({
      dirname: "logs",
      filename: "app.log",
      level: "debug",
      silent: CONFIG.NODE_ENV === "test",
    }),
    new winston.transports.File({
      dirname: "logs",
      filename: "error.log",
      level: "error",
      silent: CONFIG.NODE_ENV === "test",
    }),
    new winston.transports.Console({
      level: "info", //Here we are overriding the level of root level
      format: winston.format.combine(
        //order is important first timestamp then json
        winston.format.timestamp(),
        winston.format.json(),
      ),
      silent: CONFIG.NODE_ENV === "test",
    }),
  ],
});

export default logger;
