// routes/packageRoutes.ts
import { Router } from "express";
import {
    listGoldPackagesPublic,
    listProPackagesPublic,
} from "../controllers/packageController";

const router = Router();

// GET /api/packages/gold — Get active Gold packages
router.get("/gold", listGoldPackagesPublic);

// GET /api/packages/pro — Get active Pro packages
router.get("/pro", listProPackagesPublic);

export default router;
