// controllers/packageController.ts
import { Request, Response } from "express";
import { prisma } from "@history-app/shared";

// ─── ADMIN APIs ───────────────────────────────────────────────────────────────

/**
 * GET /api/admin/packages/gold
 * Lấy danh sách tất cả các gói vàng (cả active & inactive), sắp xếp theo displayOrder.
 */
export const listGoldPackagesAdmin = async (req: Request, res: Response): Promise<Response> => {
    try {
        if (!(prisma as any).goldPackage) {
            console.warn("prisma.goldPackage is not initialized.");
            return res.status(200).json([]);
        }
        const packages = await (prisma as any).goldPackage.findMany({
            orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
        });
        return res.status(200).json(packages || []);
    } catch (error: any) {
        console.error("listGoldPackagesAdmin error:", error?.message || error);
        return res.status(200).json([]);
    }
};

/**
 * POST /api/admin/packages/gold
 * Tạo mới gói vàng.
 */
export const createGoldPackageAdmin = async (req: Request, res: Response): Promise<Response> => {
    try {
        if (!(prisma as any).goldPackage) {
            return res.status(400).json({ error: "Cơ sở dữ liệu chưa sẵn sàng. Vui lòng chạy 'npx prisma generate' và 'npx prisma db push' ở packages/shared." });
        }
        const { name, goldAmount, bonusGold = 0, priceVnd, isActive = true, displayOrder = 0 } = req.body;

        if (!name || typeof name !== "string" || !name.trim()) {
            return res.status(400).json({ error: "Tên gói vàng không được để trống." });
        }
        if (!goldAmount || typeof goldAmount !== "number" || goldAmount <= 0) {
            return res.status(400).json({ error: "Số vàng phải là số nguyên dương." });
        }
        if (typeof priceVnd !== "number" || priceVnd <= 0) {
            return res.status(400).json({ error: "Giá tiền VNĐ phải lớn hơn 0." });
        }

        const newPackage = await (prisma as any).goldPackage.create({
            data: {
                name: name.trim(),
                goldAmount: Math.floor(goldAmount),
                bonusGold: Math.floor(bonusGold || 0),
                priceVnd: Math.floor(priceVnd),
                isActive: Boolean(isActive),
                displayOrder: Number(displayOrder) || 0,
            },
        });

        return res.status(201).json(newPackage);
    } catch (error: any) {
        console.error("createGoldPackageAdmin error:", error);
        return res.status(500).json({ error: error.message || "Lỗi khi tạo mới gói vàng." });
    }
};

/**
 * PUT /api/admin/packages/gold/:id
 * Cập nhật thông tin gói vàng.
 */
export const updateGoldPackageAdmin = async (req: Request, res: Response): Promise<Response> => {
    try {
        if (!(prisma as any).goldPackage) {
            return res.status(400).json({ error: "Cơ sở dữ liệu chưa sẵn sàng. Vui lòng chạy 'npx prisma generate' và 'npx prisma db push'." });
        }
        const { id } = req.params;
        const { name, goldAmount, bonusGold, priceVnd, isActive, displayOrder } = req.body;

        const existing = await (prisma as any).goldPackage.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: "Không tìm thấy gói vàng." });
        }

        const updatedPackage = await (prisma as any).goldPackage.update({
            where: { id },
            data: {
                ...(name !== undefined && { name: name.trim() }),
                ...(goldAmount !== undefined && { goldAmount: Math.floor(goldAmount) }),
                ...(bonusGold !== undefined && { bonusGold: Math.floor(bonusGold) }),
                ...(priceVnd !== undefined && { priceVnd: Math.floor(priceVnd) }),
                ...(isActive !== undefined && { isActive: Boolean(isActive) }),
                ...(displayOrder !== undefined && { displayOrder: Number(displayOrder) }),
            },
        });

        return res.status(200).json(updatedPackage);
    } catch (error: any) {
        console.error("updateGoldPackageAdmin error:", error);
        return res.status(500).json({ error: error.message || "Lỗi khi cập nhật gói vàng." });
    }
};

/**
 * DELETE /api/admin/packages/gold/:id
 * Xóa gói vàng.
 */
export const deleteGoldPackageAdmin = async (req: Request, res: Response): Promise<Response> => {
    try {
        if (!(prisma as any).goldPackage) {
            return res.status(400).json({ error: "Cơ sở dữ liệu chưa sẵn sàng." });
        }
        const { id } = req.params;
        const existing = await (prisma as any).goldPackage.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: "Không tìm thấy gói vàng." });
        }

        await (prisma as any).goldPackage.delete({ where: { id } });
        return res.status(200).json({ message: "Xóa gói vàng thành công." });
    } catch (error: any) {
        console.error("deleteGoldPackageAdmin error:", error);
        return res.status(500).json({ error: "Lỗi khi xóa gói vàng." });
    }
};

/**
 * GET /api/admin/packages/pro
 * Lấy danh sách tất cả các gói Pro (cả active & inactive), sắp xếp theo displayOrder.
 */
export const listProPackagesAdmin = async (req: Request, res: Response): Promise<Response> => {
    try {
        if (!(prisma as any).proPackage) {
            console.warn("prisma.proPackage is not initialized.");
            return res.status(200).json([]);
        }
        const packages = await (prisma as any).proPackage.findMany({
            orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
        });
        return res.status(200).json(packages || []);
    } catch (error: any) {
        console.error("listProPackagesAdmin error:", error?.message || error);
        return res.status(200).json([]);
    }
};

