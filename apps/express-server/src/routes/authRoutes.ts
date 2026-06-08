// routes/authRoutes.ts
import { Router } from "express";
import {
    registerUser,
    loginUser,
    verifyOtp,
    refreshSessionToken,
    resendOtp,
    verifyGoogleSession
} from "../controllers/authController";



const router = Router();

// Route: POST /api/auth/register
router.post("/register", registerUser);

// Route: POST /api/auth/login
router.post("/login", loginUser);

router.post("/verify-otp", verifyOtp);

router.post("/refresh-token", refreshSessionToken);

router.post('/resend-otp', resendOtp);

router.post("/google/verify", verifyGoogleSession);

export default router;
