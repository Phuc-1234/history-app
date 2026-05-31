// routes/authRoutes.ts
import { Router } from "express";
import {
    registerUser,
    loginUser,
    verifyOtp,
    refreshSessionToken
} from "../controllers/authController";

const router = Router();

// Route: POST /api/auth/register
router.post("/register", registerUser);

// Route: POST /api/auth/login
router.post("/login", loginUser);

router.post("/verify-otp", verifyOtp);

router.post("/refresh-token", refreshSessionToken);

export default router;
