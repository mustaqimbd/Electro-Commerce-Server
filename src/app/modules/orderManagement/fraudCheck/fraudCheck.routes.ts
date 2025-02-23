import { Router } from "express";
import { FraudCheckController } from "./fraudCheck.controller";
import authGuard from "../../../middlewares/authGuard";

const router = Router();

router.get(
  "/fraud-customers/:mobile",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
  }),
  FraudCheckController.fraudCheck
);

export const FraudCheckRoutes = router;
