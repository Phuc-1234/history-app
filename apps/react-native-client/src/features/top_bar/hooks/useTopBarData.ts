import { useState, useEffect } from "react";

export interface TopBarData {
    profileImgUrl: string;
    badgeImgUrl: string | null;
    xp: number;
    gold: number;
    currentStreak: number;
}

export function useTopBarData() {
    const [data, setData] = useState<TopBarData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulating API/database fetch
        const fetchUserData = () => {
            setData({
                profileImgUrl:
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150", // Mock AI portrait
                badgeImgUrl:
                    "https://cdn-icons-png.flaticon.com/512/8215/8215545.png", // Mock medal icon
                xp: 300,
                gold: 1250,
                currentStreak: 7,
            });
            setLoading(false);
        };

        fetchUserData();
    }, []);

    return { data, loading };
}
