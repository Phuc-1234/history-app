import { Request, Response } from "express";
import { paymentService } from "../services/paymentService";
import { prisma } from "@history-app/shared";
import {
    InitiatePaymentRequestBody,
    InitiatePaymentResponse,
    GetPaymentStatusResponse,
    ZaloPayCallbackPayload,
    SePayWebhookPayload,
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

        if (!provider || !["ZALOPAY", "SEPAY"].includes(provider)) {
            return res.status(400).json({ error: "provider phải là ZALOPAY hoặc SEPAY." });
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

// POST /api/payment/sepay/webhook — called by SePay server after payment
export const handleSePayWebhook = async (
    req: Request<{}, any, SePayWebhookPayload>,
    res: Response,
): Promise<Response> => {
    try {
        console.log("[SePay Webhook] Received request");
        console.log("[SePay Webhook] Headers:", JSON.stringify(req.headers, null, 2));
        console.log("[SePay Webhook] Body:", JSON.stringify(req.body, null, 2));

        const apiKey = process.env.SEPAY_WEBHOOK_API_KEY;
        const authHeader = req.headers.authorization;
        // Verify key if configured
        if (apiKey && (!authHeader || authHeader !== `Apikey ${apiKey}`)) {
            console.warn(`[SePay Webhook] Auth failed. Expected: "Apikey ${apiKey}", Got: "${authHeader}"`);
            return res.status(401).json({ error: "Unauthorized webhook request." });
        }

        await paymentService.handleSePayWebhook(req.body);
        return res.status(200).json({ success: true });
    } catch (error: any) {
        console.error("handleSePayWebhook error:", error);
        return res.status(400).json({ success: false, error: error.message });
    }
};

// POST /api/payment/zalopay/callback — called by ZaloPay server (no auth header)
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

// GET /api/payment/status/:orderId — polled by the app
export const getPaymentStatus = async (
    req: Request<{ orderId: string }, GetPaymentStatusResponse | { error: string }>,
    res: Response<GetPaymentStatusResponse | { error: string }>,
): Promise<Response> => {
    try {
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

// GET /api/payment/sepay-checkout — renders HTML page with VietQR and polling status
export const renderSePayCheckout = async (req: Request, res: Response): Promise<any> => {
    try {
        const { orderId } = req.query;
        if (!orderId) {
            return res.status(400).send("Thiếu orderId.");
        }

        const purchase = await paymentService.getPaymentStatus(orderId as string);
        if (!purchase) {
            return res.status(404).send("Không tìm thấy đơn hàng.");
        }

        console.log("[DEBUG] Render SePay Checkout - Purchase record:", JSON.stringify(purchase, null, 2));

        const bankId = process.env.SEPAY_BANK_ID || "MB";
        const accountNo = process.env.SEPAY_ACCOUNT_NO || "0999999999";
        const accountName = process.env.SEPAY_ACCOUNT_NAME || "NGUYEN VAN A";
        const paymentCode = purchase.providerOrderId || "";

        // compact2 template generates QR code + account info automatically
        const vietQrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${purchase.amountVnd}&addInfo=${paymentCode}&accountName=${encodeURIComponent(accountName)}`;

        const html = `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Thanh toán VietQR - HistoryApp</title>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    background: linear-gradient(135deg, #0e0a1f 0%, #05040a 100%);
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
                    margin-bottom: 24px;
                }
                .logo-title {
                    font-weight: 800;
                    font-size: 22px;
                    color: #a38cff;
                    letter-spacing: -0.5px;
                    margin: 0;
                }
                .logo-subtitle {
                    color: #7d7795;
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
                    font-size: 32px;
                    font-weight: 800;
                    color: #34c759;
                    margin: 16px 0;
                    letter-spacing: -0.5px;
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
                .btn-simulate {
                    display: block;
                    width: 100%;
                    padding: 16px;
                    background: #5856d6;
                    border: none;
                    border-radius: 18px;
                    color: #ffffff;
                    font-size: 15px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 8px 24px rgba(88, 86, 214, 0.3);
                    margin-bottom: 12px;
                }
                .btn-simulate:hover {
                    background: #4a48c0;
                    transform: translateY(-2px);
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
                    <h2 class="logo-title">Quét mã VietQR</h2>
                    <p class="logo-subtitle">Mở ứng dụng ngân hàng và quét mã để thanh toán</p>
                </div>

                <div class="qr-container">
                    <img class="qr-image" src="${vietQrUrl}" alt="VietQR Code">
                </div>

                <div class="price-tag">${purchase.amountVnd.toLocaleString("vi-VN")}đ</div>

                <div class="status-badge" id="status-container">
                    <div class="spinner"></div>
                    <span>Đang chờ chuyển khoản...</span>
                </div>

                <div class="details-table">
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
                        <span class="detail-label" style="color: #ff9500;">Nội dung chuyển</span>
                        <span class="detail-value" style="color: #ff9500;">
                            <strong style="font-family: monospace; font-size: 16px;">${paymentCode}</strong>
                            <button class="copy-btn" style="background: rgba(255, 149, 0, 0.15); color: #ff9500;" onclick="copyText('${paymentCode}', 'Đã sao chép nội dung chuyển!')">Copy</button>
                        </span>
                    </div>
                </div>

                <button class="btn-simulate" onclick="simulatePayment()">Mô phỏng chuyển khoản thành công</button>
                
                <div class="footer">
                    Vui lòng chuyển khoản đúng số tiền và nội dung để hệ thống tự động cộng Gold ngay lập tức.
                </div>
            </div>

            <div class="toast" id="toast">Đã sao chép!</div>

            <script>
                function copyText(text, message) {
                    navigator.clipboard.writeText(text).then(() => {
                        showToast(message);
                    });
                }

                function showToast(message) {
                    const toast = document.getElementById('toast');
                    toast.innerText = message;
                    toast.classList.add('show');
                    setTimeout(() => {
                        toast.classList.remove('show');
                    }, 2000);
                }

                // Poll order status
                const orderId = '${purchase.orderId}';
                const interval = setInterval(async () => {
                    try {
                        const res = await fetch('/api/payment/status/' + orderId);
                        if (res.ok) {
                            const data = await res.json();
                            if (data.status === 'SUCCESS') {
                                clearInterval(interval);
                                handleSuccess();
                            } else if (data.status === 'FAILED') {
                                clearInterval(interval);
                                handleFailure();
                            }
                        }
                    } catch (e) {
                        console.error('Polling error:', e);
                    }
                }, 2000);

                function handleSuccess() {
                    const card = document.getElementById('card');
                    card.innerHTML = \`
                        <div style="font-size: 72px; margin-bottom: 20px; margin-top: 20px;">🎉</div>
                        <h2 style="color: #34c759; font-weight: 800; font-size: 26px; margin-bottom: 8px;">Thanh toán thành công!</h2>
                        <p style="color: #aba6c3; font-size: 15px; line-height: 1.6; margin-bottom: 32px; padding: 0 16px;">
                            Hệ thống đã nhận được tiền và nạp thành công <strong>\${${purchase.goldAmount}} Gold 🥇</strong> vào tài khoản của bạn.
                        </p>
                        <div style="background: rgba(52, 199, 89, 0.1); border: 1px solid rgba(52, 199, 89, 0.2); padding: 12px 24px; border-radius: 16px; color: #34c759; font-weight: 600; font-size: 13px; display: inline-block; margin-bottom: 24px;">
                            Giao dịch hoàn tất
                        </div>
                        <p style="color: #5d5875; font-size: 12px; margin-bottom: 16px;">Trình duyệt sẽ tự động đóng hoặc bạn có thể quay lại app.</p>
                    \`;
                }

                function handleFailure() {
                    const card = document.getElementById('card');
                    card.innerHTML = \`
                        <div style="font-size: 72px; margin-bottom: 20px; margin-top: 20px;">❌</div>
                        <h2 style="color: #ff453a; font-weight: 800; font-size: 26px; margin-bottom: 8px;">Giao dịch thất bại</h2>
                        <p style="color: #aba6c3; font-size: 15px; line-height: 1.6; margin-bottom: 32px;">
                            Đơn hàng đã bị hủy hoặc gặp lỗi trong quá trình xử lý.
                        </p>
                        <button class="btn-simulate" style="background: #3a3a3c; box-shadow: none;" onclick="window.location.reload()">Quay lại thử lại</button>
                    \`;
                }

                // Simulate payment for Sandbox
                async function simulatePayment() {
                    const statusContainer = document.getElementById('status-container');
                    statusContainer.innerHTML = '<div class="spinner"></div><span>Đang gửi lệnh giả lập chuyển tiền...</span>';
                    
                    try {
                        const response = await fetch('/api/payment/sepay/webhook', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Apikey ${process.env.SEPAY_WEBHOOK_API_KEY || "sepay_webhook_secret_key_123"}'
                            },
                            body: JSON.stringify({
                                id: Math.floor(Math.random() * 100000),
                                gateway: '${bankId}',
                                transactionDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
                                accountNumber: '${accountNo}',
                                transferType: 'in',
                                transferAmount: ${purchase.amountVnd},
                                content: '${paymentCode}',
                                referenceCode: 'SIM_FT_' + Math.random().toString(36).substring(2, 10).toUpperCase()
                            })
                        });
                        
                        const resData = await response.json();
                        if (response.ok) {
                            showToast('Gửi lệnh giả lập thành công!');
                        } else {
                            throw new Error(resData.error || 'Simulate failed');
                        }
                    } catch (e) {
                        statusContainer.innerHTML = '<div class="spinner"></div><span style="color: #ff453a;">Lỗi: ' + e.message + '</span>';
                        setTimeout(() => {
                            statusContainer.innerHTML = '<div class="spinner"></div><span>Đang chờ chuyển khoản...</span>';
                        }, 5000);
                    }
                }
            </script>
        </body>
        </html>
        `;
        return res.status(200).send(html);
    } catch (error: any) {
        console.error("renderSePayCheckout error:", error);
        return res.status(500).send("Lỗi tải trang thanh toán VietQR.");
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
