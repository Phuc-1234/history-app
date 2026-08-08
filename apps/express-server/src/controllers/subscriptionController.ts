import { Request, Response } from "express";
import { paymentService } from "../services/paymentService";
import { prisma } from "@history-app/shared";

// POST /api/subscription/subscribe
export const initiateSubscription = async (
    req: Request,
    res: Response,
): Promise<Response> => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Access denied. Valid session missing." });
        }

        const { provider, packageId } = req.body;

        if (!provider || !["ZALOPAY", "SEPAY"].includes(provider)) {
            return res.status(400).json({ error: "provider phải là ZALOPAY hoặc SEPAY." });
        }

        const result = await paymentService.initiateSubscription(req.user.id, provider, packageId);
        return res.status(200).json(result);
    } catch (error: any) {
        console.error("initiateSubscription error:", error);
        return res.status(500).json({ error: error.message || "Lỗi khi tạo đăng ký gói." });
    }
};

// POST /api/subscription/cancel
export const cancelSubscription = async (
    req: Request,
    res: Response,
): Promise<Response> => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Access denied. Valid session missing." });
        }

        const result = await paymentService.cancelSubscription(req.user.id);
        if (!result.success) {
            return res.status(400).json({ error: result.message });
        }

        return res.status(200).json({ message: result.message });
    } catch (error: any) {
        console.error("cancelSubscription error:", error);
        return res.status(500).json({ error: "Lỗi khi hủy đăng ký gói." });
    }
};

// GET /api/subscription/status/:orderId
export const getSubscriptionStatus = async (
    req: Request<{ orderId: string }>,
    res: Response,
): Promise<Response> => {
    try {
        const { orderId } = req.params;
        const result = await paymentService.getSubscriptionStatus(orderId);

        if (!result) {
            return res.status(404).json({ error: "Không tìm thấy thông tin đăng ký." });
        }

        return res.status(200).json(result);
    } catch (error: any) {
        console.error("getSubscriptionStatus error:", error);
        return res.status(500).json({ error: "Lỗi khi lấy trạng thái đăng ký." });
    }
};

// POST /api/subscription/mock-submit
export const handleMockSubscriptionSubmit = async (
    req: Request,
    res: Response,
): Promise<Response> => {
    try {
        if (process.env.NODE_ENV === "production") {
            return res.status(403).json({ error: "Cổng giả lập thanh toán bị vô hiệu hóa trên môi trường Production." });
        }

        if (!req.user) {
            return res.status(401).json({ error: "Access denied. Valid session missing." });
        }

        const { orderId, status } = req.body;
        if (!orderId || !status || !["SUCCESS", "FAILED"].includes(status)) {
            return res.status(400).json({ error: "Thiếu dữ liệu hoặc status không hợp lệ." });
        }

        const subscription = await prisma.subscription.findUnique({
            where: { id: orderId },
        });

        if (!subscription) {
            return res.status(404).json({ error: "Không tìm thấy thông tin đăng ký." });
        }

        if (subscription.userId !== req.user.id) {
            return res.status(403).json({ error: "Bạn không có quyền thao tác trên đơn hàng này." });
        }

        if (subscription.status !== "PENDING") {
            return res.status(400).json({ error: "Yêu cầu đăng ký đã được xử lý trước đó." });
        }

        if (status === "SUCCESS") {
            await paymentService.activateSubscription(orderId, "MOCK_SUB_TRANS_" + Math.random().toString(36).substring(2, 10).toUpperCase());
        } else {
            await prisma.subscription.updateMany({
                where: { id: orderId, status: "PENDING" },
                data: { status: "FAILED" },
            });
        }

        return res.status(200).json({ message: "SUCCESS" });
    } catch (error: any) {
        console.error("handleMockSubscriptionSubmit error:", error);
        return res.status(500).json({ error: error.message || "Lỗi khi cập nhật giao dịch." });
    }
};

