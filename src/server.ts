import app from "./app";
import { CONFIG } from "./config";

const startServer = () => {
  try {
    app.listen(CONFIG.PORT, () => {
      console.log(`listening on port ${CONFIG.PORT}`);
    });
  } catch (e) {
    console.error(e);
  }
};
startServer();
