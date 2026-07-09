import type { CardUser } from "@/components/ui";

/**
 * ⚠️ MOCK DATA — 4 màn thi đấu (ChallengeHub/Create/Battle/BattleResult) hiện
 * chưa kết nối backend. Khi có API thật, thay thế dữ liệu này bằng RTK Query.
 */

export const users: CardUser[] = [
    {
        id: "lan-chi",
        name: "Lan Chi",
        level: 12,
        avatar: "https://i.pravatar.cc/160?img=47",
        title: "Chuyên gia Nhà Trần",
        xp: 8640,
        streak: 30,
        mutualFriends: 5,
        winRate: 68,
    },
    {
        id: "minh-anh",
        name: "Minh Anh",
        level: 10,
        avatar: "https://i.pravatar.cc/160?img=32",
        title: "Đang ôn thi THPT",
        xp: 7210,
        streak: 18,
        mutualFriends: 3,
        winRate: 54,
    },
    {
        id: "quang-huy",
        name: "Quang Huy",
        level: 9,
        avatar: "https://i.pravatar.cc/160?img=12",
        title: "Yêu thích chiến dịch lịch sử",
        xp: 6780,
        streak: 5,
        mutualFriends: 2,
        winRate: 61,
    },
    {
        id: "bao-ngoc",
        name: "Bảo Ngọc",
        level: 7,
        avatar: "https://i.pravatar.cc/160?img=44",
        title: "Mới tham gia",
        xp: 4120,
        streak: 2,
        mutualFriends: 0,
        winRate: 49,
    },
];

export type ChallengeStatus = "incoming" | "outgoing" | "done";

export interface Challenge {
    id: string;
    opponent: CardUser;
    topic: string;
    status: ChallengeStatus;
    score?: string;
}

export const challenges: Challenge[] = [
    {
        id: "challenge-1",
        opponent: users[0],
        topic: "Nhà Trần chống Nguyên Mông",
        status: "incoming",
    },
    {
        id: "challenge-2",
        opponent: users[1],
        topic: "Các triều đại Việt Nam",
        status: "outgoing",
    },
    {
        id: "challenge-3",
        opponent: users[2],
        topic: "Nhân vật lịch sử nổi bật",
        status: "done",
        score: "85 - 70",
    },
];

export interface QuestionPack {
    id: string;
    title: string;
    meta: string;
    reward: string;
}

export const questionPacks: QuestionPack[] = [
    {
        id: "tran",
        title: "Nhà Trần chống Nguyên Mông",
        meta: "10 câu - 8 phút - Khó vừa",
        reward: "+120 XP",
    },
    {
        id: "dynasty",
        title: "Các triều đại Việt Nam",
        meta: "12 câu - 10 phút - Dễ",
        reward: "+90 XP",
    },
    {
        id: "people",
        title: "Nhân vật lịch sử nổi bật",
        meta: "15 câu - 12 phút - Trung bình",
        reward: "+110 XP",
    },
];
