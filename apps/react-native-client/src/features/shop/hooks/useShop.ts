import { useState, useMemo } from "react";

export interface ShopItem {
    id: string;
    name: string;
    description: string;
    cost: number;
    imageUrl: string;
    category: "powerup" | "cosmetic";
}

export function useShop() {
    const [searchQuery, setSearchQuery] = useState("");
    const [userCoins, setUserCoins] = useState(1250); // Matches top-bar asset counts in image_c61cbd.png
    const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);

    const shopItems: ShopItem[] = [
        {
            id: "shop-1",
            name: "Khung Chiến Binh Sử Học",
            description:
                "Khung avatar đặc biệt dành cho người dùng yêu thích chinh phục các thử thách lịch sử. Thể hiện đẳng cấp và sự am hiểu của bạn.",
            cost: 3000,
            imageUrl: "https://picsum.photos/id/1025/400/400", // Purple/gilded frame motif
            category: "cosmetic",
        },
        {
            id: "shop-2",
            name: "Huy Hiệu Nhà Khảo Cổ",
            description:
                "Hiển thị một huy hiệu lấp lánh bên cạnh tên của bạn trên bảng xếp hạng tuần này.",
            cost: 500,
            imageUrl: "https://picsum.photos/id/1062/400/400",
            category: "cosmetic",
        },
        {
            id: "shop-3",
            name: "Bình Tăng Tốc Đột Biến",
            description:
                "Nhận ngay 1 giờ nhân đôi kinh nghiệm (2x XP) cho mọi bài học lịch sử.",
            cost: 250,
            imageUrl: "https://picsum.photos/id/613/400/400",
            category: "powerup",
        },
        {
            id: "shop-4",
            name: "Trái Tim Bất Tử",
            description:
                "Nạp đầy năng lượng trái tim ngay lập tức để không bị gián đoạn chuỗi làm bài thi thử THPT.",
            cost: 750,
            imageUrl: "https://picsum.photos/id/1043/400/400",
            category: "powerup",
        },
        {
            id: "shop-5",
            name: "Khung Thăng Hoa Vương Giả",
            description:
                "Một thiết kế khung viền hoàng gia rực lửa cam neon dành riêng cho các bậc thầy chuỗi học tập.",
            cost: 1000,
            imageUrl: "https://picsum.photos/id/225/400/400",
            category: "cosmetic",
        },
        {
            id: "shop-6",
            name: "Gói Phao Cứu Sinh",
            description:
                "Tự động kích hoạt đóng băng chuỗi (Streak Freeze) nếu bạn lỡ quên học tối nay.",
            cost: 300,
            imageUrl: "https://picsum.photos/id/1021/400/400",
            category: "powerup",
        },
    ];

    const filteredItems = useMemo(() => {
        return shopItems.filter((item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()),
        );
    }, [searchQuery]);

    const handlePurchase = (item: ShopItem) => {
        if (userCoins >= item.cost) {
            setUserCoins((prev) => prev - item.cost);
            alert(`Mua thành công: ${item.name}!`);
            setSelectedItem(null);
        } else {
            alert("Bạn không đủ số lượng Xu để thực hiện giao dịch này.");
        }
    };

    return {
        searchQuery,
        setSearchQuery,
        userCoins,
        filteredItems,
        selectedItem,
        setSelectedItem,
        handlePurchase,
    };
}
