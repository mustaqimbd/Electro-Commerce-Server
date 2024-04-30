import { Router } from "express";
import { WarrantyClaimController } from "./warrantyClaim.controller";

const router = Router();

router.get("/check-warranty", WarrantyClaimController.updateWarranty);

export const WarrantyClaimRoutes = router;
