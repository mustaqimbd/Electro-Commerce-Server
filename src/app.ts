import compression from "compression";
import cookieParser from "cookie-parser";
import cors, { CorsOptions } from "cors";
import express, { Application } from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import config from "./app/config";
import globalErrorhandler from "./app/middlewares/globalErrorHandler";
import { notFoundRoute } from "./app/middlewares/notFoundRoute";
import router from "./app/routes";
import successResponse from "./app/shared/successResponse";
import mongoose from "mongoose";

const app: Application = express();

const corsOptions: CorsOptions = {
  origin: config.clientSideURL?.split(","),
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
    message: "Server sunning successfully.",
  });
});

// static files
const uploadsPath = path.join(__dirname, "..", "uploads/public");
app.use("/uploads/public", express.static(uploadsPath));

// for testing purpose
app.use("/api/v1", (req, res, next) => {
  req.user = {};
  req.user._id = new mongoose.Types.ObjectId("658d6b8eb1340407b7148545");
  next();
});

app.use("/api/v1", router);

// Global error handler
app.use(globalErrorhandler);

// handle not found route
app.use(notFoundRoute);

export default app;
