import { Router } from "express";
import { optionalAuth, requireStudent } from "../middlewares/authMiddleware";
import { getUserProfile, updateUserData, updateUserEmail, updateUserPassword } from "../controllers/userController";

const router = Router();

// Route target: GET /api/user/profile
// The requireStudent middleware intercepts first, runs the JWKS verify check, sets req.user, then passes forward!
router.get("/profile", optionalAuth, getUserProfile);

router.put("/data", requireStudent, updateUserData);
router.put("/password", requireStudent, updateUserPassword);
router.put("/email", requireStudent, updateUserEmail);

export default router;
