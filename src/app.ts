import compression from "compression";
import MongoStore from "connect-mongo";
import cookieParser from "cookie-parser";
import cors, { CorsOptions } from "cors";
import express, { Application } from "express";
import session, { SessionOptions } from "express-session";
import userAgent from "express-useragent";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";
import path from "path";
import requestIp from "request-ip";
import config from "./app/config/config";
import globalErrorhandler from "./app/middlewares/globalErrorHandler";
import { notFoundRoute } from "./app/middlewares/notFoundRoute";
import router from "./app/routes";
import successResponse from "./app/utilities/successResponse";
const app: Application = express();

const corsOptions: CorsOptions = {
  origin: config.clientSideURL?.split(","),
  credentials: true,
};

const sessionOptions: SessionOptions = {
  secret: config.session_secret as string,
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: config.DBUrl }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * Number(config.session_expires),
    httpOnly: true,
    secure: config.env === "production",
  },
};

// Middlewares
app.use(session(sessionOptions));
app.use(express.json());
app.use(cors(corsOptions));
app.use(compression());
app.use(helmet());
app.use(cookieParser());
app.use(userAgent.express());
app.use(requestIp.mw());
if (config.env === "development") {
  app.use(morgan("dev"));
}

// Root route
app.get("/api/v1", (req, res) => {
  successResponse(res, {
    statusCode: 200,
    message: "Server sunning successfully.",
  });
});

// static files
const uploadsPath = path.join(__dirname, "..", "uploads/public");
app.use("/uploads/public", express.static(uploadsPath));

//fake user id for testing
app.use("/api/v1", (req, res, next) => {
  req.user = {};
  req.user.id = new mongoose.Types.ObjectId("5f8f4cb272e4b01d9c23cd58");
  next();
});

app.use("/api/v1", router);

// Global error handler
app.use(globalErrorhandler);

// handle not found route
app.use(notFoundRoute);

export default app;
