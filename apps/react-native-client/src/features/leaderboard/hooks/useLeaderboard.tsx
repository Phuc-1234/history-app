import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

export interface User {
    id: number;
    name: string;
    xp: number;
    avatar: string;
}

export function useLeaderboard() {
    const { width } = useWindowDimensions();
    const isSmallDevice = width < 390;

    const topUsers: User[] = [
        {
            id: 2,
            name: "Minh Quân",
            xp: 3450,
            avatar: "https://i.pravatar.cc/100?img=12",
        },
        {
            id: 1,
            name: "Lan Anh",
            xp: 4200,
            avatar: "https://i.pravatar.cc/100?img=5",
        },
        {
            id: 3,
            name: "Hoàng Tú",
            xp: 3120,
            avatar: "https://i.pravatar.cc/100?img=15",
        },
    ];

    const rankingList: User[] = [
        {
            id: 4,
            name: "Bảo Hân",
            xp: 2950,
            avatar: "https://i.pravatar.cc/100?img=32",
        },
        {
            id: 5,
            name: "Bạn",
            xp: 2800,
            avatar: "https://i.pravatar.cc/100?img=20",
        },
        {
            id: 6,
            name: "Tuấn Phong",
            xp: 2600,
            avatar: "https://i.pravatar.cc/100?img=18",
        },
        { id: 7, name: "Thanh Nhàn", xp: 2450, avatar: "" },
    ];

    return {
        topUsers,
        rankingList,
        isSmallDevice,
    };
}
