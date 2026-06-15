import { Request, Response } from "express";
import { paymentService } from "../services/paymentService";
import { prisma } from "@history-app/shared";
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

// GET /api/payment/mock-checkout — renders HTML page with buttons to mock pay success/fail
export const renderMockCheckout = async (req: Request, res: Response): Promise<any> => {
    try {
        const { orderId } = req.query;
        if (!orderId) {
            return res.status(400).send("Thiếu orderId.");
        }

        const purchase = await paymentService.getPaymentStatus(orderId as string);
        if (!purchase) {
            return res.status(404).send("Không tìm thấy đơn hàng.");
        }

        const html = `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cổng Thanh Toán Demo - HistoryApp</title>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet">
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    background: linear-gradient(135deg, #18142C 0%, #0B0816 100%);
                    color: #FFFFFF;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                }
                .card {
                    background: rgba(255, 255, 255, 0.04);
                    backdrop-filter: blur(16px);
                    border: 1px rgba(255, 255, 255, 0.08) solid;
                    border-radius: 28px;
                    padding: 32px;
                    width: 90%;
                    max-width: 400px;
                    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
                    text-align: center;
                }
                h2 {
                    margin-top: 0;
                    font-weight: 800;
                    color: #9D85FF;
                    font-size: 24px;
                    letter-spacing: -0.5px;
                }
                .amount {
                    font-size: 36px;
                    font-weight: 800;
                    color: #34C759;
                    margin: 20px 0;
                }
                .details {
                    text-align: left;
                    background: rgba(255, 255, 255, 0.03);
                    padding: 18px;
                    border-radius: 20px;
                    margin-bottom: 24px;
                    font-size: 14px;
                    line-height: 1.6;
                    color: #B2ADC8;
                    border: 1px rgba(255, 255, 255, 0.03) solid;
                }
                .details-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                }
                .details-row:last-child {
                    margin-bottom: 0;
                }
                .btn {
                    display: block;
                    width: 100%;
                    padding: 16px;
                    border: none;
                    border-radius: 18px;
                    font-size: 16px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    margin-bottom: 12px;
                }
                .btn-success {
                    background: #5856D6;
                    color: white;
                    box-shadow: 0 8px 20px rgba(88, 86, 214, 0.35);
                }
                .btn-success:hover {
                    background: #4A48C0;
                    transform: translateY(-2px);
                }
                .btn-fail {
                    background: transparent;
                    border: 1px rgba(255, 255, 255, 0.15) solid;
                    color: #FF453A;
                }
                .btn-fail:hover {
                    background: rgba(255, 69, 58, 0.1);
                    border-color: #FF453A;
                }
                .footer-text {
                    font-size: 11px;
                    color: #6A6581;
                    margin-top: 24px;
                }
            </style>
        </head>
        <body>
            <div class="card" id="card">
                <h2>Demo Cổng Thanh Toán</h2>
                <p style="color: #8E8E93; font-size: 13px; margin-top: -8px;">Simulated Sandbox (Không trừ tiền thật)</p>
                
                <div class="amount">${purchase.amountVnd.toLocaleString("vi-VN")}đ</div>
                
                <div class="details">
                    <div class="details-row">
                        <span>Mã đơn hàng:</span>
                        <span style="font-family: monospace; color: #FFF;">${purchase.orderId.slice(0, 8)}...</span>
                    </div>
                    <div class="details-row">
                        <span>Cổng thanh toán:</span>
                        <strong style="color: #FFF;">${purchase.provider}</strong>
                    </div>
                    <div class="details-row">
                        <span>Số lượng Gold:</span>
                        <strong style="color: #FFD700;">${purchase.goldAmount} Gold 🥇</strong>
                    </div>
                </div>
                
                <button class="btn btn-success" onclick="submitPayment('SUCCESS')">Xác nhận thanh toán (Thành công)</button>
                <button class="btn btn-fail" onclick="submitPayment('FAILED')">Hủy thanh toán (Thất bại)</button>
                
                <div class="footer-text">Thử nghiệm thanh toán ngoại tuyến an toàn tại dự án HistoryApp.</div>
            </div>

            <script>
                async function submitPayment(status) {
                    const card = document.getElementById('card');
                    card.innerHTML = '<h3 style="color: #A79CFF; margin-top: 32px; margin-bottom: 32px;">Đang xử lý giao dịch...</h3>';
                    
                    try {
                        const response = await fetch('/api/payment/mock-submit', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ orderId: '${orderId}', status: status })
                        });
                        
                        const resData = await response.json();
                        
                        if (response.ok) {
                            card.innerHTML = \`
                                <div style="font-size: 64px; margin-bottom: 16px; margin-top: 16px;">\${status === 'SUCCESS' ? '🎉' : '❌'}</div>
                                <h2 style="color: \${status === 'SUCCESS' ? '#34C759' : '#FF453A'};">\${status === 'SUCCESS' ? 'Thành công!' : 'Đã hủy'}</h2>
                                <p style="color: #B3AECE; line-height: 1.6; margin-bottom: 24px; font-size: 15px;">
                                    \${status === 'SUCCESS' ? 'Đã nạp thành công ' + ${purchase.goldAmount} + ' Gold vào tài khoản của bạn.' : 'Bạn đã chọn hủy giao dịch này.'}
                                </p>
                                <p style="color: #6C6785; font-size: 12px; margin-bottom: 16px;">Bạn có thể đóng tab trình duyệt này để quay lại App.</p>
                            \`;
                        } else {
                            throw new Error(resData.error || 'Lỗi server');
                        }
                    } catch (e) {
                        card.innerHTML = \`
                            <div style="font-size: 64px; margin-bottom: 16px; margin-top: 16px;">⚠️</div>
                            <h2 style="color: #FF9500;">Lỗi kết nối</h2>
                            <p style="color: #B3AECE;">Không thể cập nhật kết quả: \${e.message}</p>
                            <button class="btn btn-success" style="margin-top: 16px;" onclick="window.location.reload()">Thử lại</button>
                        \`;
                    }
                }
            </script>
        </body>
        </html>
        `;
        return res.status(200).send(html);
    } catch (error: any) {
        console.error("renderMockCheckout error:", error);
        return res.status(500).send("Lỗi tải trang thanh toán demo.");
    }
};

