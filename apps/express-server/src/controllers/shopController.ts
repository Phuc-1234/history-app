import { Request, Response } from "express";
import { shopService } from "../services/shopService";

export const getShopItems = async (req: Request, res: Response) => {
    try {
        const items = await shopService.getShopItems();
        return res.status(200).json({ items });
    } catch (err: any) {
        console.error("Get shop items error:", err);
        return res.status(500).json({ error: "Failed to fetch shop items" });
    }
};

export const purchaseItem = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id; // Assumes requireStudent middleware populated req.user
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { itemDefinitionId, quantity } = req.body;
        if (itemDefinitionId === undefined) {
            return res.status(400).json({ error: "itemDefinitionId is required" });
        }

        const qty = quantity !== undefined ? Number(quantity) : 1;
        const result = await shopService.purchaseItem(userId, Number(itemDefinitionId), qty);
        return res.status(200).json(result);
    } catch (err: any) {
        console.error("Purchase item error:", err);
        return res.status(400).json({ error: err.message || "Failed to purchase item" });
    }
};

export const getUserInventory = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const inventory = await shopService.getUserInventory(userId);
        return res.status(200).json({ inventory });
    } catch (err: any) {
        console.error("Get inventory error:", err);
        return res.status(500).json({ error: "Failed to fetch user inventory" });
    }
};

export const activateItem = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { itemDefinitionId } = req.body;
        if (itemDefinitionId === undefined) {
            return res.status(400).json({ error: "itemDefinitionId is required" });
        }

        const result = await shopService.activateItem(userId, Number(itemDefinitionId));
        return res.status(200).json(result);
    } catch (err: any) {
        console.error("Activate item error:", err);
        return res.status(400).json({ error: err.message || "Failed to activate item" });
    }
};
