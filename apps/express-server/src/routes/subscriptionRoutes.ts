import { Router } from "express";
import {
    initiateSubscription,
    cancelSubscription,
    getSubscriptionStatus,
    renderSubscriptionCheckout,
    handleMockSubscriptionSubmit,
} from "../controllers/subscriptionController";
import { requireStudent } from "../middlewares/authMiddleware";

const router = Router();

// POST /api/subscription/subscribe — app calls this to subscribe to Pro package
router.post("/subscribe", requireStudent, initiateSubscription);

// POST /api/subscription/cancel — app calls this to cancel subscription auto-renewal
router.post("/cancel", requireStudent, cancelSubscription);

// GET /api/subscription/status/:orderId — app/browser polls this to check status
router.get("/status/:orderId", getSubscriptionStatus);

// GET /api/subscription/checkout — renders scanning VietQR and polling page
router.get("/checkout", renderSubscriptionCheckout);

// POST /api/subscription/mock-submit — handles success/fail mock response
router.post("/mock-submit", handleMockSubscriptionSubmit);

export default router;
