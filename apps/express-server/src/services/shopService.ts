import { prisma } from "@history-app/shared";

export class ShopService {
    async getShopItems() {
        return await prisma.itemDefinition.findMany({
            where: { shownInStore: true },
            orderBy: { id: "asc" },
        });
    }

    async purchaseItem(userId: string, itemDefinitionId: number, quantity: number = 1) {
        if (quantity <= 0) {
            throw new Error("Quantity must be greater than 0");
        }

        return await prisma.$transaction(async (tx) => {
            // 1. Fetch user and item
            const user = await tx.user.findUnique({
                where: { id: userId },
            });
            if (!user) throw new Error("User not found");

            const itemDef = await tx.itemDefinition.findUnique({
                where: { id: itemDefinitionId },
            });
            if (!itemDef) throw new Error("Item definition not found");
            if (!itemDef.shownInStore) throw new Error("Item is not available in the store");

            const totalPrice = itemDef.price * quantity;
            if (user.totalGold < totalPrice) {
                throw new Error("Insufficient gold");
            }

            // 2. Check stack limits if maxStackSize is specified
            const existingUserItem = await tx.userItem.findUnique({
                where: {
                    userId_itemDefinitionId: {
                        userId,
                        itemDefinitionId,
                    },
                },
            });

            const currentQty = existingUserItem ? existingUserItem.quantity : 0;
            const newQty = currentQty + quantity;

            const isSingleStack = itemDef.itemType === "SKIN" || itemDef.itemType === "BADGE";
            if (isSingleStack && newQty > 1) {
                throw new Error(`Cannot purchase. Maximum stack size for ${itemDef.itemType} is 1. Current owned: ${currentQty}`);
            }

            // 3. Deduct gold
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: {
                    totalGold: {
                        decrement: totalPrice,
                    },
                },
            });

            // 4. Update or create user item
            let updatedUserItem;
            if (existingUserItem) {
                updatedUserItem = await tx.userItem.update({
                    where: {
                        userId_itemDefinitionId: {
                            userId,
                            itemDefinitionId,
                        },
                    },
                    data: {
                        quantity: newQty,
                    },
                    include: { itemDefinition: true },
                });
            } else {
                updatedUserItem = await tx.userItem.create({
                    data: {
                        userId,
                        itemDefinitionId,
                        quantity,
                    },
                    include: { itemDefinition: true },
                });
            }

            return {
                goldRemaining: updatedUser.totalGold,
                userItem: updatedUserItem,
            };
        });
    }

    async getUserInventory(userId: string) {
        return await prisma.userItem.findMany({
            where: { userId },
            include: { itemDefinition: true },
            orderBy: { itemDefinitionId: "asc" },
        });
    }

    async activateItem(userId: string, itemDefinitionId: number) {
        return await prisma.$transaction(async (tx) => {
            // 1. Fetch user item and make sure they own it
            const userItem = await tx.userItem.findUnique({
                where: {
                    userId_itemDefinitionId: {
                        userId,
                        itemDefinitionId,
                    },
                },
                include: { itemDefinition: true },
            });

            if (!userItem || userItem.quantity <= 0) {
                throw new Error("You do not own this item");
            }

            const itemDef = userItem.itemDefinition;

            // 2. Verify it is a SKIN with equipmentSlot = AVT_FRAME
            if (itemDef.itemType !== "SKIN" || itemDef.equipmentSlot !== "AVT_FRAME") {
                throw new Error("Item activation not supported yet");
            }

            const slot = itemDef.equipmentSlot; // "AVT_FRAME"

            // 3. Toggle equip status
            const existingEquipped = await tx.userEquippedItem.findUnique({
                where: {
                    userId_equipmentSlot: {
                        userId,
                        equipmentSlot: slot,
                    },
                },
            });

            if (existingEquipped) {
                if (existingEquipped.itemDefinitionId === itemDefinitionId) {
                    // Same item already equipped -> unequip it (toggle off)
                    await tx.userEquippedItem.delete({
                        where: {
                            userId_equipmentSlot: {
                                userId,
                                equipmentSlot: slot,
                            },
                        },
                    });
                    return { success: true, equipped: false, message: "Unequipped successfully" };
                } else {
                    // Different item equipped in this slot -> update/replace it
                    await tx.userEquippedItem.update({
                        where: {
                            userId_equipmentSlot: {
                                userId,
                                equipmentSlot: slot,
                            },
                        },
                        data: {
                            itemDefinitionId,
                        },
                    });
                    return { success: true, equipped: true, message: "Equipped successfully" };
                }
            } else {
                // Nothing equipped in this slot -> create new equipment row
                await tx.userEquippedItem.create({
                    data: {
                        userId,
                        equipmentSlot: slot,
                        itemDefinitionId,
                    },
                });
                return { success: true, equipped: true, message: "Equipped successfully" };
            }
        });
    }
}

export const shopService = new ShopService();
