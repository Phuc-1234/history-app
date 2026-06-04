import { Platform } from "react-native";
import type { MindMapNode } from "./types";

// ─── Branch Colors ──────────────────────────────────────────────────────────

export const BRANCH_COLORS = [
    { color: "#F5F3FF", borderColor: "#C4B5FD", accentColor: "#7C3AED", lightBg: "#FAF5FF" },
    { color: "#EFF6FF", borderColor: "#93C5FD", accentColor: "#2563EB", lightBg: "#F0F7FF" },
    { color: "#ECFDF5", borderColor: "#6EE7B7", accentColor: "#059669", lightBg: "#F0FDF4" },
    { color: "#FFFBEB", borderColor: "#FCD34D", accentColor: "#D97706", lightBg: "#FEFCE8" },
    { color: "#FFF1F2", borderColor: "#FDA4AF", accentColor: "#E11D48", lightBg: "#FFF1F2" },
];

export const SAFE_PADDING = Platform.OS === "web" ? 52 : 36;
export const MOBILE_BREAKPOINT = 600;

export const NODE_CONFIGS = {
    0: { minWidth: 200, height: 56, fontSize: 14, fontWeight: "700" as const, rx: 16, paddingH: 28, paddingV: 14 },
    1: { minWidth: 155, height: 44, fontSize: 12.5, fontWeight: "600" as const, rx: 12, paddingH: 22, paddingV: 12 },
    2: { minWidth: 120, height: 36, fontSize: 11.5, fontWeight: "500" as const, rx: 10, paddingH: 18, paddingV: 10 },
};

export const SPRING_CONFIG = { damping: 20, stiffness: 150 };

export function getScaleLimits(isMobile: boolean) {
    return { min: isMobile ? 0.45 : 0.35, max: isMobile ? 2 : 2.5 };
}

// ─── Sample Data: Lịch sử 11 — Kháng chiến chống thực dân Pháp (1946-1954) ──

