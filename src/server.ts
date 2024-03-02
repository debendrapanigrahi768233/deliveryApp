import app from "./app";
import { CONFIG } from "./config";
import logger from "./config/logger";

const startServer = () => {
  try {
    app.listen(CONFIG.PORT, () => {
      logger.debug("debug message");
      logger.info(`Listening on port ${CONFIG.PORT}`);
    });
  } catch (e: unknown) {
    if (e instanceof Error) {
      logger.error(e.message);
      process.exit(1);
    }
  }
};
startServer();
