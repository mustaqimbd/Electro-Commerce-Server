import { Router } from "express";
import authGuard from "../../middlewares/authGuard";
import validateRequest from "../../middlewares/validateRequest";
import { DistrictController } from "./district.controller";
import { DistrictValidation } from "./district.validation";

const router = Router();

router.post(
  "/",
  authGuard({ requiredRoles: ["admin"] }),
  validateRequest(DistrictValidation.create),
  DistrictController.create
);
router.get("/", DistrictController.getAllDistricts);

export const DistrictRoutes = router;
