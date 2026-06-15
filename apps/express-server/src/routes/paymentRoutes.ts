// routes/paymentRoutes.ts
import { Router } from "express";
import {
    initiatePayment,
    handleMoMoWebhook,
    handleZaloPayCallback,
    getPaymentStatus,
    renderMockCheckout,
    handleMockSubmit,
} from "../controllers/paymentController";
import { requireStudent } from "../middlewares/authMiddleware";

const router = Router();

// POST /api/payment/initiate — app calls this to create a payment order
router.post("/initiate", requireStudent, initiatePayment);

// GET /api/payment/mock-checkout — renders local checkout page
router.get("/mock-checkout", renderMockCheckout);

// POST /api/payment/mock-submit — processes success/fail mock response
router.post("/mock-submit", handleMockSubmit);

// POST /api/payment/momo/webhook — MoMo calls this after payment (no user auth)
router.post("/momo/webhook", handleMoMoWebhook);

// POST /api/payment/zalopay/callback — ZaloPay calls this after payment (no user auth)
router.post("/zalopay/callback", handleZaloPayCallback);

// GET /api/payment/status/:orderId — app polls this to check result
router.get("/status/:orderId", requireStudent, getPaymentStatus);

export default router;
