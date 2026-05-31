// routes/authRoutes.ts
import { Router } from "express";
import {
    registerUser,
    loginUser,
    verifyOtp,
} from "../controllers/authController";

const router = Router();

// Route: POST /api/auth/register
router.post("/register", registerUser);

// Route: POST /api/auth/login
router.post("/login", loginUser);

router.post("/verify-otp", verifyOtp);

export default router;
