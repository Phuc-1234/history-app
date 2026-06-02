import { RewardPopupData } from "../types/reward";

export const mockRewardData: RewardPopupData = {
    currentRank: "\u0056\u00e0\u006e\u0067\u0020\u0049\u0049\u0049",
    nextRank: "\u0056\u00e0\u006e\u0067\u0020\u0049\u0049",
    currentXp: 1000,
    nextRankXp: 1111,
    ranks: [
        { id: "silver-2", label: "\u0042\u1ea1\u0063\u0020\u0049\u0049", status: "passed" },
        { id: "silver-1", label: "\u0042\u1ea1\u0063\u0020\u0049", status: "passed" },
        { id: "gold-3", label: "\u0056\u00e0\u006e\u0067\u0020\u0049\u0049\u0049", status: "current" },
        { id: "gold-1", label: "\u0056\u00e0\u006e\u0067\u0020\u0049", status: "upcoming" },
    ],
    rewards: [
        {
            id: "coin-50",
            title: "50 xu",
            description: "\u004e\u0068\u1ead\u006e\u0020\u0035\u0030\u0020\u0078\u0075\u0020\u006b\u0068\u0069\u0020\u0111\u1ea1\u0074\u0020\u0072\u0061\u006e\u006b\u0020\u0056\u00e0\u006e\u0067",
            status: "available",
            icon: "coin",
        },
        {
            id: "gold-badge",
            title: "\u0048\u0075\u0079\u0020\u0068\u0069\u1ec7\u0075\u0020\u0056\u00e0\u006e\u0067\u0020\u0049\u0049\u0049",
            description: "\u004d\u1edf\u0020\u006b\u0068\u00f3\u0061\u0020\u0068\u0075\u0079\u0020\u0068\u0069\u1ec7\u0075\u0020\u0063\u1ea5\u0070\u0020\u0062\u1ead\u0063",
            status: "claimed",
            icon: "badge",
        },
        {
            id: "avatar-frame",
            title: "\u004b\u0068\u0075\u006e\u0067\u0020\u0061\u0076\u0061\u0074\u0061\u0072\u0020\u0056\u00e0\u006e\u0067",
            description: "\u004d\u1edf\u0020\u006b\u0068\u00f3\u0061\u0020\u006b\u0068\u0075\u006e\u0067\u0020\u0061\u0076\u0061\u0074\u0061\u0072\u0020\u0064\u00e0\u006e\u0068\u0020\u0063\u0068\u006f\u0020\u0072\u0061\u006e\u006b\u0020\u0056\u00e0\u006e\u0067",
            status: "available",
            icon: "frame",
        },
    ],
};
