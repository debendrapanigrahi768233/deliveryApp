import { AppDataSource } from "./config/data-source";
import app from "./app";
import { CONFIG } from "./config";
import logger from "./config/logger";

const startServer = async () => {
  try {
    await AppDataSource.initialize();
    logger.info("Database connected successfully");
    app.listen(CONFIG.PORT, () => {
      // logger.debug("debug message");
      logger.info(`Listening on port ${CONFIG.PORT}`);
    });
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.log(e);
      logger.error(e.message);
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    }
  }
};
void startServer();