// GET /api/subscription/checkout
export const renderSubscriptionCheckout = async (req: Request, res: Response): Promise<any> => {
    try {
        const { orderId } = req.query;
        if (!orderId) {
            return res.status(400).send("Thiếu orderId.");
        }

        const sub = await paymentService.getSubscriptionStatus(orderId as string);
        if (!sub) {
            return res.status(404).send("Không tìm thấy thông tin đăng ký.");
        }

        const isSepay = sub.provider === "SEPAY";
        const bankId = process.env.SEPAY_BANK_ID || "MB";
        const accountNo = process.env.SEPAY_ACCOUNT_NO || "0999999999";
        const accountName = process.env.SEPAY_ACCOUNT_NAME || "NGUYEN VAN A";
        const paymentCode = sub.providerOrderId || "";
        const amountVnd = sub.amountVnd;

        const vietQrUrl = isSepay
            ? `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amountVnd}&addInfo=${paymentCode}&accountName=${encodeURIComponent(accountName)}`
            : "";

        const html = `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Đăng ký Premium Pro - HistoryApp</title>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    background: linear-gradient(135deg, #0f051d 0%, #05020a 100%);
                    color: #FFFFFF;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                }
                .container {
                    width: 90%;
                    max-width: 440px;
                    background: rgba(255, 255, 255, 0.02);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px rgba(255, 255, 255, 0.08) solid;
                    border-radius: 32px;
                    padding: 32px;
                    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
                    text-align: center;
                    box-sizing: border-box;
                }
                .logo-section {
                    margin-bottom: 20px;
                }
                .logo-title {
                    font-weight: 800;
                    font-size: 24px;
                    background: linear-gradient(45deg, #a38cff, #ff79c6);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    letter-spacing: -0.5px;
                    margin: 0;
                }
                .logo-subtitle {
                    color: #8c86a5;
                    font-size: 13px;
                    margin: 4px 0 0 0;
                }
                .qr-container {
                    background: #ffffff;
                    padding: 16px;
                    border-radius: 24px;
                    display: inline-block;
                    margin: 16px 0;
                    position: relative;
                    box-shadow: 0 12px 32px rgba(163, 140, 255, 0.15);
                    animation: pulseGlow 3s infinite ease-in-out;
                }
                @keyframes pulseGlow {
                    0% { box-shadow: 0 12px 32px rgba(163, 140, 255, 0.1); }
                    50% { box-shadow: 0 12px 32px rgba(163, 140, 255, 0.25); }
                    100% { box-shadow: 0 12px 32px rgba(163, 140, 255, 0.1); }
                }
                .qr-image {
                    width: 220px;
                    height: 220px;
                    display: block;
                    border-radius: 12px;
                }
                .price-tag {
                    font-size: 34px;
                    font-weight: 800;
                    color: #ffb86c;
                    margin: 12px 0;
                    letter-spacing: -0.5px;
                }
                .pkg-badge {
                    display: inline-block;
                    background: linear-gradient(90deg, #ff79c6, #bd93f9);
                    color: #fff;
                    font-size: 11px;
                    font-weight: 800;
                    padding: 4px 12px;
                    border-radius: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 12px;
                }
                .details-table {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 20px;
                    padding: 20px;
                    margin-bottom: 24px;
                    text-align: left;
                }
                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                    font-size: 14px;
                }
                .detail-row:last-child {
                    margin-bottom: 0;
                }
                .detail-label {
                    color: #8c86a5;
                    font-weight: 500;
                }
                .detail-value {
                    color: #ffffff;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .copy-btn {
                    background: rgba(255, 255, 255, 0.08);
                    border: none;
                    color: #a38cff;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .copy-btn:hover {
                    background: rgba(163, 140, 255, 0.2);
                    color: #ffffff;
                }
                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(163, 140, 255, 0.1);
                    border: 1px solid rgba(163, 140, 255, 0.2);
                    padding: 10px 20px;
                    border-radius: 20px;
                    color: #a38cff;
                    font-size: 14px;
                    font-weight: 600;
                    margin-bottom: 20px;
                }
                .spinner {
                    border: 2px solid rgba(163, 140, 255, 0.1);
                    border-top: 2px solid #a38cff;
                    border-radius: 50%;
                    width: 14px;
                    height: 14px;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .btn-action {
                    display: block;
                    width: 100%;
                    padding: 16px;
                    background: linear-gradient(135deg, #a38cff 0%, #7f66e6 100%);
                    border: none;
                    border-radius: 18px;
                    color: #ffffff;
                    font-size: 15px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 8px 24px rgba(163, 140, 255, 0.3);
                    margin-bottom: 12px;
                }
                .btn-action:hover {
                    background: linear-gradient(135deg, #8f75f5 0%, #6e54d4 100%);
                    transform: translateY(-2px);
                }
                .btn-cancel {
                    background: transparent;
                    border: 1px rgba(255, 255, 255, 0.15) solid;
                    color: #FF453A;
                }
                .btn-cancel:hover {
                    background: rgba(255, 69, 58, 0.1);
                    border-color: #FF453A;
                }
                .footer {
                    font-size: 11px;
                    color: #5d5875;
                    margin-top: 20px;
                }
                .toast {
                    position: fixed;
                    bottom: 24px;
                    left: 50%;
                    transform: translateX(-50%) translateY(100px);
                    background: #34c759;
                    color: white;
                    padding: 12px 24px;
                    border-radius: 16px;
                    font-size: 14px;
                    font-weight: 600;
                    box-shadow: 0 8px 24px rgba(52, 199, 89, 0.3);
                    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    z-index: 1000;
                    pointer-events: none;
                }
                .toast.show {
                    transform: translateX(-50%) translateY(0);
                }
            </style>
        </head>
        <body>
            <div class="container" id="card">
                <div class="logo-section">
                    <h2 class="logo-title">${isSepay ? "Thanh toán Gói Premium" : "Cổng Đăng Ký Demo"}</h2>
                    <p class="logo-subtitle">${isSepay ? "Quét mã QR bằng ứng dụng ngân hàng để kích hoạt Pro" : "Môi trường giả lập (Không trừ tiền thật)"}</p>
                </div>

                <div class="pkg-badge">Gói Pro 30 Ngày</div>

                ${isSepay ? `
                <div class="qr-container">
                    <img class="qr-image" src="${vietQrUrl}" alt="VietQR Code">
                </div>
                ` : ""}

                <div class="price-tag">${amountVnd.toLocaleString("vi-VN")}đ</div>

                <div class="status-badge" id="status-container">
                    <div class="spinner"></div>
                    <span>Đang chờ thanh toán...</span>
                </div>

                <div class="details-table">
                    <div class="detail-row">
                        <span>Đăng ký:</span>
                        <strong style="color: #fff;">Gói Premium Pro 👑</strong>
                    </div>
                    ${isSepay ? `
                    <div class="detail-row">
                        <span class="detail-label">Ngân hàng</span>
                        <span class="detail-value">${bankId}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Số tài khoản</span>
                        <span class="detail-value">
                            <span>${accountNo}</span>
                            <button class="copy-btn" onclick="copyText('${accountNo}', 'Đã sao chép số tài khoản!')">Copy</button>
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Chủ tài khoản</span>
                        <span class="detail-value">${accountName}</span>
                    </div>
                    <div class="detail-row" style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px; margin-top: 12px;">
                        <span class="detail-label" style="color: #a38cff;">Nội dung chuyển</span>
                        <span class="detail-value" style="color: #a38cff;">
                            <strong style="font-family: monospace; font-size: 16px;">${paymentCode}</strong>
                            <button class="copy-btn" style="background: rgba(163, 140, 255, 0.15); color: #a38cff;" onclick="copyText('${paymentCode}', 'Đã sao chép nội dung!')">Copy</button>
                        </span>
                    </div>
                    ` : `
                    <div class="detail-row">
                        <span>Mã đơn:</span>
                        <span style="font-family: monospace; color: #fff;">${sub.orderId.slice(0, 8)}...</span>
                    </div>
                    <div class="detail-row">
                        <span>Hình thức:</span>
                        <strong style="color: #fff;">${sub.provider}</strong>
                    </div>
                    `}
                </div>

                <div class="footer">
                    Vui lòng thanh toán đúng số tiền và nội dung để hệ thống tự động nâng cấp Premium ngay lập tức.
                </div>

                // Call Mock Submit
                async function submitMockPayment(status) {
                    const card = document.getElementById('card');
                    card.innerHTML = '<h3 style="color: #A79CFF; margin-top: 32px; margin-bottom: 32px;">Đang xử lý đăng ký...</h3>';
                    
                    try {
                        const response = await fetch('/api/subscription/mock-submit', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ orderId: orderId, status: status })
                        });
                        
                        const resData = await response.json();
                        if (!response.ok) {
                            throw new Error(resData.error || 'Giao dịch lỗi');
                        }
                    } catch (e) {
                        card.innerHTML = \`
                            <div style="font-size: 64px; margin-bottom: 16px; margin-top: 16px;">⚠️</div>
                            <h2 style="color: #FF9500;">Lỗi kết nối</h2>
                            <p style="color: #B3AECE;">Không thể hoàn tất giao dịch: \${e.message}</p>
                            <button class="btn-action" style="margin-top: 16px;" onclick="window.location.reload()">Thử lại</button>
                        \`;
                    }
                }
            </script>
        </body>
        </html>
        `;
        return res.status(200).send(html);
    } catch (error: any) {
        console.error("renderSubscriptionCheckout error:", error);
        return res.status(500).send("Lỗi tải trang thanh toán đăng ký.");
    }
};
