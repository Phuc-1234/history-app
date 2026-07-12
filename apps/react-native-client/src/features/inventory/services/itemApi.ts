import { apiSlice } from "@/services/apiSlice";

export interface ItemDefinition {
    id: number;
    name: string;
    maxStackSize: number | null;
    description: string | null;
    shownInStore: boolean;
    price: number;
    isConsumable: boolean;
    type: "SKIN" | "BOOST" | "BADGE";
    effectType: string | null;
    effectValue: number | null;
    imgUrl: string | null;
    equipmentSlot: string | null;
    durationMinutes: number | null;
    allowEffectStacking: boolean;
}

export interface UserInventoryItem {
    userId: string;
    itemDefinitionId: number;
    quantity: number;
    itemDefinition: ItemDefinition;
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
        purchaseItem: builder.mutation<PurchaseItemResponse, PurchaseItemRequest>({
            query: (body) => ({
                url: "/api/shop/purchase",
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
    usePurchaseItemMutation,
} = itemApi;
