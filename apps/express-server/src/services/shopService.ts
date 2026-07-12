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

            if (itemDef.maxStackSize !== null && newQty > itemDef.maxStackSize) {
                throw new Error(`Cannot purchase. Maximum stack size is ${itemDef.maxStackSize}. Current owned: ${currentQty}`);
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
}

export const shopService = new ShopService();
