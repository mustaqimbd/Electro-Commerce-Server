import compression from "compression";
import cookieParser from "cookie-parser";
import cors, { CorsOptions } from "cors";
import express, { Application } from "express";
import helmet from "helmet";
import morgan from "morgan";
import globalErrorhandler from "./app/middlewares/globalErrorHandler";
import { notFoundRoute } from "./app/middlewares/notFoundRoute";
import config from "./config";
import successResponse from "./shared/successResponse";

const app: Application = express();

const corsOptions: CorsOptions = {
  origin: [config.clientSideURL as string],
  credentials: true,
};
// Middlewares
app.use(express.json());
app.use(cors(corsOptions));
app.use(compression());
app.use(helmet());
app.use(cookieParser());

if (config.env === "development") {
  app.use(morgan("dev"));
}

// test
app.get("/api/v1", (req, res) => {
  successResponse(res, {
    statusCode: 200,
  });
});

// Global error handler
app.use(globalErrorhandler);

// handle not found route
app.use(notFoundRoute);

export default app;
