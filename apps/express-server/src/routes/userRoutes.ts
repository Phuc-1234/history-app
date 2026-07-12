import { Router } from "express";
import { optionalAuth, requireStudent } from "../middlewares/authMiddleware";
import {
    getUserProfile,
    updateUserProfile,
    changeUserPassword,
    updateUserData,
    updateUserEmail,
} from "../controllers/userController";
import { createFeedback, getUserFeedbackHistory } from "../controllers/feedbackController";

const router = Router();

// Route target: GET /api/user/profile
router.get("/profile", optionalAuth, getUserProfile);

// Route target: PUT /api/user/profile
router.put("/profile", requireStudent, updateUserProfile);

// Route target: PUT /api/user/change-password
router.put("/change-password", requireStudent, changeUserPassword);

// New Routes
// Route target: PUT /api/user/data
router.put("/data", requireStudent, updateUserData);

// Route target: PUT /api/user/email
router.put("/email", requireStudent, updateUserEmail);

// Route target: PUT /api/user/password
router.put("/password", requireStudent, changeUserPassword);

// Route target: POST /api/user/feedback
router.post("/feedback", requireStudent, createFeedback);

// Route target: GET /api/user/feedback/history
router.get("/feedback/history", requireStudent, getUserFeedbackHistory);

export default router;
