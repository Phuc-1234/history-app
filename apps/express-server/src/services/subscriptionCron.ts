import { prisma } from "@history-app/shared";

/**
 * Runs the check for expired subscriptions and processes auto-renewals/downgrades.
 */
export async function checkExpiredSubscriptions() {
    console.log("[Subscription Cron] Bắt đầu quét các gói Pro hết hạn...");
    const now = new Date();

    try {
        // Tìm các người dùng có proExpiresAt <= now và isPro == true
        const expiredUsers = await prisma.user.findMany({
            where: {
                isPro: true,
                proExpiresAt: {
                    lte: now,
                },
            },
            include: {
                subscriptions: {
                    where: {
                        status: {
                            in: ["ACTIVE", "CANCELLED"],
                        },
                    },
                    orderBy: {
                        endDate: "desc",
                    },
                    take: 1,
                },
            },
        });

        console.log(`[Subscription Cron] Tìm thấy ${expiredUsers.length} tài khoản hết hạn.`);

        for (const user of expiredUsers) {
            const activeSub = user.subscriptions[0];

            if (activeSub && activeSub.autoRenew) {
                // GIẢ LẬP GIA HẠN TỰ ĐỘNG (Cộng thêm 30 ngày)
                const newEndDate = new Date(activeSub.endDate!);
                newEndDate.setDate(newEndDate.getDate() + 30);

                await prisma.$transaction([
                    // Cập nhật subscription cũ thành EXPIRED
                    prisma.subscription.update({
                        where: { id: activeSub.id },
                        data: { status: "EXPIRED" },
                    }),
                    // Tạo subscription mới đại diện cho chu kỳ tiếp theo
                    prisma.subscription.create({
                        data: {
                            userId: user.id,
                            status: "ACTIVE",
                            amountVnd: 2000,
                            provider: activeSub.provider,
                            providerOrderId: "AUTO_RENEW_" + Math.random().toString(36).substring(2, 10).toUpperCase(),
                            providerTransId: "AUTO_TRANS_" + Math.random().toString(36).substring(2, 10).toUpperCase(),
                            autoRenew: true,
                            startDate: activeSub.endDate,
                            endDate: newEndDate,
                        },
                    }),
                    // Gia hạn ngày hết hạn của User
                    prisma.user.update({
                        where: { id: user.id },
                        data: {
                            proExpiresAt: newEndDate,
                        },
                    }),
                ]);
                console.log(`[Subscription Cron] Tự động gia hạn thành công cho User: ${user.name}`);
            } else {
                // HẠ CẤP NGƯỜI DÙNG VÌ ĐÃ HỦY GÓI HOẶC KHÔNG THỂ GIA HẠN
                await prisma.$transaction([
                    prisma.user.update({
                        where: { id: user.id },
                        data: {
                            isPro: false,
                            proExpiresAt: null,
                        },
                    }),
                    prisma.subscription.updateMany({
                        where: { userId: user.id, status: { in: ["ACTIVE", "CANCELLED"] } },
                        data: { status: "EXPIRED" },
                    }),
                ]);
                console.log(`[Subscription Cron] Đã hạ cấp gói Pro của User: ${user.name}`);
            }
        }
    } catch (error: any) {
        console.error("[Subscription Cron] Lỗi quét gia hạn:", error.message);
    }
}

/**
 * Sweeps and cancels all PENDING orders (GoldPurchase & Subscription) created more than 24 hours ago.
 */
export async function cancelExpiredPendingOrders(hoursThreshold: number = 24) {
    const cutoffDate = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);
    console.log(`[Payment Cleanup] Bắt đầu quét đơn hàng PENDING quá ${hoursThreshold}h (tạo trước ${cutoffDate.toISOString()})...`);

    try {
        const [expiredGold, expiredSub] = await prisma.$transaction([
            prisma.goldPurchase.updateMany({
                where: {
                    status: "PENDING",
                    createdAt: { lte: cutoffDate },
                },
                data: {
                    status: "FAILED",
                },
            }),
            prisma.subscription.updateMany({
                where: {
                    status: "PENDING",
                    createdAt: { lte: cutoffDate },
                },
                data: {
                    status: "FAILED",
                },
            }),
        ]);

        console.log(`[Payment Cleanup] Đã hủy thành công: ${expiredGold.count} đơn nạp Gold quá hạn và ${expiredSub.count} đơn đăng ký Pro quá hạn.`);
    } catch (error: any) {
        console.error("[Payment Cleanup] Lỗi dọn dẹp đơn hàng PENDING:", error.message);
    }
}

/**
 * Schedules the checker to run daily at 00:00 midnight.
 */
export function startDailySubscriptionCron() {
    console.log("[Subscription Cron] Lập lịch quét gia hạn định kỳ (00:00 hàng ngày) đã khởi chạy.");

    // Run once on startup to process any missed periods or stale pending orders
    checkExpiredSubscriptions();
    cancelExpiredPendingOrders(24);

    const getMsUntilMidnight = () => {
        const now = new Date();
        const midnight = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1, // Tomorrow
            0,
            0,
            0,
            0
        );
        return midnight.getTime() - now.getTime();
    };

    const scheduleNextRun = () => {
        const msUntilMidnight = getMsUntilMidnight();
        console.log(`[Subscription Cron] Lần quét tiếp theo trong ${Math.round(msUntilMidnight / 1000 / 60)} phút.`);
        
        setTimeout(async () => {
            await checkExpiredSubscriptions();
            await cancelExpiredPendingOrders(24);
            scheduleNextRun();
        }, msUntilMidnight);
    };

    scheduleNextRun();
}
