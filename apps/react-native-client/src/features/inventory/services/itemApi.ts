import { apiSlice } from "@/services/apiSlice";

export interface ItemDefinition {
    id: number;
    name: string;
    description: string | null;
    shownInStore: boolean;
    price: number;
    itemType: "SKIN" | "XP_MUL" | "GOLD_MUL" | "BADGE";
    effectValue: number | null;
    imgUrl: string | null;
    equipmentSlot: string | null;
    durationMinutes: number | null;
}

export interface UserInventoryItem {
    userId: string;
    itemDefinitionId: number;
    quantity: number;
    itemDefinition: ItemDefinition;
    isActivated?: boolean;
}

export interface ActiveEffectItem {
    id: number;
    userId: string;
    itemDefinitionId: number;
    effectValue: number;
    startedAt: string;
    expiresAt: string;
    status: "ACTIVE" | "EXPIRED";
    itemType: "SKIN" | "XP_MUL" | "GOLD_MUL" | "BADGE";
    itemDefinition: ItemDefinition;
}

export interface ActiveEffectsResponse {
    activeEffects: ActiveEffectItem[];
    xpMultiplier: number;
    goldMultiplier: number;
}

export interface ShopItemsResponse {
    items: ItemDefinition[];
}

export interface UserInventoryResponse {
    inventory: UserInventoryItem[];
}

export interface PurchaseItemRequest {
    itemDefinitionId: number;
    quantity?: number;
}

export interface PurchaseItemResponse {
    goldRemaining: number;
    userItem: UserInventoryItem;
}

export interface ActivateItemRequest {
    itemDefinitionId: number;
    forceReplace?: boolean;
}

export interface ActivateItemResponse {
    success: boolean;
    equipped?: boolean;
    conflict?: boolean;
    code?: string;
    message: string;
    activeItemName?: string;
}

export const itemApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getShopItems: builder.query<ShopItemsResponse, void>({
            query: () => "/api/shop/items",
            providesTags: ["User"],
        }),
        getUserInventory: builder.query<UserInventoryResponse, void>({
            query: () => "/api/inventory",
            providesTags: ["User"],
        }),
        getUserActiveEffects: builder.query<ActiveEffectsResponse, void>({
            query: () => "/api/inventory/active-effects",
            providesTags: ["User"],
        }),
        purchaseItem: builder.mutation<PurchaseItemResponse, PurchaseItemRequest>({
            query: (body) => ({
                url: "/api/shop/purchase",
                method: "POST",
                body,
            }),
            invalidatesTags: ["User"],
        }),
        activateItem: builder.mutation<ActivateItemResponse, ActivateItemRequest>({
            query: (body) => ({
                url: "/api/inventory/activate",
                method: "POST",
                body,
            }),
            invalidatesTags: ["User"],
        }),
    }),
    overrideExisting: __DEV__,
});

export const {
    useGetShopItemsQuery,
    useGetUserInventoryQuery,
    useGetUserActiveEffectsQuery,
    usePurchaseItemMutation,
    useActivateItemMutation,
} = itemApi;
