import { useState } from "react";

export interface InventoryItem {
    id: string;
    name: string;
    description: string;
    quantity: number;
    icon: string;
    iconBgColor: string;
    iconColor: string;
    imageUrl: string;
}

export function useInventory() {
    const [inventory, setInventory] = useState<InventoryItem[]>([
        {
            id: "item-1",
            name: "Nhân đôi XP",
            description:
                "Sử dụng để nhân đôi điểm kinh nghiệm nhận được trong vòng 30 phút tiếp theo.",
            quantity: 5,
            icon: "🏆",
            iconBgColor: "#FFECC7",
            iconColor: "#FF9F00",
            imageUrl: "https://picsum.photos/id/1062/200/200", // Gold coin / amulet vibe
        },
        {
            id: "item-2",
            name: "Bao gồm Gợi ý",
            description:
                "Mở khóa các gợi ý chi tiết cho các câu hỏi ngữ pháp hóc búa.",
            quantity: 2,
            icon: "🗺️",
            iconBgColor: "#E3F2FD",
            iconColor: "#1E88E5",
            imageUrl: "https://picsum.photos/id/225/200/200",
        },
        {
            id: "item-3",
            name: "Bút Sửa Sai",
            description:
                "Tự động sửa một câu trả lời sai mà không làm mất lượt hoặc trái tim của bạn.",
            quantity: 12,
            icon: "✏️",
            iconBgColor: "#F3E5F5",
            iconColor: "#8E24AA",
            imageUrl: "https://picsum.photos/id/613/200/200",
        },
        {
            id: "item-4",
            name: "Khiên Bảo Vệ",
            description:
                "Bảo vệ chuỗi học tập của bạn không bị đứt gãy nếu lỡ quên học một ngày.",
            quantity: 1,
            icon: "🛡️",
            iconBgColor: "#FFEBEE",
            iconColor: "#E53935",
            imageUrl: "https://picsum.photos/id/1043/200/200",
        },
        {
            id: "item-5",
            name: "Chuông Báo Thức",
            description:
                "Nhắc nhở học tập đặc biệt giúp bạn nhân thêm 10% điểm thưởng khi hoàn thành bài sớm.",
            quantity: 3,
            icon: "🔔",
            iconBgColor: "#FFF8E1",
            iconColor: "#FBC02D",
            imageUrl: "https://picsum.photos/id/1021/200/200",
        },
        {
            id: "item-6",
            name: "Nhạc Tập Trung",
            description:
                "Mở khóa các bản nhạc sóng não Alpha độc quyền giúp tăng cường khả năng ghi nhớ từ vựng.",
            quantity: 8,
            icon: "🎵",
            iconBgColor: "#EDE7F6",
            iconColor: "#5E35B1",
            imageUrl: "https://picsum.photos/id/433/200/200",
        },
    ]);

    const [selectedItemId, setSelectedItemId] = useState<string>("item-1");

    const selectedItem =
        inventory.find((item) => item.id === selectedItemId) || inventory[0];

    const handleUseItem = (id: string) => {
        setInventory((prev) =>
            prev
                .map((item) =>
                    item.id === id
                        ? { ...item, quantity: item.quantity - 1 }
                        : item,
                )
                .filter((item) => item.quantity > 0),
        );
    };

    return {
        inventory,
        selectedItem,
        setSelectedItemId,
        handleUseItem,
    };
}
