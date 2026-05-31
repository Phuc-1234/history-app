import { Router } from "express";
import { optionalAuth, requireStudent } from "../middlewares/authMiddleware";
import { getUserProfile } from "../controllers/userController";

const router = Router();

// Route target: GET /api/user/profile
// The requireStudent middleware intercepts first, runs the JWKS verify check, sets req.user, then passes forward!
router.get("/profile", optionalAuth, getUserProfile);

export default router;