// POST /api/payment/mock-submit — updates order status to SUCCESS or FAILED in database and increments gold
export const handleMockSubmit = async (req: Request, res: Response): Promise<any> => {
    try {
        const { orderId, status } = req.body;
        if (!orderId || !status || !["SUCCESS", "FAILED"].includes(status)) {
            return res.status(400).json({ error: "Thiếu dữ liệu hoặc status không hợp lệ." });
        }

        const purchase = await prisma.goldPurchase.findUnique({
            where: { id: orderId },
        });

        if (!purchase) {
            return res.status(404).json({ error: "Không tìm thấy đơn hàng." });
        }

        if (purchase.status !== "PENDING") {
            return res.status(400).json({ error: "Đơn hàng đã được xử lý trước đó." });
        }

        if (status === "SUCCESS") {
            await prisma.$transaction([
                prisma.goldPurchase.update({
                    where: { id: orderId },
                    data: {
                        status: "SUCCESS",
                        providerTransId: "MOCK_TRANS_" + Math.random().toString(36).substring(2, 10).toUpperCase(),
                    },
                }),
                prisma.user.update({
                    where: { id: purchase.userId },
                    data: { totalGold: { increment: purchase.goldAmount } },
                }),
            ]);
        } else {
            await prisma.goldPurchase.update({
                where: { id: orderId },
                data: { status: "FAILED" },
            });
        }

        return res.status(200).json({ message: "SUCCESS" });
    } catch (error: any) {
        console.error("handleMockSubmit error:", error);
        return res.status(500).json({ error: error.message || "Lỗi khi cập nhật giao dịch." });
    }
};

