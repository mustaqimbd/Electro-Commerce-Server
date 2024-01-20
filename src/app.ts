import express, { Application } from "express";
import globalErrorhandler from "./app/middlewares/globalErrorHandler";
import { notFoundRoute } from "./app/middlewares/notFoundRoute";
import successResponse from "./shared/successResponse";

const app: Application = express();

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
