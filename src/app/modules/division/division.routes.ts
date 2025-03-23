import { Router } from "express";
import authGuard from "../../middlewares/authGuard";
import validateRequest from "../../middlewares/validateRequest";
import { DivisionController } from "./division.controller";
import { DivisionValidation } from "./division.validation";

const router = Router();

router.post(
  "/",
  authGuard({ requiredRoles: ["admin"] }),
  validateRequest(DivisionValidation.create),
  DivisionController.create
);
router.get("/", DivisionController.getAllDivisions);

export const DivisionRoutes = router;
