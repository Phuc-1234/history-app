// routes/paymentRoutes.ts
import { Router } from "express";
import {
    initiatePayment,
    handleSePayWebhook,
    handleZaloPayCallback,
    getPaymentStatus,
    renderMockCheckout,
    handleMockSubmit,
    renderSePayCheckout,
} from "../controllers/paymentController";
import { requireStudent } from "../middlewares/authMiddleware";

const router = Router();

// POST /api/payment/initiate — app calls this to create a payment order
router.post("/initiate", requireStudent, initiatePayment);

// GET /api/payment/mock-checkout — renders local checkout page
router.get("/mock-checkout", renderMockCheckout);

// POST /api/payment/mock-submit — processes success/fail mock response
router.post("/mock-submit", handleMockSubmit);

// GET /api/payment/sepay-checkout — renders VietQR scanning page with polling
router.get("/sepay-checkout", renderSePayCheckout);

// POST /api/payment/sepay/webhook — SePay calls this after bank transfer (no user auth)
router.post("/sepay/webhook", handleSePayWebhook);

// POST /api/payment/zalopay/callback — ZaloPay calls this after payment (no user auth)
router.post("/zalopay/callback", handleZaloPayCallback);

// GET /api/payment/status/:orderId — app and browser poll this to check result
router.get("/status/:orderId", getPaymentStatus);

export default router;