export const SAMPLE_DATA: MindMapNode = {
    id: "root",
    label: "Kháng chiến chống thực dân Pháp (1946-1954)",
    color: "#7C3AED",
    borderColor: "#7C3AED",
    accentColor: "#5B21B6",
    children: [
        // ─── 1. Bối cảnh lịch sử ─────────────────────────────
        {
            id: "b1",
            label: "Bối cảnh lịch sử",
            ...BRANCH_COLORS[0],
            children: [
                {
                    id: "b1-1",
                    label: "Sau CMT8: VNDCCH non trẻ",
                    ...BRANCH_COLORS[0],
                    children: [
                        { id: "b1-1a", label: "2/9/1945: Hồ Chí Minh đọc Tuyên ngôn Độc lập", ...BRANCH_COLORS[0], children: [] },
                        { id: "b1-1b", label: "Nước VNDCCH ra đời", ...BRANCH_COLORS[0], children: [] },
                        { id: "b1-1c", label: "Thù trong giặc ngoài", ...BRANCH_COLORS[0], children: [] },
                    ],
                },
                {
                    id: "b1-2",
                    label: "Sự kiện Pháp quay lại xâm lược",
                    ...BRANCH_COLORS[0],
                    children: [
                        { id: "b1-2a", label: "23/9/1945: Pháp nổ súng chiếm Nam Bộ", ...BRANCH_COLORS[0], children: [] },
                        { id: "b1-2b", label: "6/3/1946: Hiệp định Sơ bộ Hoa - Pháp", ...BRANCH_COLORS[0], children: [] },
                        { id: "b1-2c", label: "Pháp thay thế Tưởng ở miền Bắc", ...BRANCH_COLORS[0], children: [] },
                    ],
                },
                {
                    id: "b1-3",
                    label: "Ngoại giao hòa hoãn",
                    ...BRANCH_COLORS[0],
                    children: [
                        { id: "b1-3a", label: "Hiệp định Sơ bộ 6/3/1946 (VN - Pháp)", ...BRANCH_COLORS[0], children: [] },
                        { id: "b1-3b", label: "Tạm ước 14/9/1946", ...BRANCH_COLORS[0], children: [] },
                        { id: "b1-3c", label: "Mục đích: tranh thủ thời gian chuẩn bị", ...BRANCH_COLORS[0], children: [] },
                    ],
                },
                {
                    id: "b1-4",
                    label: "Pháp phá hoại, tiến công",
                    ...BRANCH_COLORS[0],
                    children: [
                        { id: "b1-4a", label: "Pháp khiêu khích ở Hà Nội", ...BRANCH_COLORS[0], children: [] },
                        { id: "b1-4b", label: "19/12/1946: Toàn quốc kháng chiến bùng nổ", ...BRANCH_COLORS[0], children: [] },
                    ],
                },
            ],
        },
        // ─── 2. Đường lối kháng chiến ─────────────────────────
        {
            id: "b2",
            label: "Đường lối kháng chiến",
            ...BRANCH_COLORS[1],
            children: [
                {
                    id: "b2-1",
                    label: "Chỉ thị Toàn dân kháng chiến (12/12/1946)",
                    ...BRANCH_COLORS[1],
                    children: [
                        { id: "b2-1a", label: "Bất cứ đàn ông hay đàn bà", ...BRANCH_COLORS[1], children: [] },
                        { id: "b2-1b", label: "Bất kỳ người già hay trẻ", ...BRANCH_COLORS[1], children: [] },
                        { id: "b2-1c", label: "Không phân biệt tôn giáo, đảng phái", ...BRANCH_COLORS[1], children: [] },
                    ],
                },
                {
                    id: "b2-2",
                    label: "4 phương châm kháng chiến",
                    ...BRANCH_COLORS[1],
                    children: [
                        { id: "b2-2a", label: "Toàn dân: mọi người tham gia", ...BRANCH_COLORS[1], children: [] },
                        { id: "b2-2b", label: "Toàn diện: chính trị, quân sự, kinh tế, văn hóa", ...BRANCH_COLORS[1], children: [] },
                        { id: "b2-2c", label: "Trường kỳ: đánh lâu dài", ...BRANCH_COLORS[1], children: [] },
                        { id: "b2-2d", label: "Tự lực cánh sinh", ...BRANCH_COLORS[1], children: [] },
                    ],
                },
                {
                    id: "b2-3",
                    label: "Mục tiêu kháng chiến",
                    ...BRANCH_COLORS[1],
                    children: [
                        { id: "b2-3a", label: "Đánh đuổi thực dân Pháp", ...BRANCH_COLORS[1], children: [] },
                        { id: "b2-3b", label: "Giành độc lập dân tộc", ...BRANCH_COLORS[1], children: [] },
                        { id: "b2-3c", label: "Bảo vệ chính quyền dân chủ", ...BRANCH_COLORS[1], children: [] },
                    ],
                },
            ],
        },
        // ─── 3. Diễn biến chính ───────────────────────────────
        {
            id: "b3",
            label: "Diễn biến chính",
            ...BRANCH_COLORS[2],
            children: [
                {
                    id: "b3-1",
                    label: "Chiến đấu ở đô thị (12/1946)",
                    ...BRANCH_COLORS[2],
                    children: [
                        { id: "b3-1a", label: "Tiêu biểu: Hà Nội 60 ngày đêm", ...BRANCH_COLORS[2], children: [] },
                        { id: "b3-1b", label: "Mục đích: giam chân địch, chuẩn bị chuyển hướng", ...BRANCH_COLORS[2], children: [] },
                        { id: "b3-1c", label: "Rút lên căn cứ Việt Bắc", ...BRANCH_COLORS[2], children: [] },
                    ],
                },
                {
                    id: "b3-2",
                    label: "Chiến dịch Việt Bắc Thu - Đông 1947",
                    ...BRANCH_COLORS[2],
                    children: [
                        { id: "b3-2a", label: "Pháp tấn công Việt Bắc (đánh nhanh thắng nhanh)", ...BRANCH_COLORS[2], children: [] },
                        { id: "b3-2b", label: "Ta phòng ngự, phản công", ...BRANCH_COLORS[2], children: [] },
                        { id: "b3-2c", label: "Kết quả: Pháp thất bại, buộc chuyển sang đánh lâu dài", ...BRANCH_COLORS[2], children: [] },
                    ],
                },
                {
                    id: "b3-3",
                    label: "Chiến dịch Biên Giới Thu - Đông 1950",
                    ...BRANCH_COLORS[2],
                    children: [
                        { id: "b3-3a", label: "Bối cảnh: Pháp lập đường Đông - Tây (Hà Nội - Lào)", ...BRANCH_COLORS[2], children: [] },
                        { id: "b3-3b", label: "Ta chủ động tấn công trên chiến trường chính", ...BRANCH_COLORS[2], children: [] },
                        { id: "b3-3c", label: "Chiến thắng Đông Khê, Thất Khê", ...BRANCH_COLORS[2], children: [] },
                        { id: "b3-3d", label: "Ý nghĩa: ta giành chủ động chiến lược", ...BRANCH_COLORS[2], children: [] },
                    ],
                },
                {
                    id: "b3-4",
                    label: "Chiến dịch Điện Biên Phủ 1954",
                    ...BRANCH_COLORS[2],
                    children: [
                        { id: "b3-4a", label: "Pháp xây tập đoàn cứ điểm mạnh nhất ĐNA", ...BRANCH_COLORS[2], children: [] },
                        { id: "b3-4b", label: "Ta quyết định tiêu diệt tập đoàn", ...BRANCH_COLORS[2], children: [] },
                        { id: "b3-4c", label: "Chiến đấu 56 ngày đêm (13/3 - 7/5/1954)", ...BRANCH_COLORS[2], children: [] },
                        { id: "b3-4d", label: "Toàn bộ quân Pháp đầu hàng", ...BRANCH_COLORS[2], children: [] },
                    ],
                },
            ],
        },
        // ─── 4. Kết quả & Ý nghĩa ─────────────────────────────
        {
            id: "b4",
            label: "Kết quả và ý nghĩa",
            ...BRANCH_COLORS[3],
            children: [
                {
                    id: "b4-1",
                    label: "Kết quả",
                    ...BRANCH_COLORS[3],
                    children: [
                        { id: "b4-1a", label: "Chiến thắng ĐBP lịch sử", ...BRANCH_COLORS[3], children: [] },
                        { id: "b4-1b", label: "Hiệp định Genève 21/7/1954", ...BRANCH_COLORS[3], children: [] },
                        { id: "b4-1c", label: "Giải phóng hoàn toàn miền Bắc", ...BRANCH_COLORS[3], children: [] },
                    ],
                },
                {
                    id: "b4-2",
                    label: "Ý nghĩa trong nước",
                    ...BRANCH_COLORS[3],
                    children: [
                        { id: "b4-2a", label: "Củng cố chính quyền dân chủ nhân dân", ...BRANCH_COLORS[3], children: [] },
                        { id: "b4-2b", label: "Miền Bắc đi lên CNXH", ...BRANCH_COLORS[3], children: [] },
                        { id: "b4-2c", label: "Tiền đề cho cách mạng thống nhất đất nước", ...BRANCH_COLORS[3], children: [] },
                    ],
                },
                {
                    id: "b4-3",
                    label: "Ý nghĩa quốc tế",
                    ...BRANCH_COLORS[3],
                    children: [
                        { id: "b4-3a", label: "Cổ vũ phong trào GPDT ở châu Á - châu Phi", ...BRANCH_COLORS[3], children: [] },
                        { id: "b4-3b", label: "Góp phần phá vỡ hệ thống thuộc địa", ...BRANCH_COLORS[3], children: [] },
                        { id: "b4-3c", label: "Khẳng định sức mạnh Việt Nam", ...BRANCH_COLORS[3], children: [] },
                    ],
                },
            ],
        },
        // ─── 5. Bài học kinh nghiệm ───────────────────────────
        {
            id: "b5",
            label: "Bài học kinh nghiệm",
            ...BRANCH_COLORS[4],
            children: [
                {
                    id: "b5-1",
                    label: "Về đường lối",
                    ...BRANCH_COLORS[4],
                    children: [
                        { id: "b5-1a", label: "Độc lập tự chủ trong đường lối", ...BRANCH_COLORS[4], children: [] },
                        { id: "b5-1b", label: "Kết hợp sức mạnh dân tộc và thời đại", ...BRANCH_COLORS[4], children: [] },
                    ],
                },
                {
                    id: "b5-2",
                    label: "Về nghệ thuật quân sự",
                    ...BRANCH_COLORS[4],
                    children: [
                        { id: "b5-2a", label: "Chuyển từ phòng ngự sang tiến công", ...BRANCH_COLORS[4], children: [] },
                        { id: "b5-2b", label: "Chiến tranh nhân dân", ...BRANCH_COLORS[4], children: [] },
                        { id: "b5-2c", label: "Kết hợp đấu tranh quân sự và chính trị", ...BRANCH_COLORS[4], children: [] },
                    ],
                },
                {
                    id: "b5-3",
                    label: "Về đoàn kết",
                    ...BRANCH_COLORS[4],
                    children: [
                        { id: "b5-3a", label: "Đoàn kết toàn dân tộc", ...BRANCH_COLORS[4], children: [] },
                        { id: "b5-3b", label: "Đoàn kết quốc tế (Trung Quốc, Liên Xô, Lào, Campuchia)", ...BRANCH_COLORS[4], children: [] },
                    ],
                },
            ],
        },
    ],
};
