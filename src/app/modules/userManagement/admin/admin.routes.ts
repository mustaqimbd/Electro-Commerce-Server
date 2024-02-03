import { Router } from "express";
import { AdminControllers } from "./admin.controller";

const router = Router();

router.patch("/", AdminControllers.updateAdmin);

export const AdminRoutes = router;
