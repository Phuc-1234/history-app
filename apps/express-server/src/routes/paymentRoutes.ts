// routes/paymentRoutes.ts
import { Router } from "express";
import {
    initiatePayment,
    handleMoMoWebhook,
    handleZaloPayCallback,
    getPaymentStatus,
} from "../controllers/paymentController";
import { requireStudent } from "../middlewares/authMiddleware";

const router = Router();

// POST /api/payment/initiate — app calls this to create a payment order
router.post("/initiate", requireStudent, initiatePayment);

// POST /api/payment/momo/webhook — MoMo calls this after payment (no user auth)
router.post("/momo/webhook", handleMoMoWebhook);

// POST /api/payment/zalopay/callback — ZaloPay calls this after payment (no user auth)
router.post("/zalopay/callback", handleZaloPayCallback);

// GET /api/payment/status/:orderId — app polls this to check result
router.get("/status/:orderId", requireStudent, getPaymentStatus);

export default router;
