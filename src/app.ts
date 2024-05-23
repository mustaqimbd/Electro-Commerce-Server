import compression from "compression";

import cookieParser from "cookie-parser";
import cors, { CorsOptions } from "cors";
import express, { Application } from "express";
import userAgent from "express-useragent";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import requestIp from "request-ip";
import config from "./app/config/config";
import "./app/crons";
import { ecSIDHandler } from "./app/middlewares/ecSID";
import enableCrossOriginResourcePolicy from "./app/middlewares/enableCrossOriginResourcePolicy";
import globalErrorhandler from "./app/middlewares/globalErrorHandler";
import { notFoundRoute } from "./app/middlewares/notFoundRoute";
import router from "./app/routes";
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

if (config.env === "production") {
  app.set("trust proxy", 1);
}

// Middlewares
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

// handle custom session
app.use(ecSIDHandler);

// Root route
app.get("/", (req, res) => {
  res.redirect(`http://${config.main_domain}`);
});

// static files
const uploadsPath = path.join(__dirname, "..", "uploads/public");
app.use(
  "/uploads/public",
  enableCrossOriginResourcePolicy,
  express.static(uploadsPath)
);

// api endpoints
app.use("/api/v1", router);

// Global error handler
app.use(globalErrorhandler);

// handle not found route
app.use(notFoundRoute);

export default app;
