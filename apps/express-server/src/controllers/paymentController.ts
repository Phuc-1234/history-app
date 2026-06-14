// controllers/paymentController.ts
import { Request, Response } from "express";
import { paymentService } from "../services/paymentService";
import {
    InitiatePaymentRequestBody,
    InitiatePaymentResponse,
    GetPaymentStatusResponse,
    MoMoIpnPayload,
    ZaloPayCallbackPayload,
} from "../types/payment";

// POST /api/payment/initiate
export const initiatePayment = async (
    req: Request<{}, InitiatePaymentResponse | { error: string }, InitiatePaymentRequestBody>,
    res: Response<InitiatePaymentResponse | { error: string }>,
): Promise<Response> => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Access denied. Valid session missing." });
        }

        const { provider, goldAmount } = req.body;

        if (!provider || !["MOMO", "ZALOPAY"].includes(provider)) {
            return res.status(400).json({ error: "provider phải là MOMO hoặc ZALOPAY." });
        }

        if (!goldAmount || !Number.isInteger(goldAmount) || goldAmount < 1 || goldAmount > 100) {
            return res.status(400).json({ error: "goldAmount phải là số nguyên từ 1 đến 100." });
        }

        if (!process.env.PAYMENT_IPN_URL) {
            return res.status(500).json({ error: "PAYMENT_IPN_URL chưa được cấu hình." });
        }

        const result = await paymentService.initiatePayment(req.user.id, provider, goldAmount);
        return res.status(200).json(result);
    } catch (error: any) {
        console.error("initiatePayment error:", error);
        return res.status(500).json({ error: error.message || "Lỗi khi tạo đơn thanh toán." });
    }
};

// POST /api/payment/momo/webhook  — called by MoMo server (no auth header)
export const handleMoMoWebhook = async (
    req: Request<{}, any, MoMoIpnPayload>,
    res: Response,
): Promise<Response> => {
    try {
        await paymentService.handleMoMoWebhook(req.body);
        // MoMo expects this exact response to confirm receipt
        return res.status(200).json({ message: "OK" });
    } catch (error: any) {
        console.error("handleMoMoWebhook error:", error);
        // Still return 200 to MoMo so they don't retry indefinitely
        return res.status(200).json({ message: "ERROR", error: error.message });
    }
};

// POST /api/payment/zalopay/callback  — called by ZaloPay server (no auth header)
export const handleZaloPayCallback = async (
    req: Request<{}, any, ZaloPayCallbackPayload>,
    res: Response,
): Promise<Response> => {
    try {
        await paymentService.handleZaloPayCallback(req.body);
        // ZaloPay expects return_code: 1 for success
        return res.status(200).json({ return_code: 1, return_message: "success" });
    } catch (error: any) {
        console.error("handleZaloPayCallback error:", error);
        return res.status(200).json({ return_code: 0, return_message: error.message });
    }
};

// GET /api/payment/status/:orderId  — polled by the app
export const getPaymentStatus = async (
    req: Request<{ orderId: string }, GetPaymentStatusResponse | { error: string }>,
    res: Response<GetPaymentStatusResponse | { error: string }>,
): Promise<Response> => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Access denied. Valid session missing." });
        }

        const { orderId } = req.params;
        const result = await paymentService.getPaymentStatus(orderId);

        if (!result) {
            return res.status(404).json({ error: "Không tìm thấy đơn hàng." });
        }

        return res.status(200).json(result as GetPaymentStatusResponse);
    } catch (error: any) {
        console.error("getPaymentStatus error:", error);
        return res.status(500).json({ error: "Lỗi khi lấy trạng thái đơn hàng." });
    }
};
