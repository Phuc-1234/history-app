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

    async getUserActiveEffects(userId: string, tx?: any) {
        const client = tx || prisma;
        const now = new Date();

        // Lazily expire outdated active effects
        await client.userActiveEffect.updateMany({
            where: {
                userId,
                status: "ACTIVE",
                expiresAt: { lte: now },
            },
            data: {
                status: "EXPIRED",
            },
        });

        // Query active effects
        const activeEffects = await client.userActiveEffect.findMany({
            where: {
                userId,
                status: "ACTIVE",
                expiresAt: { gt: now },
            },
            include: { itemDefinition: true },
        });

        let xpMultiplier = 1.0;
        let goldMultiplier = 1.0;

        for (const eff of activeEffects) {
            if (eff.itemType === "XP_MUL") {
                xpMultiplier *= eff.effectValue;
            } else if (eff.itemType === "GOLD_MUL") {
                goldMultiplier *= eff.effectValue;
            }
        }

        return {
            activeEffects,
            xpMultiplier,
            goldMultiplier,
        };
    }

    async getUserInventory(userId: string) {
        const activeRes = await this.getUserActiveEffects(userId);
        const activeEffects = activeRes.activeEffects;
        const activeDefIds = new Set(activeEffects.map((e) => e.itemDefinitionId));

        const userItems = await prisma.userItem.findMany({
            where: { userId },
            include: { itemDefinition: true },
            orderBy: { itemDefinitionId: "asc" },
        });

        const itemsResult: Array<any> = userItems.map((ui) => ({
            ...ui,
            isActivated: activeDefIds.has(ui.itemDefinitionId),
        }));

        // Append active consumable items where quantity reached 0 and row was removed from user_items
        for (const eff of activeEffects) {
            const existsInUserItems = itemsResult.some(
                (item) => item.itemDefinitionId === eff.itemDefinitionId
            );
            if (!existsInUserItems) {
                itemsResult.push({
                    userId,
                    itemDefinitionId: eff.itemDefinitionId,
                    quantity: 0,
                    itemDefinition: eff.itemDefinition,
                    isActivated: true,
                });
            }
        }

        return itemsResult;
    }

    async activateItem(userId: string, itemDefinitionId: number, forceReplace: boolean = false) {
        return await prisma.$transaction(async (tx) => {
            // 1. Fetch active effects (and lazily expire)
            const activeRes = await this.getUserActiveEffects(userId, tx);

            // 2. Fetch user item and make sure they own it
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

            // 3. Handle Consumables (XP_MUL / GOLD_MUL)
            if (itemDef.itemType === "XP_MUL" || itemDef.itemType === "GOLD_MUL") {
                const existingSameType = activeRes.activeEffects.find(
                    (eff) => eff.itemType === itemDef.itemType
                );

                if (existingSameType) {
                    if (existingSameType.itemDefinitionId === itemDefinitionId) {
                        return {
                            success: false,
                            conflict: true,
                            code: "ACTIVE_EFFECT_EXISTS",
                            message: `Hiệu ứng ${existingSameType.itemDefinition.name} đang hoạt động.`,
                            activeItemName: existingSameType.itemDefinition.name,
                        };
                    }

                    if (!forceReplace) {
                        return {
                            success: false,
                            conflict: true,
                            code: "ACTIVE_EFFECT_EXISTS",
                            message: `Bạn đang sử dụng ${existingSameType.itemDefinition.name}. Việc kích hoạt vật phẩm này sẽ hủy hiệu ứng hiện tại.`,
                            activeItemName: existingSameType.itemDefinition.name,
                        };
                    }

                    // forceReplace is true -> expire previous active effect
                    await tx.userActiveEffect.update({
                        where: { id: existingSameType.id },
                        data: { status: "EXPIRED" },
                    });
                }

                // Consume 1 item from inventory
                const newQty = userItem.quantity - 1;
                if (newQty > 0) {
                    await tx.userItem.update({
                        where: {
                            userId_itemDefinitionId: {
                                userId,
                                itemDefinitionId,
                            },
                        },
                        data: { quantity: newQty },
                    });
                } else {
                    await tx.userItem.delete({
                        where: {
                            userId_itemDefinitionId: {
                                userId,
                                itemDefinitionId,
                            },
                        },
                    });
                }

                const durationMinutes = itemDef.durationMinutes ?? 60;
                const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

                await tx.userActiveEffect.create({
                    data: {
                        userId,
                        itemDefinitionId,
                        effectValue: itemDef.effectValue ?? 1.5,
                        expiresAt,
                        status: "ACTIVE",
                        itemType: itemDef.itemType,
                    },
                });

                return {
                    success: true,
                    equipped: true,
                    message: "Kích hoạt vật phẩm thành công!",
                };
            }

            // 4. Verify it is a SKIN with equipmentSlot = AVT_FRAME
            if (itemDef.itemType !== "SKIN" || itemDef.equipmentSlot !== "AVT_FRAME") {
                throw new Error("Item activation not supported yet");
            }

            const slot = itemDef.equipmentSlot; // "AVT_FRAME"

            // 5. Toggle equip status
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
