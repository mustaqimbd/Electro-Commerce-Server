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
import "./app/crons";
import enableCrossOriginResourcePolicy from "./app/middlewares/enableCrossOriginResourcePolicy";
import globalErrorhandler from "./app/middlewares/globalErrorHandler";
import { notFoundRoute } from "./app/middlewares/notFoundRoute";
import router from "./app/routes";
import successResponse from "./app/utilities/successResponse";
const app: Application = express();

const corsOptions: CorsOptions = {
  origin:
    config.env === "production"
      ? config.clientSideURL?.split(",")
      : ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: "Content-Type, Authorization",
};

const sessionOptions: SessionOptions = {
  secret: config.session_secret as string,
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: config.DBUrl }),
  cookie: {
    domain:
      config.env === "production" ? `.${config.main_domain}` : "localhost",
    httpOnly: config.env === "production",
    secure: config.env === "production",
    sameSite: "lax",
    maxAge: Number(config.session_expires),
  },
};

if (config.env === "production") {
  app.set("trust proxy", 1);
}

// Middlewares
app.use(session(sessionOptions));
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());
app.use(compression());
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
app.use(
  "/uploads/public",
  enableCrossOriginResourcePolicy,
  express.static(uploadsPath)
);

// fake user id for testing
app.use("/api/v1", (req, res, next) => {
  req.user = {};
  req.user.id = new mongoose.Types.ObjectId("5f8f4cb272e4b01d9c23cd58");
  next();
});

// api endpoints
app.use("/api/v1", router);

// Global error handler
app.use(globalErrorhandler);

// handle not found route
app.use(notFoundRoute);

export default app;
