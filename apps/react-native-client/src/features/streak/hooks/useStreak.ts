import { useState, useEffect } from "react";

export interface Reward {
    id: number;
    title: string;
    description: string;
    type: "coin" | "badge";
    amount?: number;
    claimed: boolean;
}

export interface StreakMilestone {
    day: number;
    status: "completed" | "active" | "locked";
}

export function useStreak(initialStreak: number = 7) {
    const [celebrationVisible, setCelebrationVisible] = useState(false);
    const [streakVisible, setStreakVisible] = useState(false);
    const [rewardVisible, setRewardVisible] = useState(false);
    const [currentStreak, setCurrentStreak] = useState(initialStreak);

    const [rewards, setRewards] = useState<Reward[]>([
        {
            id: 1,
            title: "50 xu vàng",
            description: "Nhận 50 xu khi hoàn thành chuỗi",
            type: "coin",
            amount: 50,
            claimed: false,
        },
        {
            id: 2,
            title: "Huy hiệu Chăm Chỉ",
            description: "Huy hiệu vinh danh chuyên cần",
            type: "badge",
            claimed: true,
        },
    ]);

    const milestones: StreakMilestone[] = [
        { day: 3, status: "completed" },
        { day: 5, status: "completed" },
        { day: 7, status: "active" },
        { day: 10, status: "locked" },
        { day: 15, status: "locked" },
    ];

    useEffect(() => {
        setCurrentStreak(initialStreak);
    }, [initialStreak]);

    const openStreak = () => {
        setCelebrationVisible(true);
    };

    const closeCelebration = () => {
        setCelebrationVisible(false);
    };

    const proceedToStreakModal = () => {
        setCelebrationVisible(false);
        setStreakVisible(true);
    };

    const handleClaimReward = (id: number) => {
        setRewards((prev) =>
            prev.map((r) => (r.id === id ? { ...r, claimed: true } : r)),
        );
        // If claiming the coin reward (id === 1), transition to the RewardModal after animation delay
        if (id === 1) {
            setTimeout(() => {
                setStreakVisible(false);
                setRewardVisible(true);
            }, 600);
        }
    };

    const closeStreakModal = () => {
        setStreakVisible(false);
    };

    const closeRewardModal = () => {
        setRewardVisible(false);
    };

    return {
        celebrationVisible,
        streakVisible,
        rewardVisible,
        currentStreak,
        rewards,
        milestones,
        openStreak,
        closeCelebration,
        proceedToStreakModal,
        handleClaimReward,
        closeStreakModal,
        closeRewardModal,
    };
}
