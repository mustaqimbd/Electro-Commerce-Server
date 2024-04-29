import { Router } from "express";
import validateRequest from "../../middlewares/validateRequest";
import { CourierController } from "./courier.controller";
import { CourierValidation } from "./courier.validation";

const router = Router();

router.post(
  "/",
  validateRequest(CourierValidation.createCourier),
  CourierController.createCourier
);

export const CourierRoutes = router;
