import { consoleLogger, errorLogger, logger } from "./app/utilities/logger";

process.on("uncaughtException", (error) => {
  consoleLogger.error(
    "😴 `Uncaught exception` happened, exiting the process and  closing the server.",
    error
  );

  process.exit(1);
});

import { Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import config from "./app/config/config";

let server: Server;
const bootstrap = async () => {
  try {
    await mongoose.connect(config.DBUrl as string);
    consoleLogger.info(`===${config.env}===`);
    logger.info(`👌 Database is connected successfully.`);
    server = app.listen(config.port, () => {
      logger.info(
        `😍 The server is running on http://localhost:${config.port}`
      );
    });
  } catch (error) {
    errorLogger.error(`❌ Can't connect to Database.`, error);
  }

  process.on("unhandledRejection", (error) => {
    errorLogger.error(
      `😴 Unhandled rejection happened. Exiting the process.`,
      error
    );
    if (server) {
      server.close(() => {
        process.exit(1);
      });
    }
    process.exit(1);
  });
};

bootstrap();