/**
 * POST /api/admin/packages/pro
 * Tạo mới gói Pro.
 */
export const createProPackageAdmin = async (req: Request, res: Response): Promise<Response> => {
    try {
        if (!(prisma as any).proPackage) {
            return res.status(400).json({ error: "Cơ sở dữ liệu chưa sẵn sàng. Vui lòng chạy 'npx prisma generate' và 'npx prisma db push'." });
        }
        const {
            name,
            durationDays,
            priceVnd,
            originalPriceVnd = null,
            description = null,
            isRecommended = false,
            isActive = true,
            displayOrder = 0,
        } = req.body;

        if (!name || typeof name !== "string" || !name.trim()) {
            return res.status(400).json({ error: "Tên gói Pro không được để trống." });
        }
        if (!durationDays || typeof durationDays !== "number" || durationDays <= 0) {
            return res.status(400).json({ error: "Số ngày sử dụng phải là số nguyên dương." });
        }
        if (typeof priceVnd !== "number" || priceVnd <= 0) {
            return res.status(400).json({ error: "Giá tiền VNĐ phải lớn hơn 0." });
        }

        const newPackage = await (prisma as any).proPackage.create({
            data: {
                name: name.trim(),
                durationDays: Math.floor(durationDays),
                priceVnd: Math.floor(priceVnd),
                originalPriceVnd: originalPriceVnd ? Math.floor(originalPriceVnd) : null,
                description: description ? String(description).trim() : null,
                isRecommended: Boolean(isRecommended),
                isActive: Boolean(isActive),
                displayOrder: Number(displayOrder) || 0,
            },
        });

        return res.status(201).json(newPackage);
    } catch (error: any) {
        console.error("createProPackageAdmin error:", error);
        return res.status(500).json({ error: error.message || "Lỗi khi tạo mới gói Pro." });
    }
};

/**
 * PUT /api/admin/packages/pro/:id
 * Cập nhật thông tin gói Pro.
 */
export const updateProPackageAdmin = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        const {
            name,
            durationDays,
            priceVnd,
            originalPriceVnd,
            description,
            isRecommended,
            isActive,
            displayOrder,
        } = req.body;

        const existing = await (prisma as any).proPackage.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: "Không tìm thấy gói Pro." });
        }

        const updatedPackage = await (prisma as any).proPackage.update({
            where: { id },
            data: {
                ...(name !== undefined && { name: name.trim() }),
                ...(durationDays !== undefined && { durationDays: Math.floor(durationDays) }),
                ...(priceVnd !== undefined && { priceVnd: Math.floor(priceVnd) }),
                ...(originalPriceVnd !== undefined && {
                    originalPriceVnd: originalPriceVnd ? Math.floor(originalPriceVnd) : null,
                }),
                ...(description !== undefined && {
                    description: description ? String(description).trim() : null,
                }),
                ...(isRecommended !== undefined && { isRecommended: Boolean(isRecommended) }),
                ...(isActive !== undefined && { isActive: Boolean(isActive) }),
                ...(displayOrder !== undefined && { displayOrder: Number(displayOrder) }),
            },
        });

        return res.status(200).json(updatedPackage);
    } catch (error: any) {
        console.error("updateProPackageAdmin error:", error);
        return res.status(500).json({ error: error.message || "Lỗi khi cập nhật gói Pro." });
    }
};

/**
 * DELETE /api/admin/packages/pro/:id
 * Xóa gói Pro.
 */
export const deleteProPackageAdmin = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        const existing = await (prisma as any).proPackage.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: "Không tìm thấy gói Pro." });
        }

        await (prisma as any).proPackage.delete({ where: { id } });
        return res.status(200).json({ message: "Xóa gói Pro thành công." });
    } catch (error: any) {
        console.error("deleteProPackageAdmin error:", error);
        return res.status(500).json({ error: "Lỗi khi xóa gói Pro." });
    }
};

// ─── PUBLIC CLIENT APIs ───────────────────────────────────────────────────────

/**
 * GET /api/packages/gold
 * Lấy danh sách các gói Vàng đang isActive = true (sắp xếp displayOrder).
 */
export const listGoldPackagesPublic = async (req: Request, res: Response): Promise<Response> => {
    try {
        if (!(prisma as any).goldPackage) return res.status(200).json([]);
        const packages = await (prisma as any).goldPackage.findMany({
            where: { isActive: true },
            orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
        });
        return res.status(200).json(packages || []);
    } catch (error: any) {
        console.error("listGoldPackagesPublic error:", error);
        return res.status(200).json([]);
    }
};

/**
 * GET /api/packages/pro
 * Lấy danh sách các gói Pro đang isActive = true (sắp xếp displayOrder).
 */
export const listProPackagesPublic = async (req: Request, res: Response): Promise<Response> => {
    try {
        if (!(prisma as any).proPackage) return res.status(200).json([]);
        const packages = await (prisma as any).proPackage.findMany({
            where: { isActive: true },
            orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
        });
        return res.status(200).json(packages || []);
    } catch (error: any) {
        console.error("listProPackagesPublic error:", error);
        return res.status(200).json([]);
    }
};

