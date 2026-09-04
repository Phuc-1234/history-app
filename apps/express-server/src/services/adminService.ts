// services/adminService.ts
import { prisma } from "@history-app/shared";
import {
    GradeDto,
    TopicDto,
    LessonDto,
    SectionDto,
    NodeDto,
    CreateGradeBody,
    UpdateGradeBody,
    CreateTopicBody,
    UpdateTopicBody,
    CreateLessonBody,
    UpdateLessonBody,
    CreateSectionBody,
    UpdateSectionBody,
    CreateNodeBody,
    UpdateNodeBody,
    UpdateUserBody,
    AdminUserDto,
    CreateVideoBody,
    UpdateVideoBody,
    AdminVideoDto,
    CreateQuestionBody,
    UpdateQuestionBody,
    AdminQuestionDto,
    CreateTestBody,
    UpdateTestBody,
    AdminTestDto,
    FlashcardDto,
    CreateFlashcardBody,
    UpdateFlashcardBody,
    CreateRewardRuleBody,
    UpdateRewardRuleBody,
    RewardRuleDto,
    CreateItemDefinitionBody,
    UpdateItemDefinitionBody,
    ItemDefinitionDto,
    CreateTierBody,
    UpdateTierBody,
    AdminTierDto,
} from "@history-app/shared";
import { supabase } from "../config/supabaseClient";
import { contentService } from "./contentService";
import { Prisma } from "@prisma/client";
import { expandScopeToQuestionWhere } from "./testServiceV2";


// ─── Helpers: build AdminQuestionAnswerDto[] từ answers table VÀ answerDataJson ─
// Một số câu (vd. Đúng/Sai, AI-generated) không có records trong question_answers
// mà lưu đáp án trong field JSON `answerDataJson`. Hàm này parse JSON đó ra
// để admin luôn thấy đầy đủ đáp án bất kể nguồn lưu trữ.
type RawAnswer = {
    id: number;
    content: string;
    isCorrect: boolean | null;
    leftText: string | null;
    rightText: string | null;
    correctAnswer: string | null;
};

function buildAnswers(
    type: string,
    dbAnswers: RawAnswer[],
    answerDataJson: any,
): RawAnswer[] {
    // 1) Nếu đã có records trong table → dùng luôn
    if (Array.isArray(dbAnswers) && dbAnswers.length > 0) {
        return dbAnswers.map(a => ({
            id: a.id,
            content: a.content,
            isCorrect: a.isCorrect,
            leftText: a.leftText ?? null,
            rightText: a.rightText ?? null,
            correctAnswer: a.correctAnswer ?? null,
        }));
    }

    // 2) Parse answerDataJson theo type
    const data = answerDataJson && typeof answerDataJson === "object" ? answerDataJson : null;
    if (!data) return [];

    if (type === "CHOOSE") {
        // { options: ["A","B","C"], correctOption: [0,2] }
        const options: string[] = Array.isArray(data.options) ? data.options : [];
        const correctIdx: number[] = Array.isArray(data.correctOption) ? data.correctOption : [];
        return options.map((opt, idx) => ({
            id: -(idx + 1), // id âm để phân biệt với DB record
            content: String(opt ?? ""),
            isCorrect: correctIdx.includes(idx),
            leftText: null,
            rightText: null,
            correctAnswer: null,
        }));
    }

    if (type === "FILL") {
        // { acceptedAnswers: ["938","năm 938"] }
        const accepted: string[] = Array.isArray(data.acceptedAnswers) ? data.acceptedAnswers : [];
        return accepted.map((ans, idx) => ({
            id: -(idx + 1),
            content: String(ans ?? ""),
            isCorrect: true,
            leftText: null,
            rightText: null,
            correctAnswer: String(ans ?? ""),
        }));
    }

    if (type === "MATCH") {
        // { pairs: [ {left: right}, ... ] }
        const pairs: any[] = Array.isArray(data.pairs) ? data.pairs : [];
        const result: RawAnswer[] = [];
        let idCounter = -1;
        for (const pair of pairs) {
            if (pair && typeof pair === "object") {
                for (const [left, right] of Object.entries(pair)) {
                    result.push({
                        id: idCounter--,
                        content: "",
                        isCorrect: true,
                        leftText: String(left ?? ""),
                        rightText: String(right ?? ""),
                        correctAnswer: null,
                    });
                }
            }
        }
        return result;
    }

    return [];
}

async function resolveScopeNamesForQuestions(
    questions: { scopeType: string | null; scopeId: number | null }[]
): Promise<Map<string, string>> {
    const topicIds = new Set<number>();
    const lessonIds = new Set<number>();
    const sectionIds = new Set<number>();
    const nodeIds = new Set<number>();

    for (const q of questions) {
        if (!q.scopeId) continue;
        if (q.scopeType === "TOPIC") topicIds.add(q.scopeId);
        else if (q.scopeType === "LESSON") lessonIds.add(q.scopeId);
        else if (q.scopeType === "SECTION") sectionIds.add(q.scopeId);
        else if (q.scopeType === "NODE") nodeIds.add(q.scopeId);
    }

    const [topics, lessons, sections, nodes] = await Promise.all([
        topicIds.size > 0
            ? prisma.topic.findMany({
                where: { id: { in: Array.from(topicIds) } },
                select: { id: true, name: true },
            })
            : [],
        lessonIds.size > 0
            ? prisma.lesson.findMany({
                where: { id: { in: Array.from(lessonIds) } },
                select: { id: true, name: true, position: true },
            })
            : [],
        sectionIds.size > 0
            ? prisma.section.findMany({
                where: { id: { in: Array.from(sectionIds) } },
                select: { id: true, name: true },
            })
            : [],
        nodeIds.size > 0
            ? prisma.node.findMany({
                where: { id: { in: Array.from(nodeIds) } },
                select: { id: true, header: true, body: true },
            })
            : [],
    ]);

    const result = new Map<string, string>();
    for (const t of topics) result.set(`TOPIC:${t.id}`, t.name);
    for (const l of lessons) result.set(`LESSON:${l.id}`, l.position ? `Bài ${l.position}: ${l.name}` : l.name);
    for (const s of sections) result.set(`SECTION:${s.id}`, s.name);
    for (const n of nodes) {
        if (n.header && n.header.trim()) {
            result.set(`NODE:${n.id}`, n.header.trim());
        } else {
            const plain = n.body.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
            if (plain) result.set(`NODE:${n.id}`, plain);
        }
    }
    return result;
}

function getScopeName(
    q: { scopeType: string | null; scopeId: number | null },
    scopeNameMap: Map<string, string>
): string | null {
    if (q.scopeType === "NATIONAL") return "Quốc gia";
    if (q.scopeType === "GRADE") return q.scopeId ? `Khối ${q.scopeId}` : null;
    if (!q.scopeType || !q.scopeId) return null;
    return scopeNameMap.get(`${q.scopeType}:${q.scopeId}`) ?? null;
}

export class AdminService {
    // ─────────────────────────────── OVERVIEW STATS ───────────────────────────

    async getOverviewStats() {
        const [grades, topics, lessons, sections, mindMaps, users, videos, questions, tests, flashcards, rewardRules] = await prisma.$transaction([
            prisma.grade.count(),
            prisma.topic.count(),
            prisma.lesson.count(),
            prisma.section.count(),
            prisma.mindMap.count(),
            prisma.user.count(),
            prisma.video.count(),
            prisma.question.count(),
            prisma.test.count(),
            prisma.flashcard.count(),
            prisma.rewardRule.count(),
        ]);

        return {
            grades,
            topics,
            lessons,
            sections: sections > 0 ? sections : mindMaps,
            users,
            videos,
            questions,
            tests,
            flashcards,
            rewardRules,
        };
    }

    /**
     * Đếm số user DISTINCT nhận XP theo từng ngày trong N ngày gần nhất.
     * Nguồn: bảng UserXpLog (mỗi lần nhận XP = 1 row, đã có index [userId, createdAt]).
     * Trả về mảng { date: 'YYYY-MM-DD', count: number } cho mọi ngày trong khoảng
     * (kể cả ngày không có ai nhận XP thì count = 0).
     */
    async getXpActivitySeries(days: number = 30): Promise<{ date: string; count: number }[]> {
        const safeDays = Math.max(1, Math.min(Math.trunc(days) || 30, 90));
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const start = new Date(today);
        start.setDate(start.getDate() - (safeDays - 1));

        // Chỉ select 2 cột cần thiết, filter theo createdAt dùng index.
        const rows = await prisma.userXpLog.findMany({
            where: { createdAt: { gte: start } },
            select: { userId: true, createdAt: true },
        });

        // Đếm distinct userId theo ngày (local date, YYYY-MM-DD).
        const distinctByDay = new Map<string, Set<string>>();
        for (const r of rows) {
            const d = new Date(r.createdAt);
            d.setHours(0, 0, 0, 0);
            const key = d.toISOString().slice(0, 10);
            let set = distinctByDay.get(key);
            if (!set) {
                set = new Set<string>();
                distinctByDay.set(key, set);
            }
            set.add(r.userId);
        }

        // Fill đầy các ngày trong khoảng (đảm bảo thứ tự cũ -> mới).
        const dateList: Date[] = [];
        for (let i = safeDays - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            dateList.push(d);
        }

        return dateList.map((d) => {
            const key = d.toISOString().slice(0, 10);
            return { date: key, count: distinctByDay.get(key)?.size ?? 0 };
        });
    }

    /**
     * Helper: mốc bắt đầu của N ngày gần nhất (00:00 local, theo tuần hoàn cũ→mới).
     */
    private _seriesStart(days: number): Date {
        const safeDays = Math.max(1, Math.min(Math.trunc(days) || 30, 90));
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const start = new Date(today);
        start.setDate(start.getDate() - (safeDays - 1));
        return start;
    }

    /**
     * Section 1 — Hoạt động làm bài theo ngày.
     * Đếm từ user_test_logs WHERE status='COMPLETED' (đã nộp), group theo ngày nộp.
     * Phân tách: đề thủ công (test_id NOT NULL) vs đề tự động (test_id NULL).
     * Trả về mảng cho mọi ngày trong khoảng (cũ → mới).
     */
    async getTestActivitySeries(days: number = 30): Promise<{
        date: string;
        totalAttempts: number;
        distinctUsers: number;
        manualAttempts: number;
        autoAttempts: number;
    }[]> {
        const safeDays = Math.max(1, Math.min(Math.trunc(days) || 30, 90));
        const start = this._seriesStart(safeDays);

        // Raw SQL: group theo DATE(submitted_at). Parameterize an toàn qua $queryRaw.
        const rows: any[] = await prisma.$queryRaw`
            SELECT
                DATE(submitted_at) AS day,
                COUNT(*) FILTER (WHERE test_id IS NOT NULL) AS manual,
                COUNT(*) FILTER (WHERE test_id IS NULL)     AS auto
            FROM user_test_logs
            WHERE status = 'COMPLETED'
              AND submitted_at IS NOT NULL
              AND submitted_at >= ${start}
            GROUP BY DATE(submitted_at)
        `;

        // Đếm distinct user theo ngày (qua raw riêng cho rõ).
        const distinctRows: any[] = await prisma.$queryRaw`
            SELECT
                DATE(submitted_at) AS day,
                COUNT(DISTINCT user_id) AS distinct_users
            FROM user_test_logs
            WHERE status = 'COMPLETED'
              AND submitted_at IS NOT NULL
              AND submitted_at >= ${start}
            GROUP BY DATE(submitted_at)
        `;

        const byDay = new Map<string, { manual: number; auto: number }>();
        for (const r of rows) {
            const key = new Date(r.day).toISOString().slice(0, 10);
            byDay.set(key, {
                manual: Number(r.manual) || 0,
                auto: Number(r.auto) || 0,
            });
        }
        const distinctByDay = new Map<string, number>();
        for (const r of distinctRows) {
            const key = new Date(r.day).toISOString().slice(0, 10);
            distinctByDay.set(key, Number(r.distinct_users) || 0);
        }

        // Fill đầy ngày.
        const dateList: Date[] = [];
        const today = new Date(); today.setHours(0, 0, 0, 0);
        for (let i = safeDays - 1; i >= 0; i--) {
            const d = new Date(today); d.setDate(d.getDate() - i);
            dateList.push(d);
        }
        return dateList.map((d) => {
            const key = d.toISOString().slice(0, 10);
            const entry = byDay.get(key);
            const manual = entry?.manual ?? 0;
            const auto = entry?.auto ?? 0;
            return {
                date: key,
                totalAttempts: manual + auto,
                distinctUsers: distinctByDay.get(key) ?? 0,
                manualAttempts: manual,
                autoAttempts: auto,
            };
        });
    }

    /**
     * Section 2 — Tổng quan làm bài (KPI) trong N ngày.
     * Chỉ tính UserTestLog status='COMPLETED'.
     */
    async getTestOverview(days: number = 30): Promise<{
        totalAttempts: number;
        distinctUsers: number;
        manualAttempts: number;
        autoAttempts: number;
        passedCount: number;
        failedCount: number;
        avgScore: number;
        passRate: number;
    }> {
        const start = this._seriesStart(days);

        const rows: any[] = await prisma.$queryRaw`
            SELECT
                COUNT(*)                                        AS total_attempts,
                COUNT(DISTINCT user_id)                         AS distinct_users,
                COUNT(*) FILTER (WHERE test_id IS NOT NULL)     AS manual,
                COUNT(*) FILTER (WHERE test_id IS NULL)         AS auto,
                COUNT(*) FILTER (WHERE is_passed = TRUE)        AS passed,
                COUNT(*) FILTER (WHERE is_passed = FALSE)       AS failed,
                AVG(score)                                      AS avg_score
            FROM user_test_logs
            WHERE status = 'COMPLETED'
              AND submitted_at IS NOT NULL
              AND submitted_at >= ${start}
        `;
        const r = rows[0] ?? {};
        const total = Number(r.total_attempts) || 0;
        const passed = Number(r.passed) || 0;
        const failed = Number(r.failed) || 0;
        // passRate = passed / (passed + failed) (bỏ qua is_passed NULL).
        const decided = passed + failed;
        return {
            totalAttempts: total,
            distinctUsers: Number(r.distinct_users) || 0,
            manualAttempts: Number(r.manual) || 0,
            autoAttempts: Number(r.auto) || 0,
            passedCount: passed,
            failedCount: failed,
            avgScore: total > 0 ? Math.round((Number(r.avg_score) || 0) * 10) / 10 : 0,
            passRate: decided > 0 ? Math.round((passed / decided) * 1000) / 10 : 0,
        };
    }

    /**
     * Section 3 — Thống kê câu hỏi: top câu dễ sai + phân bố đúng/sai theo loại.
     * Nguồn: user_answer_logs JOIN questions. Chỉ tính rows có max_score > 0.
     * Sai = score_awarded < max_score.
     */
    async getQuestionStats(days: number = 30, limit: number = 10): Promise<{
        topWrong: {
            questionId: number;
            promptText: string;
            type: string;
            difficulty: number;
            totalAnswers: number;
            wrongCount: number;
            wrongRate: number;
        }[];
        typeBreakdown: {
            type: string;
            total: number;
            wrongCount: number;
            wrongRate: number;
        }[];
    }> {
        const start = this._seriesStart(days);
        const safeLimit = Math.max(1, Math.min(Math.trunc(limit) || 10, 50));

        const topRows: any[] = await prisma.$queryRaw`
            SELECT
                a.question_id                       AS question_id,
                q.prompt_text                       AS prompt_text,
                q.type                              AS question_type,
                q.difficulty                        AS difficulty,
                COUNT(*)                            AS total_answers,
                COUNT(*) FILTER (
                    WHERE a.score_awarded < a.max_score
                )                                   AS wrong_count,
                CASE
                    WHEN COUNT(*) > 0
                    THEN 1 - AVG((a.score_awarded / a.max_score)::decimal)
                    ELSE 0
                END                                 AS loss_rate
            FROM user_answer_logs a
            JOIN questions q ON q.id = a.question_id
            WHERE a.max_score > 0
              AND a.answered_at IS NOT NULL
              AND a.answered_at >= ${start}
            GROUP BY a.question_id, q.prompt_text, q.type, q.difficulty
            ORDER BY
                loss_rate DESC,
                COUNT(*) FILTER (WHERE a.score_awarded < a.max_score) DESC,
                COUNT(*) DESC
            LIMIT ${safeLimit}
        `;

        const typeRows: any[] = await prisma.$queryRaw`
            SELECT
                a.type                              AS question_type,
                COUNT(*)                            AS total,
                COUNT(*) FILTER (
                    WHERE a.score_awarded < a.max_score
                )                                   AS wrong_count,
                CASE
                    WHEN COUNT(*) > 0
                    THEN 1 - AVG((a.score_awarded / a.max_score)::decimal)
                    ELSE 0
                END                                 AS loss_rate
            FROM user_answer_logs a
            WHERE a.max_score > 0
              AND a.answered_at IS NOT NULL
              AND a.answered_at >= ${start}
            GROUP BY a.type
        `;

        const topWrong = topRows.map((r) => {
            const total = Number(r.total_answers) || 0;
            const wrong = Number(r.wrong_count) || 0;
            const loss = Number(r.loss_rate) || 0;
            return {
                questionId: Number(r.question_id),
                promptText: String(r.prompt_text ?? ""),
                type: String(r.question_type),
                difficulty: Number(r.difficulty) || 1,
                totalAnswers: total,
                wrongCount: wrong,
                wrongRate: total > 0 ? Math.round(loss * 1000) / 10 : 0,
            };
        });

        const typeBreakdown = typeRows.map((r) => {
            const total = Number(r.total) || 0;
            const wrong = Number(r.wrong_count) || 0;
            const loss = Number(r.loss_rate) || 0;
            return {
                type: String(r.question_type),
                total,
                wrongCount: wrong,
                wrongRate: total > 0 ? Math.round(loss * 1000) / 10 : 0,
            };
        });

        // NOTE: $queryRaw tự parameterize ${var}, không cần Prisma namespace.

        return { topWrong, typeBreakdown };
    }

    /**
     * Section — Tăng trưởng người dùng: số user "kích hoạt" (nhận XP lần đầu)
     * theo ngày. users không có createdAt nên mốc kích hoạt của mỗi user là
     * MIN(created_at) trong user_xp_logs.
     */
    async getUserGrowthSeries(days: number = 30): Promise<{
        series: { date: string; newUsers: number; cumulative: number }[];
        kpis: {
            newInPeriod: number;
            avgPerDay: number;
            bestDay: { date: string; count: number } | null;
            totalActivated: number;
        };
    }> {
        const safeDays = Math.max(1, Math.min(Math.trunc(days) || 30, 90));
        const start = this._seriesStart(safeDays);

        const rows: any[] = await prisma.$queryRaw`
            SELECT DATE(first_at) AS day, COUNT(*) AS new_users
            FROM (
                SELECT user_id, MIN(created_at) AS first_at
                FROM user_xp_logs
                GROUP BY user_id
            ) t
            WHERE first_at >= ${start}
            GROUP BY DATE(first_at)
            ORDER BY day
        `;

        const offsetRows: any[] = await prisma.$queryRaw`
            SELECT COUNT(*) AS cnt
            FROM (
                SELECT user_id, MIN(created_at) AS first_at
                FROM user_xp_logs
                GROUP BY user_id
            ) t
            WHERE first_at < ${start}
        `;
        const offset = Number(offsetRows[0]?.cnt) || 0;

        const byDay = new Map<string, number>();
        for (const r of rows) {
            const key = new Date(r.day).toISOString().slice(0, 10);
            byDay.set(key, Number(r.new_users) || 0);
        }

        const dateList: Date[] = [];
        const today = new Date(); today.setHours(0, 0, 0, 0);
        for (let i = safeDays - 1; i >= 0; i--) {
            const d = new Date(today); d.setDate(d.getDate() - i);
            dateList.push(d);
        }

        let running = offset;
        let newInPeriod = 0;
        let bestDay: { date: string; count: number } | null = null;
        const series = dateList.map((d) => {
            const key = d.toISOString().slice(0, 10);
            const n = byDay.get(key) ?? 0;
            running += n;
            newInPeriod += n;
            if (!bestDay || n > bestDay.count) bestDay = { date: key, count: n };
            return { date: key, newUsers: n, cumulative: running };
        });

        return {
            series,
            kpis: {
                newInPeriod,
                avgPerDay: Math.round((newInPeriod / safeDays) * 10) / 10,
                bestDay,
                totalActivated: running,
            },
        };
    }

    /**
     * Section — Doanh thu: gold_purchases + subscriptions.
     * Gold "đã thu" = status SUCCESS.
     * Sub "đã thu" = đã thanh toán (ACTIVE / CANCELLED / EXPIRED; PENDING và FAILED chưa thu).
     */
    async getRevenueStats(days: number = 30): Promise<{
        series: { date: string; goldRevenue: number; goldCount: number; subRevenue: number; subCount: number }[];
        kpis: {
            goldRevenueInPeriod: number;
            goldCountInPeriod: number;
            subRevenueInPeriod: number;
            subCountInPeriod: number;
            goldRevenueAllTime: number;
            subRevenueAllTime: number;
            activeSubscriptions: number;
            autoRenewCount: number;
            pendingPayments: number;
        };
    }> {
        const safeDays = Math.max(1, Math.min(Math.trunc(days) || 30, 90));
        const start = this._seriesStart(safeDays);

        const goldDaily: any[] = await prisma.$queryRaw`
            SELECT
                DATE(created_at) AS day,
                COALESCE(SUM(amount_vnd) FILTER (WHERE status = 'SUCCESS'), 0) AS revenue,
                COUNT(*) FILTER (WHERE status = 'SUCCESS') AS success_count
            FROM gold_purchases
            WHERE created_at >= ${start}
            GROUP BY DATE(created_at)
        `;
        const subDaily: any[] = await prisma.$queryRaw`
            SELECT
                DATE(created_at) AS day,
                COALESCE(SUM(amount_vnd) FILTER (WHERE status IN ('ACTIVE', 'CANCELLED', 'EXPIRED')), 0) AS revenue,
                COUNT(*) FILTER (WHERE status IN ('ACTIVE', 'CANCELLED', 'EXPIRED')) AS success_count
            FROM subscriptions
            WHERE created_at >= ${start}
            GROUP BY DATE(created_at)
        `;
        const goldKpi: any[] = await prisma.$queryRaw`
            SELECT
                COALESCE(SUM(amount_vnd) FILTER (WHERE status = 'SUCCESS'), 0) AS total_revenue,
                COUNT(*) FILTER (WHERE status = 'SUCCESS') AS success_count,
                COUNT(*) FILTER (WHERE status = 'PENDING') AS pending_count
            FROM gold_purchases
        `;
        const subKpi: any[] = await prisma.$queryRaw`
            SELECT
                COALESCE(SUM(amount_vnd) FILTER (WHERE status IN ('ACTIVE', 'CANCELLED', 'EXPIRED')), 0) AS total_revenue,
                COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_count,
                COUNT(*) FILTER (WHERE status = 'ACTIVE' AND auto_renew = TRUE) AS auto_renew_count,
                COUNT(*) FILTER (WHERE status = 'PENDING') AS pending_count
            FROM subscriptions
        `;

        const goldByDay = new Map<string, { revenue: number; count: number }>();
        for (const r of goldDaily) {
            goldByDay.set(new Date(r.day).toISOString().slice(0, 10), {
                revenue: Number(r.revenue) || 0,
                count: Number(r.success_count) || 0,
            });
        }
        const subByDay = new Map<string, { revenue: number; count: number }>();
        for (const r of subDaily) {
            subByDay.set(new Date(r.day).toISOString().slice(0, 10), {
                revenue: Number(r.revenue) || 0,
                count: Number(r.success_count) || 0,
            });
        }

        const dateList: Date[] = [];
        const today = new Date(); today.setHours(0, 0, 0, 0);
        for (let i = safeDays - 1; i >= 0; i--) {
            const d = new Date(today); d.setDate(d.getDate() - i);
            dateList.push(d);
        }
        const series = dateList.map((d) => {
            const key = d.toISOString().slice(0, 10);
            return {
                date: key,
                goldRevenue: goldByDay.get(key)?.revenue ?? 0,
                goldCount: goldByDay.get(key)?.count ?? 0,
                subRevenue: subByDay.get(key)?.revenue ?? 0,
                subCount: subByDay.get(key)?.count ?? 0,
            };
        });

        const g = goldKpi[0] ?? {};
        const s = subKpi[0] ?? {};
        return {
            series,
            kpis: {
                goldRevenueInPeriod: series.reduce((sum, r) => sum + r.goldRevenue, 0),
                goldCountInPeriod: series.reduce((sum, r) => sum + r.goldCount, 0),
                subRevenueInPeriod: series.reduce((sum, r) => sum + r.subRevenue, 0),
                subCountInPeriod: series.reduce((sum, r) => sum + r.subCount, 0),
                goldRevenueAllTime: Number(g.total_revenue) || 0,
                subRevenueAllTime: Number(s.total_revenue) || 0,
                activeSubscriptions: Number(s.active_count) || 0,
                autoRenewCount: Number(s.auto_renew_count) || 0,
                pendingPayments: (Number(g.pending_count) || 0) + (Number(s.pending_count) || 0),
            },
        };
    }

    /**
     * Section — Tiến độ học nội dung theo user_node_progress.
     * Một row = một user đã tương tác với một node; hoàn thành khi node_completed_at
     * IS NOT NULL. Tỉ lệ hoàn thành = completed / total trên các row đang có.
     */
    async getContentProgressStats(days: number = 30): Promise<{
        kpis: {
            totalRows: number;
            completedRows: number;
            completionRate: number;
            learners: number;
            studiesInPeriod: number;
        };
        studyActivity: { date: string; studies: number; learners: number }[];
        byGrade: { gradeId: number; learners: number; totalRows: number; completedRows: number; completionRate: number }[];
        topLessons: { lessonId: number; lessonName: string; gradeId: number; learners: number; totalRows: number; completedRows: number; completionRate: number }[];
    }> {
        const safeDays = Math.max(1, Math.min(Math.trunc(days) || 30, 90));
        const start = this._seriesStart(safeDays);

        const kpiRows: any[] = await prisma.$queryRaw`
            SELECT
                COUNT(*) AS total_rows,
                COUNT(*) FILTER (WHERE node_completed_at IS NOT NULL) AS completed_rows,
                COUNT(DISTINCT user_id) AS learners
            FROM user_node_progress
        `;
        const activityRows: any[] = await prisma.$queryRaw`
            SELECT
                DATE(studied_at) AS day,
                COUNT(*) AS studies,
                COUNT(DISTINCT user_id) AS learners
            FROM user_node_progress
            WHERE studied_at IS NOT NULL AND studied_at >= ${start}
            GROUP BY DATE(studied_at)
        `;
        const gradeRows: any[] = await prisma.$queryRaw`
            SELECT
                t.grade_id AS grade_id,
                COUNT(DISTINCT p.user_id) AS learners,
                COUNT(*) AS total_rows,
                COUNT(*) FILTER (WHERE p.node_completed_at IS NOT NULL) AS completed_rows
            FROM user_node_progress p
            JOIN nodes n ON n.id = p.node_id
            JOIN sections se ON se.id = n.section_id
            JOIN lessons l ON l.id = se.lesson_id
            JOIN topics t ON t.id = l.topic_id
            GROUP BY t.grade_id
            ORDER BY t.grade_id
        `;
        const lessonRows: any[] = await prisma.$queryRaw`
            SELECT
                l.id AS lesson_id,
                l.name AS lesson_name,
                MIN(t.grade_id) AS grade_id,
                COUNT(DISTINCT p.user_id) AS learners,
                COUNT(*) AS total_rows,
                COUNT(*) FILTER (WHERE p.node_completed_at IS NOT NULL) AS completed_rows
            FROM user_node_progress p
            JOIN nodes n ON n.id = p.node_id
            JOIN sections se ON se.id = n.section_id
            JOIN lessons l ON l.id = se.lesson_id
            JOIN topics t ON t.id = l.topic_id
            GROUP BY l.id, l.name
            ORDER BY learners DESC, total_rows DESC
            LIMIT 10
        `;

        const k = kpiRows[0] ?? {};
        const totalRows = Number(k.total_rows) || 0;
        const completedRows = Number(k.completed_rows) || 0;

        const byDay = new Map<string, { studies: number; learners: number }>();
        for (const r of activityRows) {
            byDay.set(new Date(r.day).toISOString().slice(0, 10), {
                studies: Number(r.studies) || 0,
                learners: Number(r.learners) || 0,
            });
        }
        const dateList: Date[] = [];
        const today = new Date(); today.setHours(0, 0, 0, 0);
        for (let i = safeDays - 1; i >= 0; i--) {
            const d = new Date(today); d.setDate(d.getDate() - i);
            dateList.push(d);
        }
        const studyActivity = dateList.map((d) => {
            const key = d.toISOString().slice(0, 10);
            return { date: key, studies: byDay.get(key)?.studies ?? 0, learners: byDay.get(key)?.learners ?? 0 };
        });

        return {
            kpis: {
                totalRows,
                completedRows,
                completionRate: totalRows > 0 ? Math.round((completedRows / totalRows) * 1000) / 10 : 0,
                learners: Number(k.learners) || 0,
                studiesInPeriod: studyActivity.reduce((sum, r) => sum + r.studies, 0),
            },
            studyActivity,
            byGrade: gradeRows.map((r) => {
                const total = Number(r.total_rows) || 0;
                const completed = Number(r.completed_rows) || 0;
                return {
                    gradeId: Number(r.grade_id),
                    learners: Number(r.learners) || 0,
                    totalRows: total,
                    completedRows: completed,
                    completionRate: total > 0 ? Math.round((completed / total) * 1000) / 10 : 0,
                };
            }),
            topLessons: lessonRows.map((r) => {
                const total = Number(r.total_rows) || 0;
                const completed = Number(r.completed_rows) || 0;
                return {
                    lessonId: Number(r.lesson_id),
                    lessonName: String(r.lesson_name ?? ''),
                    gradeId: Number(r.grade_id),
                    learners: Number(r.learners) || 0,
                    totalRows: total,
                    completedRows: completed,
                    completionRate: total > 0 ? Math.round((completed / total) * 1000) / 10 : 0,
                };
            }),
        };
    }

    // ─────────────────────────────── GRADE ────────────────────────────────────

    async createGrade(data: CreateGradeBody): Promise<GradeDto> {
        const grade = await prisma.grade.create({
            data: {
                id: data.id,
                state: data.state ?? "PRIVATE",
                isPro: data.isPro ?? false,
                imgUrl: data.imgUrl ?? null,
            },
        });
        return { id: grade.id, state: grade.state, isPro: grade.isPro, imgUrl: grade.imgUrl };
    }

    async updateGrade(id: number, data: UpdateGradeBody): Promise<GradeDto | null> {
        const existing = await prisma.grade.findUnique({ where: { id } });
        if (!existing) return null;

        const grade = await prisma.grade.update({
            where: { id },
            data: {
                ...(data.state !== undefined && { state: data.state }),
                ...(data.isPro !== undefined && { isPro: data.isPro }),
                ...(data.imgUrl !== undefined && { imgUrl: data.imgUrl }),
            },
        });
        return { id: grade.id, state: grade.state, isPro: grade.isPro, imgUrl: grade.imgUrl };
    }

    async deleteGrade(id: number): Promise<boolean> {
        const existing = await prisma.grade.findUnique({ where: { id } });
        if (!existing) return false;
        await prisma.grade.delete({ where: { id } });
        return true;
    }

    // ─────────────────────────────── TOPIC ────────────────────────────────────

    async createTopic(data: CreateTopicBody): Promise<TopicDto> {
        const topic = await prisma.topic.create({
            data: {
                name: data.name,
                position: data.position,
                gradeId: data.gradeId,
            },
        });
        return { id: topic.id, name: topic.name, position: topic.position, gradeId: topic.gradeId };
    }

    async updateTopic(id: number, data: UpdateTopicBody): Promise<TopicDto | null> {
        const existing = await prisma.topic.findUnique({ where: { id } });
        if (!existing) return null;

        const topic = await prisma.topic.update({
            where: { id },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.position !== undefined && { position: data.position }),
            },
        });
        return { id: topic.id, name: topic.name, position: topic.position, gradeId: topic.gradeId };
    }

    async deleteTopic(id: number): Promise<boolean> {
        const existing = await prisma.topic.findUnique({ where: { id } });
        if (!existing) return false;
        await prisma.topic.delete({ where: { id } });
        return true;
    }

    // ─────────────────────────────── LESSON ───────────────────────────────────

    async createLesson(data: CreateLessonBody): Promise<LessonDto> {
        const lesson = await prisma.lesson.create({
            data: {
                name: data.name,
                summary: data.summary ?? null,
                position: data.position,
                topicId: data.topicId,
                isPro: data.isPro ?? false,
                imgUrl: data.imgUrl ?? null,
            },
        });
        return {
            id: lesson.id,
            name: lesson.name,
            summary: lesson.summary ?? null,
            position: lesson.position,
            topicId: lesson.topicId,
            isPro: lesson.isPro,
            imgUrl: lesson.imgUrl,
        };
    }

    async updateLesson(id: number, data: UpdateLessonBody): Promise<LessonDto | null> {
        const existing = await prisma.lesson.findUnique({ where: { id } });
        if (!existing) return null;

        const lesson = await prisma.lesson.update({
            where: { id },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.summary !== undefined && { summary: data.summary }),
                ...(data.position !== undefined && { position: data.position }),
                ...(data.topicId !== undefined && { topicId: data.topicId }),
                ...(data.isPro !== undefined && { isPro: data.isPro }),
                ...(data.imgUrl !== undefined && { imgUrl: data.imgUrl }),
            },
        });
        return {
            id: lesson.id,
            name: lesson.name,
            summary: lesson.summary ?? null,
            position: lesson.position,
            topicId: lesson.topicId,
            isPro: lesson.isPro,
            imgUrl: lesson.imgUrl,
        };
    }

    async deleteLesson(id: number): Promise<boolean> {
        const existing = await prisma.lesson.findUnique({ where: { id } });
        if (!existing) return false;
        await prisma.lesson.delete({ where: { id } });
        return true;
    }

    // ─────────────────────────────── MINDMAP SYNC ──────────────────────────────

    async syncMindMapForLesson(lessonId: number): Promise<void> {
        try {
            const tree = await contentService.generateMindMapForLesson(lessonId);
            await prisma.mindMap.upsert({
                where: { lessonId },
                update: { data: tree as any },
                create: { lessonId, data: tree as any },
            });
        } catch (err) {
            console.error(`Error syncing mind map for lesson ${lessonId}:`, err);
        }
    }

    // ─────────────────────────────── SECTION ──────────────────────────────────

    async createSection(data: CreateSectionBody): Promise<SectionDto> {
        const section = await prisma.section.create({
            data: {
                name: data.name,
                summary: data.summary ?? null,
                position: data.position,
                lessonId: data.lessonId,
                parentSectionId: data.parentSectionId ?? null,
            },
        });
        return {
            id: section.id,
            name: section.name,
            summary: section.summary ?? null,
            position: section.position,
            lessonId: section.lessonId,
            parentSectionId: section.parentSectionId ?? null,
        };
    }

    async updateSection(id: number, data: UpdateSectionBody): Promise<SectionDto | null> {
        const existing = await prisma.section.findUnique({ where: { id } });
        if (!existing) return null;

        const section = await prisma.section.update({
            where: { id },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.summary !== undefined && { summary: data.summary }),
                ...(data.position !== undefined && { position: data.position }),
                ...(data.parentSectionId !== undefined && {
                    parentSectionId: data.parentSectionId,
                }),
            },
        });
        return {
            id: section.id,
            name: section.name,
            summary: section.summary ?? null,
            position: section.position,
            lessonId: section.lessonId,
            parentSectionId: section.parentSectionId ?? null,
        };
    }

    async deleteSection(id: number): Promise<boolean> {
        const existing = await prisma.section.findUnique({ where: { id } });
        if (!existing) return false;
        await prisma.section.delete({ where: { id } });
        return true;
    }

    // ─────────────────────────────── NODE ─────────────────────────────────────

    async createNode(data: CreateNodeBody): Promise<NodeDto> {
        const node = await prisma.node.create({
            data: {
                position: data.position,
                header: data.header ?? null,
                body: data.body,
                imgUrl: data.imgUrl ?? null,
                videoId: data.videoId ?? null,
                sectionId: data.sectionId,
            },
        });
        return {
            id: node.id,
            position: node.position,
            header: node.header ?? null,
            body: node.body,
            imgUrl: node.imgUrl ?? null,
            videoId: node.videoId,
            sectionId: node.sectionId,
        };
    }

    async updateNode(id: number, data: UpdateNodeBody): Promise<NodeDto | null> {
        const existing = await prisma.node.findUnique({
            where: { id },
            include: { section: true },
        });
        if (!existing) return null;

        const node = await prisma.node.update({
            where: { id },
            data: {
                ...(data.position !== undefined && { position: data.position }),
                ...(data.header !== undefined && { header: data.header }),
                ...(data.body !== undefined && { body: data.body }),
                ...(data.imgUrl !== undefined && { imgUrl: data.imgUrl }),
                ...(data.videoId !== undefined && { videoId: data.videoId }),
                ...(data.sectionId !== undefined && { sectionId: data.sectionId }),
            },
        });
        return {
            id: node.id,
            position: node.position,
            header: node.header ?? null,
            body: node.body,
            imgUrl: node.imgUrl ?? null,
            videoId: node.videoId,
            sectionId: node.sectionId,
        };
    }

    async deleteNode(id: number): Promise<boolean> {
        const existing = await prisma.node.findUnique({
            where: { id },
            include: { section: true },
        });
        if (!existing) return false;
        await prisma.node.delete({ where: { id } });
        return true;
    }

    // ─────────────────────────────── USER ─────────────────────────────────────

    async listUsers(search?: string, role?: string): Promise<AdminUserDto[]> {
        const users = await prisma.user.findMany({
            where: {
                AND: [
                    search ? {
                        OR: [
                            { email: { contains: search, mode: "insensitive" } },
                            { name: { contains: search, mode: "insensitive" } },
                        ],
                    } : {},
                    role ? { role: role as any } : {},
                ],
            },
            orderBy: { name: "asc" },
        });

        return users.map(u => ({
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role,
            totalXp: u.totalXp,
            totalGold: u.totalGold,
            isHidden: u.isHidden,
            isVerified: u.isVerified,
            profileImgUrl: u.profileImgUrl ?? null,
            currentStreak: u.currentStreak,
            highestStreak: u.highestStreak,
            lastXpGainedAt: u.lastXpGainedAt,
        }));
    }

    async updateUser(id: string, data: UpdateUserBody): Promise<AdminUserDto | null> {
        const existing = await prisma.user.findUnique({ where: { id } });
        if (!existing) return null;

        const updated = await prisma.user.update({
            where: { id },
            data: {
                ...(data.role !== undefined && { role: data.role as any }),
                ...(data.isHidden !== undefined && { isHidden: data.isHidden }),
            },
        });

        return {
            id: updated.id,
            email: updated.email,
            name: updated.name,
            role: updated.role,
            totalXp: updated.totalXp,
            totalGold: updated.totalGold,
            isHidden: updated.isHidden,
            isVerified: updated.isVerified,
            profileImgUrl: updated.profileImgUrl ?? null,
            currentStreak: updated.currentStreak,
            highestStreak: updated.highestStreak,
            lastXpGainedAt: updated.lastXpGainedAt,
        };
    }

    async deleteUser(id: string): Promise<boolean> {
        const existing = await prisma.user.findUnique({ where: { id } });
        if (!existing) return false;

        // 1. Delete from Supabase Auth
        try {
            await supabase.auth.admin.deleteUser(id);
        } catch (authErr) {
            console.error(`Failed to delete user ${id} from Supabase auth:`, authErr);
        }

        // 2. Delete from Postgres
        await prisma.user.delete({ where: { id } });
        return true;
    }

    // ─────────────────────────────── VIDEO ────────────────────────────────────

    async listVideos(lessonId?: number): Promise<AdminVideoDto[]> {
        const videos = await prisma.video.findMany({
            where: lessonId ? { lessonId } : {},
            orderBy: { position: "asc" },
        });
        return videos.map(v => ({
            id: v.id,
            title: v.title,
            position: v.position,
            summary: v.summary ?? null,
            hlsUrl: v.hlsUrl,
            status: v.status,
            lessonId: v.lessonId,
        }));
    }

    async createVideo(data: CreateVideoBody & { status?: any }): Promise<AdminVideoDto> {
        const video = await prisma.video.create({
            data: {
                title: data.title,
                position: data.position ?? 0,
                summary: data.summary ?? null,
                hlsUrl: data.hlsUrl,
                lessonId: data.lessonId,
                status: data.status ?? "READY",
            },
        });
        return {
            id: video.id,
            title: video.title,
            position: video.position,
            summary: video.summary ?? null,
            hlsUrl: video.hlsUrl,
            status: video.status,
            lessonId: video.lessonId,
        };
    }

    async updateVideo(id: string, data: UpdateVideoBody): Promise<AdminVideoDto | null> {
        const existing = await prisma.video.findUnique({ where: { id } });
        if (!existing) return null;

        const updated = await prisma.video.update({
            where: { id },
            data: {
                ...(data.title !== undefined && { title: data.title }),
                ...(data.position !== undefined && { position: data.position }),
                ...(data.summary !== undefined && { summary: data.summary }),
                ...(data.hlsUrl !== undefined && { hlsUrl: data.hlsUrl }),
                ...(data.lessonId !== undefined && { lessonId: data.lessonId }),
            },
        });
        return {
            id: updated.id,
            title: updated.title,
            position: updated.position,
            summary: updated.summary ?? null,
            hlsUrl: updated.hlsUrl,
            status: updated.status,
            lessonId: updated.lessonId,
        };
    }

    async deleteVideo(id: string): Promise<boolean> {
        const existing = await prisma.video.findUnique({ where: { id } });
        if (!existing) return false;
        await prisma.video.delete({ where: { id } });
        return true;
    }

    // ─────────────────────────────── QUESTION ─────────────────────────────────

    async listQuestions(
        scopeType?: string,
        scopeId?: number,
        type?: string,
        search?: string,
        page: number = 1,
        limit: number = 50,
        prioritizeIds?: number[],
        ids?: number[]
    ): Promise<{ questions: AdminQuestionDto[]; total: number; page: number; limit: number; totalPages: number }> {
        const scopeWhere = await expandScopeToQuestionWhere(scopeType, scopeId, false);

        const searchConditions: Prisma.QuestionWhereInput[] = [];
        if (search && search.trim()) {
            const q = search.trim();
            const idNum = Number(q.replace(/^#/, ""));
            if (!isNaN(idNum) && idNum > 0) {
                searchConditions.push({ id: idNum });
            }
            searchConditions.push({ promptText: { contains: q, mode: "insensitive" } });
            searchConditions.push({ document: { contains: q, mode: "insensitive" } });
            searchConditions.push({ explanation: { contains: q, mode: "insensitive" } });
        }

        const andConditions: Prisma.QuestionWhereInput[] = [];
        if (scopeWhere && Object.keys(scopeWhere).length > 0) {
            andConditions.push(scopeWhere);
        }
        if (type) {
            andConditions.push({ type: type as any });
        }
        if (ids && ids.length > 0) {
            andConditions.push({ id: { in: ids } });
        }
        if (searchConditions.length > 0) {
            andConditions.push({ OR: searchConditions });
        }

        const where: Prisma.QuestionWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

        let total = 0;
        let questions: any[] = [];

        if (prioritizeIds && prioritizeIds.length > 0) {
            const [totalCount, prioritizedTotal] = await Promise.all([
                prisma.question.count({ where }),
                prisma.question.count({ where: { ...where, id: { in: prioritizeIds } } }),
            ]);
            total = totalCount;

            if (prioritizedTotal === 0) {
                const skip = (page - 1) * limit;
                questions = await prisma.question.findMany({
                    where,
                    include: { answers: true },
                    orderBy: { id: "desc" },
                    skip,
                    take: limit,
                });
            } else {
                const prioritizedSkip = (page - 1) * limit;
                if (prioritizedSkip < prioritizedTotal) {
                    const pTake = Math.min(limit, prioritizedTotal - prioritizedSkip);
                    const pQuestions = await prisma.question.findMany({
                        where: { ...where, id: { in: prioritizeIds } },
                        include: { answers: true },
                        orderBy: { id: "desc" },
                        skip: prioritizedSkip,
                        take: pTake,
                    });
                    const remainingTake = limit - pTake;
                    let oQuestions: any[] = [];
                    if (remainingTake > 0) {
                        oQuestions = await prisma.question.findMany({
                            where: { ...where, id: { notIn: prioritizeIds } },
                            include: { answers: true },
                            orderBy: { id: "desc" },
                            skip: 0,
                            take: remainingTake,
                        });
                    }
                    questions = [...pQuestions, ...oQuestions];
                } else {
                    const otherSkip = prioritizedSkip - prioritizedTotal;
                    questions = await prisma.question.findMany({
                        where: { ...where, id: { notIn: prioritizeIds } },
                        include: { answers: true },
                        orderBy: { id: "desc" },
                        skip: otherSkip,
                        take: limit,
                    });
                }
            }
        } else {
            const skip = (page - 1) * limit;
            const take = limit;

            const [totalCount, fetchedQuestions] = await Promise.all([
                prisma.question.count({ where }),
                prisma.question.findMany({
                    where,
                    include: {
                        answers: true,
                    },
                    orderBy: { id: "desc" },
                    skip,
                    take,
                }),
            ]);
            total = totalCount;
            questions = fetchedQuestions;
        }

        const scopeNameMap = await resolveScopeNamesForQuestions(questions);

        const mappedQuestions = questions.map(q => ({
            id: q.id,
            type: q.type,
            difficulty: q.difficulty,
            promptText: q.promptText,
            document: q.document ?? null,
            explanation: q.explanation ?? null,
            isActive: q.isActive,
            scopeId: q.scopeId,
            scopeType: q.scopeType,
            scopeName: getScopeName(q, scopeNameMap),
            answerDataJson: q.answerDataJson ?? null,
            gradeId: q.gradeId,
            topicId: q.topicId,
            lessonId: q.lessonId,
            sectionId: q.sectionId,
            nodeId: q.nodeId,
            answers: buildAnswers(q.type, q.answers as RawAnswer[], q.answerDataJson),
        }));

        return {
            questions: mappedQuestions,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        };
    }

    async getQuestionById(id: number): Promise<AdminQuestionDto | null> {
        const question = await prisma.question.findUnique({
            where: { id },
            include: { answers: true },
        });
        if (!question) return null;

        const scopeNameMap = await resolveScopeNamesForQuestions([question]);

        return {
            id: question.id,
            type: question.type,
            difficulty: question.difficulty,
            promptText: question.promptText,
            document: question.document ?? null,
            explanation: question.explanation ?? null,
            isActive: question.isActive,
            scopeId: question.scopeId,
            scopeType: question.scopeType,
            scopeName: getScopeName(question, scopeNameMap),
            answerDataJson: question.answerDataJson ?? null,
            gradeId: question.gradeId,
            topicId: question.topicId,
            lessonId: question.lessonId,
            sectionId: question.sectionId,
            nodeId: question.nodeId,
            answers: buildAnswers(question.type, question.answers as RawAnswer[], question.answerDataJson),
        };
    }

    async createQuestion(data: CreateQuestionBody): Promise<AdminQuestionDto> {
        const question = await prisma.question.create({
            data: {
                type: data.type,
                difficulty: data.difficulty,
                promptText: data.promptText,
                document: data.document ?? null,
                explanation: data.explanation ?? null,
                isActive: data.isActive ?? true,
                scopeId: data.scopeId ?? null,
                scopeType: data.scopeType ? (data.scopeType as any) : null,
                answerDataJson: data.answerDataJson ?? null,
                gradeId: data.gradeId ?? null,
                topicId: data.topicId ?? null,
                lessonId: data.lessonId ?? null,
                sectionId: data.sectionId ?? null,
                nodeId: data.nodeId ?? null,
                answers: data.answers ? {
                    create: data.answers.map(a => ({
                        content: a.content,
                        isCorrect: a.isCorrect ?? null,
                        leftText: a.leftText ?? null,
                        rightText: a.rightText ?? null,
                        correctAnswer: a.correctAnswer ?? null,
                    })),
                } : undefined,
            },
            include: {
                answers: true,
            },
        });

        return {
            id: question.id,
            type: question.type,
            difficulty: question.difficulty,
            promptText: question.promptText,
            document: question.document ?? null,
            explanation: question.explanation ?? null,
            isActive: question.isActive,
            scopeId: question.scopeId,
            scopeType: question.scopeType,
            answerDataJson: question.answerDataJson ?? null,
            gradeId: question.gradeId,
            topicId: question.topicId,
            lessonId: question.lessonId,
            sectionId: question.sectionId,
            nodeId: question.nodeId,
            answers: question.answers.map(a => ({
                id: a.id,
                content: a.content,
                isCorrect: a.isCorrect,
                leftText: a.leftText ?? null,
                rightText: a.rightText ?? null,
                correctAnswer: a.correctAnswer ?? null,
            })),
        };
    }

    async updateQuestion(id: number, data: UpdateQuestionBody): Promise<AdminQuestionDto | null> {
        const existing = await prisma.question.findUnique({ where: { id } });
        if (!existing) return null;

        const question = await prisma.$transaction(async (tx) => {
            if (data.answers !== undefined && data.answers !== null) {
                await tx.questionAnswer.deleteMany({ where: { questionId: id } });
            }

            return await tx.question.update({
                where: { id },
                data: {
                    ...(data.type !== undefined && { type: data.type }),
                    ...(data.difficulty !== undefined && { difficulty: data.difficulty }),
                    ...(data.promptText !== undefined && { promptText: data.promptText }),
                    ...(data.document !== undefined && { document: data.document }),
                    ...(data.explanation !== undefined && { explanation: data.explanation }),
                    ...(data.isActive !== undefined && { isActive: data.isActive }),
                    ...(data.scopeId !== undefined && { scopeId: data.scopeId }),
                    ...(data.scopeType !== undefined && { scopeType: data.scopeType ? (data.scopeType as any) : null }),
                    ...(data.answerDataJson !== undefined && { answerDataJson: data.answerDataJson }),
                    ...(data.gradeId !== undefined && { gradeId: data.gradeId }),
                    ...(data.topicId !== undefined && { topicId: data.topicId }),
                    ...(data.lessonId !== undefined && { lessonId: data.lessonId }),
                    ...(data.sectionId !== undefined && { sectionId: data.sectionId }),
                    ...(data.nodeId !== undefined && { nodeId: data.nodeId }),
                    ...(data.answers !== undefined && data.answers !== null && {
                        answers: {
                            create: data.answers.map(a => ({
                                content: a.content,
                                isCorrect: a.isCorrect ?? null,
                                leftText: a.leftText ?? null,
                                rightText: a.rightText ?? null,
                                correctAnswer: a.correctAnswer ?? null,
                            })),
                        },
                    }),
                },
                include: {
                    answers: true,
                },
            });
        });

        return {
            id: question.id,
            type: question.type,
            difficulty: question.difficulty,
            promptText: question.promptText,
            document: question.document ?? null,
            explanation: question.explanation ?? null,
            isActive: question.isActive,
            scopeId: question.scopeId,
            scopeType: question.scopeType,
            answerDataJson: question.answerDataJson ?? null,
            gradeId: question.gradeId,
            topicId: question.topicId,
            lessonId: question.lessonId,
            sectionId: question.sectionId,
            nodeId: question.nodeId,
            answers: question.answers.map(a => ({
                id: a.id,
                content: a.content,
                isCorrect: a.isCorrect,
                leftText: a.leftText ?? null,
                rightText: a.rightText ?? null,
                correctAnswer: a.correctAnswer ?? null,
            })),
        };
    }

    async deleteQuestion(id: number): Promise<boolean> {
        const existing = await prisma.question.findUnique({ where: { id } });
        if (!existing) return false;
        await prisma.question.delete({ where: { id } });
        return true;
    }

    // ─────────────────────────────── TEST ─────────────────────────────────────

    async listTests(): Promise<AdminTestDto[]> {
        const tests = await prisma.test.findMany({
            include: {
                preset: true,
                testQuestions: {
                    select: {
                        questionId: true,
                    },
                },
            },
            orderBy: { title: "asc" },
        });

        const lessonIds = Array.from(new Set(
            tests
                .filter(t => (t.scopeType === "LESSON" && t.scopeId) || t.lessonId)
                .map(t => ((t.scopeType === "LESSON" && t.scopeId) ? t.scopeId! : t.lessonId!))
        ));

        const lessons = lessonIds.length > 0
            ? await prisma.lesson.findMany({
                where: { id: { in: lessonIds } },
                select: { id: true, name: true, position: true },
            })
            : [];
        const lessonMap = new Map(lessons.map(l => [l.id, l]));

        return tests.map(t => {
            const lId = (t.scopeType === "LESSON" && t.scopeId) ? t.scopeId : t.lessonId;
            const lesson = lId ? lessonMap.get(lId) : undefined;

            return {
                id: t.id,
                title: t.title,
                summary: t.summary ?? null,
                presetId: t.presetId,
                scopeId: t.scopeId,
                scopeType: t.scopeType,
                isManual: (t as any).isManual ?? false,
                isNationalTest: t.isNationalTest,
                isPro: t.isPro,
                imgUrl: t.imgUrl ?? null,
                questionNumber: t.preset?.questionCount ?? t.questionNumber,
                timeLimit: t.preset?.timeLimit ?? t.timeLimit,
                xpReward: t.xpReward,
                goldReward: t.goldReward,
                passThreshold: t.preset?.passThreshold ?? t.passThreshold,
                gradeId: t.gradeId,
                topicId: t.topicId,
                lessonId: t.lessonId,
                sectionId: t.sectionId,
                questionIds: t.testQuestions.map(tq => tq.questionId),
                lesson: lesson ? { id: lesson.id, name: lesson.name, position: lesson.position } : undefined,
            };
        });
    }

    async createTest(data: CreateTestBody): Promise<AdminTestDto> {
        const test = await prisma.$transaction(async (tx) => {
            const newTest = await tx.test.create({
                data: {
                    title: data.title,
                    summary: data.summary ?? null,
                    presetId: data.presetId ?? null,
                    scopeId: data.scopeId ?? null,
                    scopeType: data.scopeType ? (data.scopeType as any) : null,
                    isNationalTest: data.isNationalTest,
                    isPro: data.isPro ?? false,
                    imgUrl: data.imgUrl ?? null,
                    questionNumber: data.questionNumber ?? 10,
                    timeLimit: data.timeLimit ?? null,
                    xpReward: data.xpReward ?? 0,
                    goldReward: data.goldReward ?? 0,
                    passThreshold: data.passThreshold ?? 70,
                },
            });

            if (data.questionIds && data.questionIds.length > 0) {
                await tx.testQuestion.createMany({
                    data: data.questionIds.map((qid, idx) => ({
                        testId: newTest.id,
                        questionId: qid,
                        position: idx + 1,
                    })),
                });
            }

            return newTest;
        });

        const testQuestions = await prisma.testQuestion.findMany({
            where: { testId: test.id },
            select: { questionId: true },
        });
        const preset = test.presetId ? await prisma.testPreset.findUnique({ where: { id: test.presetId } }) : null;
        const targetLessonId = (test.scopeType === 'LESSON' && test.scopeId) ? test.scopeId : test.lessonId;
        const lesson = targetLessonId ? await prisma.lesson.findUnique({ where: { id: targetLessonId }, select: { id: true, name: true, position: true } }) : null;

        return {
            id: test.id,
            title: test.title,
            summary: test.summary ?? null,
            presetId: test.presetId,
            scopeId: test.scopeId,
            scopeType: test.scopeType,
            isManual: (test as any).isManual ?? false,
            isNationalTest: test.isNationalTest,
            isPro: test.isPro,
            imgUrl: test.imgUrl ?? null,
            questionNumber: preset?.questionCount ?? test.questionNumber,
            timeLimit: preset?.timeLimit ?? test.timeLimit,
            xpReward: test.xpReward,
            goldReward: test.goldReward,
            passThreshold: preset?.passThreshold ?? test.passThreshold,
            gradeId: test.gradeId,
            topicId: test.topicId,
            lessonId: test.lessonId,
            sectionId: test.sectionId,
            questionIds: testQuestions.map(tq => tq.questionId),
            lesson: lesson ? { id: lesson.id, name: lesson.name, position: lesson.position } : undefined,
        };
    }

    async updateTest(id: string, data: UpdateTestBody): Promise<AdminTestDto | null> {
        const existing = await prisma.test.findUnique({ where: { id } });
        if (!existing) return null;

        const updated = await prisma.$transaction(async (tx) => {
            const test = await tx.test.update({
                where: { id },
                data: {
                    ...(data.title !== undefined && { title: data.title }),
                    ...(data.summary !== undefined && { summary: data.summary }),
                    ...(data.presetId !== undefined && { presetId: data.presetId }),
                    ...(data.scopeId !== undefined && { scopeId: data.scopeId }),
                    ...(data.scopeType !== undefined && { scopeType: data.scopeType ? (data.scopeType as any) : null }),
                    ...(data.isNationalTest !== undefined && { isNationalTest: data.isNationalTest }),
                    ...(data.isPro !== undefined && { isPro: data.isPro }),
                    ...(data.imgUrl !== undefined && { imgUrl: data.imgUrl }),
                    ...(data.questionNumber !== undefined && { questionNumber: data.questionNumber }),
                    ...(data.timeLimit !== undefined && { timeLimit: data.timeLimit }),
                    ...(data.xpReward !== undefined && { xpReward: data.xpReward }),
                    ...(data.goldReward !== undefined && { goldReward: data.goldReward }),
                    ...(data.passThreshold !== undefined && { passThreshold: data.passThreshold }),
                },
            });

            if (data.questionIds !== undefined) {
                await tx.testQuestion.deleteMany({ where: { testId: id } });

                if (data.questionIds.length > 0) {
                    await tx.testQuestion.createMany({
                        data: data.questionIds.map((qid, idx) => ({
                            testId: id,
                            questionId: qid,
                            position: idx + 1,
                        })),
                    });
                }
            }

            return test;
        });

        const testQuestions = await prisma.testQuestion.findMany({
            where: { testId: id },
            select: { questionId: true },
        });
        const updatedPreset = updated.presetId ? await prisma.testPreset.findUnique({ where: { id: updated.presetId } }) : null;
        const targetLessonId = (updated.scopeType === 'LESSON' && updated.scopeId) ? updated.scopeId : updated.lessonId;
        const lesson = targetLessonId ? await prisma.lesson.findUnique({ where: { id: targetLessonId }, select: { id: true, name: true, position: true } }) : null;

        return {
            id: updated.id,
            title: updated.title,
            summary: updated.summary ?? null,
            presetId: updated.presetId,
            scopeId: updated.scopeId,
            scopeType: updated.scopeType,
            isManual: (updated as any).isManual ?? false,
            isNationalTest: updated.isNationalTest,
            isPro: updated.isPro,
            imgUrl: updated.imgUrl ?? null,
            questionNumber: updatedPreset?.questionCount ?? updated.questionNumber,
            timeLimit: updatedPreset?.timeLimit ?? updated.timeLimit,
            xpReward: updated.xpReward,
            goldReward: updated.goldReward,
            passThreshold: updatedPreset?.passThreshold ?? updated.passThreshold,
            gradeId: updated.gradeId,
            topicId: updated.topicId,
            lessonId: updated.lessonId,
            sectionId: updated.sectionId,
            questionIds: testQuestions.map(tq => tq.questionId),
            lesson: lesson ? { id: lesson.id, name: lesson.name, position: lesson.position } : undefined,
        };
    }

    async deleteTest(id: string): Promise<boolean> {
        const existing = await prisma.test.findUnique({ where: { id } });
        if (!existing) return false;
        await prisma.test.delete({ where: { id } });
        return true;
    }

    // ─────────────────────────────── FLASHCARD ────────────────────────────────────

    async listFlashcards(lessonId?: number): Promise<FlashcardDto[]> {
        let flashcards;
        if (lessonId) {
            flashcards = await prisma.flashcard.findMany({
                where: {
                    OR: [
                        { lessonId },
                        { section: { lessonId } },
                        { node: { section: { lessonId } } },
                    ],
                },
                orderBy: { id: "asc" },
            });
        } else {
            flashcards = await prisma.flashcard.findMany({
                orderBy: { id: "asc" },
            });
        }

        return flashcards.map((f) => ({
            id: f.id,
            frontText: f.frontText,
            backText: f.backText,
            lessonId: f.lessonId,
            sectionId: f.sectionId,
            nodeId: f.nodeId,
        }));
    }

    async createFlashcard(data: CreateFlashcardBody): Promise<FlashcardDto> {
        const count = [data.lessonId, data.sectionId, data.nodeId].filter(
            (id) => id !== undefined && id !== null
        ).length;
        if (count !== 1) {
            throw new Error("A flashcard must belong to exactly one of: lessonId, sectionId, or nodeId.");
        }

        // Verify entity exists
        if (data.lessonId) {
            const lesson = await prisma.lesson.findUnique({ where: { id: data.lessonId } });
            if (!lesson) throw new Error("Lesson not found.");
        } else if (data.sectionId) {
            const section = await prisma.section.findUnique({ where: { id: data.sectionId } });
            if (!section) throw new Error("Section not found.");
        } else if (data.nodeId) {
            const node = await prisma.node.findUnique({ where: { id: data.nodeId } });
            if (!node) throw new Error("Node not found.");
        }

        const flashcard = await prisma.flashcard.create({
            data: {
                frontText: data.frontText,
                backText: data.backText,
                lessonId: data.lessonId ?? null,
                sectionId: data.sectionId ?? null,
                nodeId: data.nodeId ?? null,
            },
        });

        return {
            id: flashcard.id,
            frontText: flashcard.frontText,
            backText: flashcard.backText,
            lessonId: flashcard.lessonId,
            sectionId: flashcard.sectionId,
            nodeId: flashcard.nodeId,
        };
    }

    async updateFlashcard(id: number, data: UpdateFlashcardBody): Promise<FlashcardDto | null> {
        const existing = await prisma.flashcard.findUnique({ where: { id } });
        if (!existing) return null;

        // Merge inputs
        const targetLessonId = data.lessonId !== undefined ? data.lessonId : existing.lessonId;
        const targetSectionId = data.sectionId !== undefined ? data.sectionId : existing.sectionId;
        const targetNodeId = data.nodeId !== undefined ? data.nodeId : existing.nodeId;

        const count = [targetLessonId, targetSectionId, targetNodeId].filter(
            (id) => id !== undefined && id !== null
        ).length;
        if (count !== 1) {
            throw new Error("A flashcard must belong to exactly one of: lessonId, sectionId, or nodeId.");
        }

        // Verify entity exists
        if (data.lessonId) {
            const lesson = await prisma.lesson.findUnique({ where: { id: data.lessonId } });
            if (!lesson) throw new Error("Lesson not found.");
        } else if (data.sectionId) {
            const section = await prisma.section.findUnique({ where: { id: data.sectionId } });
            if (!section) throw new Error("Section not found.");
        } else if (data.nodeId) {
            const node = await prisma.node.findUnique({ where: { id: data.nodeId } });
            if (!node) throw new Error("Node not found.");
        }

        const flashcard = await prisma.flashcard.update({
            where: { id },
            data: {
                ...(data.frontText !== undefined && { frontText: data.frontText }),
                ...(data.backText !== undefined && { backText: data.backText }),
                lessonId: targetLessonId,
                sectionId: targetSectionId,
                nodeId: targetNodeId,
            },
        });

        return {
            id: flashcard.id,
            frontText: flashcard.frontText,
            backText: flashcard.backText,
            lessonId: flashcard.lessonId,
            sectionId: flashcard.sectionId,
            nodeId: flashcard.nodeId,
        };
    }

    async deleteFlashcard(id: number): Promise<boolean> {
        const existing = await prisma.flashcard.findUnique({ where: { id } });
        if (!existing) return false;
        await prisma.flashcard.delete({ where: { id } });
        return true;
    }

    async bulkCreateFlashcards(lessonId: number, flashcards: { frontText: string; backText: string }[]): Promise<void> {
        const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
        if (!lesson) throw new Error("Lesson not found.");

        await prisma.$transaction(async (tx) => {
            // Delete all existing flashcards for lesson structure (direct lesson, or sections/nodes of this lesson)
            await tx.flashcard.deleteMany({
                where: {
                    OR: [
                        { lessonId },
                        { section: { lessonId } },
                        { node: { section: { lessonId } } },
                    ],
                },
            });

            // Create new ones directly under lesson
            if (flashcards.length > 0) {
                await tx.flashcard.createMany({
                    data: flashcards.map((f) => ({
                        frontText: f.frontText,
                        backText: f.backText,
                        lessonId,
                    })),
                });
            }
        });
    }

    // ─── TEST PRESET ─────────────────────────────────────────────────────────

    async listTestPresets(): Promise<any[]> {
        const presets = await prisma.testPreset.findMany({
            orderBy: { name: "asc" }
        });
        return presets.map(p => ({
            id: p.id,
            name: p.name,
            purposeType: p.purposeType,
            questionCount: p.questionCount,
            passThreshold: p.passThreshold,
            timeLimit: p.timeLimit,
            difficultyRatioJson: p.difficultyRatioJson ?? null,
        }));
    }

    async createTestPreset(data: any): Promise<any> {
        const preset = await prisma.testPreset.create({
            data: {
                name: data.name,
                purposeType: data.purposeType as any,
                questionCount: data.questionCount ?? null,
                passThreshold: data.passThreshold ?? 80,
                timeLimit: data.timeLimit ?? null,
                difficultyRatioJson: data.difficultyRatioJson ?? null,
            }
        });
        return preset;
    }

    async updateTestPreset(id: string, data: any): Promise<any | null> {
        const existing = await prisma.testPreset.findUnique({ where: { id } });
        if (!existing) return null;

        const updated = await prisma.testPreset.update({
            where: { id },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.purposeType !== undefined && { purposeType: data.purposeType as any }),
                ...(data.questionCount !== undefined && { questionCount: data.questionCount }),
                ...(data.passThreshold !== undefined && { passThreshold: data.passThreshold }),
                ...(data.timeLimit !== undefined && { timeLimit: data.timeLimit }),
                ...(data.difficultyRatioJson !== undefined && { difficultyRatioJson: data.difficultyRatioJson }),
            }
        });
        return updated;
    }

    async deleteTestPreset(id: string): Promise<boolean> {
        const existing = await prisma.testPreset.findUnique({ where: { id } });
        if (!existing) return false;
        await prisma.testPreset.delete({ where: { id } });
        return true;
    }

    // ─── SCOPE TEST PRESET DEFAULT ───────────────────────────────────────────

    async listScopeTestPresetDefaults(): Promise<any[]> {
        const defaults = await prisma.scopeTestPresetDefault.findMany({
            include: { defaultTestPreset: true }
        });
        return defaults.map(d => ({
            scopeType: d.scopeType,
            purposeType: d.purposeType,
            defaultTestPresetId: d.defaultTestPresetId,
            presetName: d.defaultTestPreset.name
        }));
    }

    async setScopeTestPresetDefault(data: any): Promise<any> {
        const upserted = await prisma.scopeTestPresetDefault.upsert({
            where: {
                scopeType_purposeType: {
                    scopeType: data.scopeType as any,
                    purposeType: data.purposeType as any
                }
            },
            update: {
                defaultTestPresetId: data.defaultTestPresetId
            },
            create: {
                scopeType: data.scopeType as any,
                purposeType: data.purposeType as any,
                defaultTestPresetId: data.defaultTestPresetId
            },
            include: { defaultTestPreset: true }
        });
        return {
            scopeType: upserted.scopeType,
            purposeType: upserted.purposeType,
            defaultTestPresetId: upserted.defaultTestPresetId,
            presetName: upserted.defaultTestPreset.name
        };
    }

    async deleteScopeTestPresetDefault(scopeType: string, purposeType: string): Promise<boolean> {
        const key = {
            scopeType: scopeType as any,
            purposeType: purposeType as any
        };
        const existing = await prisma.scopeTestPresetDefault.findUnique({
            where: { scopeType_purposeType: key }
        });
        if (!existing) return false;
        await prisma.scopeTestPresetDefault.delete({
            where: { scopeType_purposeType: key }
        });
        return true;
    }

    // ─── REWARD RULE ─────────────────────────────────────────────────────────

    async listRewardRules(): Promise<RewardRuleDto[]> {
        const rules = await prisma.rewardRule.findMany({
            include: {
                rewardRuleItems: {
                    include: {
                        itemDefinition: true
                    }
                }
            },
            orderBy: { id: "asc" }
        });
        return rules.map(r => ({
            id: r.id,
            triggerType: r.triggerType as any,
            triggerTargetId: r.triggerTargetId,
            triggerTimeMin: r.triggerTimeMin,
            triggerTimeMax: r.triggerTimeMax,
            xp: r.xp,
            gold: r.gold,
            rewardRuleItems: r.rewardRuleItems.map(ri => ({
                itemDefinitionId: ri.itemDefinitionId,
                quantity: ri.quantity,
                itemDefinition: ri.itemDefinition as ItemDefinitionDto
            }))
        }));
    }

    async createRewardRule(data: CreateRewardRuleBody): Promise<RewardRuleDto> {
        const rule = await prisma.$transaction(async (tx) => {
            const newRule = await tx.rewardRule.create({
                data: {
                    triggerType: data.triggerType as any,
                    triggerTargetId: data.triggerTargetId !== undefined ? data.triggerTargetId : null,
                    triggerTimeMin: Number(data.triggerTimeMin),
                    triggerTimeMax: data.triggerTimeMax !== null && data.triggerTimeMax !== undefined ? Number(data.triggerTimeMax) : null,
                    xp: data.xp !== undefined ? Number(data.xp) : 0,
                    gold: data.gold !== undefined ? Number(data.gold) : 0,
                }
            });

            if (data.rewardRuleItems && data.rewardRuleItems.length > 0) {
                await tx.rewardRuleItem.createMany({
                    data: data.rewardRuleItems.map(ri => ({
                        rewardRuleId: newRule.id,
                        itemDefinitionId: ri.itemDefinitionId,
                        quantity: ri.quantity
                    }))
                });
            }

            return newRule;
        });

        const createdRule = await prisma.rewardRule.findUnique({
            where: { id: rule.id },
            include: {
                rewardRuleItems: {
                    include: {
                        itemDefinition: true
                    }
                }
            }
        });

        if (!createdRule) throw new Error("Failed to retrieve created reward rule");

        return {
            id: createdRule.id,
            triggerType: createdRule.triggerType as any,
            triggerTargetId: createdRule.triggerTargetId,
            triggerTimeMin: createdRule.triggerTimeMin,
            triggerTimeMax: createdRule.triggerTimeMax,
            xp: createdRule.xp,
            gold: createdRule.gold,
            rewardRuleItems: createdRule.rewardRuleItems.map(ri => ({
                itemDefinitionId: ri.itemDefinitionId,
                quantity: ri.quantity,
                itemDefinition: ri.itemDefinition as ItemDefinitionDto
            }))
        };
    }

    async updateRewardRule(id: number, data: UpdateRewardRuleBody): Promise<RewardRuleDto | null> {
        const existing = await prisma.rewardRule.findUnique({ where: { id } });
        if (!existing) return null;

        await prisma.$transaction(async (tx) => {
            await tx.rewardRule.update({
                where: { id },
                data: {
                    ...(data.triggerType !== undefined && { triggerType: data.triggerType as any }),
                    triggerTargetId: data.triggerTargetId !== undefined ? data.triggerTargetId : existing.triggerTargetId,
                    ...(data.triggerTimeMin !== undefined && { triggerTimeMin: Number(data.triggerTimeMin) }),
                    triggerTimeMax: data.triggerTimeMax !== undefined ? (data.triggerTimeMax !== null ? Number(data.triggerTimeMax) : null) : existing.triggerTimeMax,
                    ...(data.xp !== undefined && { xp: Number(data.xp) }),
                    ...(data.gold !== undefined && { gold: Number(data.gold) }),
                }
            });

            if (data.rewardRuleItems !== undefined) {
                await tx.rewardRuleItem.deleteMany({ where: { rewardRuleId: id } });
                if (data.rewardRuleItems.length > 0) {
                    await tx.rewardRuleItem.createMany({
                        data: data.rewardRuleItems.map(ri => ({
                            rewardRuleId: id,
                            itemDefinitionId: ri.itemDefinitionId,
                            quantity: ri.quantity
                        }))
                    });
                }
            }
        });

        const updated = await prisma.rewardRule.findUnique({
            where: { id },
            include: {
                rewardRuleItems: {
                    include: {
                        itemDefinition: true
                    }
                }
            }
        });

        if (!updated) return null;

        return {
            id: updated.id,
            triggerType: updated.triggerType as any,
            triggerTargetId: updated.triggerTargetId,
            triggerTimeMin: updated.triggerTimeMin,
            triggerTimeMax: updated.triggerTimeMax,
            xp: updated.xp,
            gold: updated.gold,
            rewardRuleItems: updated.rewardRuleItems.map(ri => ({
                itemDefinitionId: ri.itemDefinitionId,
                quantity: ri.quantity,
                itemDefinition: ri.itemDefinition as ItemDefinitionDto
            }))
        };
    }

    async deleteRewardRule(id: number): Promise<boolean> {
        const existing = await prisma.rewardRule.findUnique({ where: { id } });
        if (!existing) return false;
        await prisma.rewardRule.delete({ where: { id } });
        return true;
    }

    // ─── ITEM DEFINITIONS ─────────────────────────────────────────────────────

    async listItemDefinitions(): Promise<ItemDefinitionDto[]> {
        const items = await prisma.itemDefinition.findMany({
            orderBy: { id: "asc" }
        });
        return items as ItemDefinitionDto[];
    }

    async createItemDefinition(data: CreateItemDefinitionBody): Promise<ItemDefinitionDto> {
        const itemType = data.itemType;
        const isMul = itemType === "XP_MUL" || itemType === "GOLD_MUL";
        const isSkin = itemType === "SKIN";

        const item = await prisma.itemDefinition.create({
            data: {
                name: data.name,
                description: data.description ?? null,
                shownInStore: data.shownInStore ?? true,
                price: data.price !== undefined ? Number(data.price) : 10,
                itemType: itemType as any,
                effectValue: isMul ? (data.effectValue !== undefined ? data.effectValue : null) : null,
                imgUrl: data.imgUrl ?? null,
                ...(data.shopImgUrl !== undefined && { shopImgUrl: data.shopImgUrl }),
                equipmentSlot: isSkin ? (data.equipmentSlot ? (data.equipmentSlot as any) : null) : null,
                durationMinutes: isMul ? (data.durationMinutes !== undefined ? data.durationMinutes : null) : null,
            } as any
        });
        return item as any as ItemDefinitionDto;
    }

    async updateItemDefinition(id: number, data: UpdateItemDefinitionBody): Promise<ItemDefinitionDto | null> {
        const existing = await prisma.itemDefinition.findUnique({ where: { id } });
        if (!existing) return null;

        const itemType = data.itemType !== undefined ? data.itemType : existing.itemType;
        const isMul = itemType === "XP_MUL" || itemType === "GOLD_MUL";
        const isSkin = itemType === "SKIN";

        const updated = await prisma.itemDefinition.update({
            where: { id },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                description: data.description !== undefined ? data.description : existing.description,
                ...(data.shownInStore !== undefined && { shownInStore: data.shownInStore }),
                ...(data.price !== undefined && { price: Number(data.price) }),
                itemType: itemType as any,
                effectValue: isMul ? (data.effectValue !== undefined ? data.effectValue : (existing as any).effectValue) : null,
                imgUrl: data.imgUrl !== undefined ? data.imgUrl : existing.imgUrl,
                ...(data.shopImgUrl !== undefined && { shopImgUrl: data.shopImgUrl }),
                equipmentSlot: isSkin ? (data.equipmentSlot !== undefined ? (data.equipmentSlot as any) : (existing as any).equipmentSlot) : null,
                durationMinutes: isMul ? (data.durationMinutes !== undefined ? data.durationMinutes : (existing as any).durationMinutes) : null,
            } as any
        });
        return updated as any as ItemDefinitionDto;
    }

    async deleteItemDefinition(id: number): Promise<boolean> {
        const existing = await prisma.itemDefinition.findUnique({ where: { id } });
        if (!existing) return false;
        await prisma.itemDefinition.delete({ where: { id } });
        return true;
    }

    // ─── TIER ─────────────────────────────────────────────────────────────────

    async listTiers(): Promise<AdminTierDto[]> {
        const tiers = await prisma.tier.findMany({
            orderBy: { index: "asc" }
        });

        const rewardRules = await prisma.rewardRule.findMany({
            where: {
                triggerType: "TIER_REACHED"
            },
            include: {
                rewardRuleItems: {
                    include: {
                        itemDefinition: true
                    }
                }
            }
        });

        const ruleMap = new Map<string, RewardRuleDto>();
        rewardRules.forEach(r => {
            if (r.triggerTargetId) {
                ruleMap.set(r.triggerTargetId, {
                    id: r.id,
                    triggerType: r.triggerType as any,
                    triggerTargetId: r.triggerTargetId,
                    triggerTimeMin: r.triggerTimeMin,
                    triggerTimeMax: r.triggerTimeMax,
                    xp: r.xp,
                    gold: r.gold,
                    rewardRuleItems: r.rewardRuleItems.map(ri => ({
                        itemDefinitionId: ri.itemDefinitionId,
                        quantity: ri.quantity,
                        itemDefinition: ri.itemDefinition as ItemDefinitionDto
                    }))
                });
            }
        });

        return tiers.map(t => ({
            index: t.index,
            name: t.name,
            badgeImgUrl: t.badgeImgUrl ?? null,
            description: t.description ?? null,
            xpThreshold: t.xpThreshold,
            rewardRule: ruleMap.get(String(t.index)) ?? null
        }));
    }

    async createTier(data: CreateTierBody): Promise<AdminTierDto> {
        const existing = await prisma.tier.findUnique({ where: { index: Number(data.index) } });
        if (existing) {
            throw new Error(`Tier index ${data.index} already exists`);
        }

        const tier = await prisma.$transaction(async (tx) => {
            const createdTier = await tx.tier.create({
                data: {
                    index: Number(data.index),
                    name: data.name,
                    badgeImgUrl: data.badgeImgUrl ?? null,
                    description: data.description ?? null,
                    xpThreshold: Number(data.xpThreshold)
                }
            });

            const targetIdStr = String(createdTier.index);
            const xpReward = data.xpReward !== undefined ? Number(data.xpReward) : 0;
            const goldReward = data.goldReward !== undefined ? Number(data.goldReward) : 0;
            const items = data.rewardRuleItems || [];

            if (xpReward > 0 || goldReward > 0 || items.length > 0) {
                const rule = await tx.rewardRule.create({
                    data: {
                        triggerType: "TIER_REACHED",
                        triggerTargetId: targetIdStr,
                        triggerTimeMin: 1,
                        triggerTimeMax: null,
                        xp: xpReward,
                        gold: goldReward,
                    }
                });

                if (items.length > 0) {
                    await tx.rewardRuleItem.createMany({
                        data: items.map(i => ({
                            rewardRuleId: rule.id,
                            itemDefinitionId: i.itemDefinitionId,
                            quantity: i.quantity
                        }))
                    });
                }
            }

            return createdTier;
        });

        const updatedList = await this.listTiers();
        const createdDto = updatedList.find(t => t.index === tier.index);
        if (!createdDto) {
            throw new Error("Failed to retrieve created Tier");
        }
        return createdDto;
    }

    async updateTier(index: number, data: UpdateTierBody): Promise<AdminTierDto | null> {
        const existing = await prisma.tier.findUnique({ where: { index } });
        if (!existing) return null;

        await prisma.$transaction(async (tx) => {
            await tx.tier.update({
                where: { index },
                data: {
                    ...(data.name !== undefined && { name: data.name }),
                    badgeImgUrl: data.badgeImgUrl !== undefined ? data.badgeImgUrl : existing.badgeImgUrl,
                    description: data.description !== undefined ? data.description : existing.description,
                    ...(data.xpThreshold !== undefined && { xpThreshold: Number(data.xpThreshold) }),
                }
            });

            const targetIdStr = String(index);
            const hasRewardEdit = data.xpReward !== undefined || data.goldReward !== undefined || data.rewardRuleItems !== undefined;

            if (hasRewardEdit) {
                const existingRule = await tx.rewardRule.findFirst({
                    where: {
                        triggerType: "TIER_REACHED",
                        triggerTargetId: targetIdStr
                    }
                });

                const newXp = data.xpReward !== undefined ? Number(data.xpReward) : (existingRule?.xp ?? 0);
                const newGold = data.goldReward !== undefined ? Number(data.goldReward) : (existingRule?.gold ?? 0);
                const newItems = data.rewardRuleItems;

                if (existingRule) {
                    await tx.rewardRule.update({
                        where: { id: existingRule.id },
                        data: {
                            xp: newXp,
                            gold: newGold
                        }
                    });

                    if (newItems !== undefined) {
                        await tx.rewardRuleItem.deleteMany({ where: { rewardRuleId: existingRule.id } });
                        if (newItems.length > 0) {
                            await tx.rewardRuleItem.createMany({
                                data: newItems.map(i => ({
                                    rewardRuleId: existingRule.id,
                                    itemDefinitionId: i.itemDefinitionId,
                                    quantity: i.quantity
                                }))
                            });
                        }
                    }
                } else if (newXp > 0 || newGold > 0 || (newItems && newItems.length > 0)) {
                    const rule = await tx.rewardRule.create({
                        data: {
                            triggerType: "TIER_REACHED",
                            triggerTargetId: targetIdStr,
                            triggerTimeMin: 1,
                            triggerTimeMax: null,
                            xp: newXp,
                            gold: newGold
                        }
                    });

                    if (newItems && newItems.length > 0) {
                        await tx.rewardRuleItem.createMany({
                            data: newItems.map(i => ({
                                rewardRuleId: rule.id,
                                itemDefinitionId: i.itemDefinitionId,
                                quantity: i.quantity
                            }))
                        });
                    }
                }
            }
        });

        const updatedList = await this.listTiers();
        return updatedList.find(t => t.index === index) ?? null;
    }

    async deleteTier(index: number): Promise<boolean> {
        const existing = await prisma.tier.findUnique({ where: { index } });
        if (!existing) return false;

        const usersCount = await prisma.user.count({ where: { currentTierIndex: index } });
        if (usersCount > 0) {
            throw new Error(`Không thể xóa danh hiệu này vì đang có ${usersCount} người dùng đang ở danh hiệu này.`);
        }

        await prisma.$transaction(async (tx) => {
            const targetIdStr = String(index);
            await tx.rewardRule.deleteMany({
                where: {
                    triggerType: "TIER_REACHED",
                    triggerTargetId: targetIdStr
                }
            });
            await tx.tier.delete({ where: { index } });
        });

        return true;
    }

    /**
     * AI Token Usage Statistics & User Rankings
     */
    async getAiUsageStats(options: {
        days?: number | 'all';
        startDate?: string;
        endDate?: string;
        userId?: string;
    }) {
        const { days = 30, startDate, endDate, userId } = options;

        const now = new Date();
        const ictToday = new Date(now.getTime() + 7 * 60 * 60 * 1000);
        const todayStr = ictToday.toISOString().slice(0, 10);

        let startStr: string | undefined;
        let endStr: string | undefined = todayStr;

        if (startDate && endDate) {
            startStr = startDate;
            endStr = endDate;
        } else if (days !== 'all' && typeof days === 'number' && days > 0) {
            const startDateObj = new Date(ictToday);
            startDateObj.setDate(startDateObj.getDate() - (days - 1));
            startStr = startDateObj.toISOString().slice(0, 10);
        }

        // Build date filter for UserAiQuota query
        const quotaWhere: any = {};
        if (startStr && endStr) {
            quotaWhere.date = { gte: startStr, lte: endStr };
        } else if (startStr) {
            quotaWhere.date = { gte: startStr };
        } else if (endStr) {
            quotaWhere.date = { lte: endStr };
        }

        if (userId) {
            quotaWhere.userId = userId;
        }

        // Fetch quotas for the specified period
        const periodQuotas = await prisma.userAiQuota.findMany({
            where: quotaWhere,
            select: {
                userId: true,
                date: true,
                tokensUsed: true,
            },
        });

        // 1. Time Series Chart Data
        const dailyMap = new Map<string, { totalTokens: number; userSet: Set<string> }>();

        periodQuotas.forEach(q => {
            if (!dailyMap.has(q.date)) {
                dailyMap.set(q.date, { totalTokens: 0, userSet: new Set() });
            }
            const entry = dailyMap.get(q.date)!;
            entry.totalTokens += q.tokensUsed;
            entry.userSet.add(q.userId);
        });

        // Fill missing dates if range specified
        const timeSeries: Array<{ date: string; totalTokens: number; activeUsersCount: number }> = [];

        if (startStr && endStr) {
            const curr = new Date(startStr);
            const endObj = new Date(endStr);
            while (curr <= endObj) {
                const dStr = curr.toISOString().slice(0, 10);
                const data = dailyMap.get(dStr);
                timeSeries.push({
                    date: dStr,
                    totalTokens: data ? data.totalTokens : 0,
                    activeUsersCount: data ? data.userSet.size : 0,
                });
                curr.setDate(curr.getDate() + 1);
            }
        } else {
            const sortedDates = Array.from(dailyMap.keys()).sort();
            sortedDates.forEach(dStr => {
                const data = dailyMap.get(dStr)!;
                timeSeries.push({
                    date: dStr,
                    totalTokens: data.totalTokens,
                    activeUsersCount: data.userSet.size,
                });
            });
        }

        // 2. User Ranking Data (Period & All-Time)
        // Aggregate tokens per user in period
        const userPeriodMap = new Map<string, number>();
        periodQuotas.forEach(q => {
            userPeriodMap.set(q.userId, (userPeriodMap.get(q.userId) || 0) + q.tokensUsed);
        });

        // Fetch all-time token totals grouped by user
        const allTimeQuotas = await prisma.userAiQuota.groupBy({
            by: ['userId'],
            _sum: {
                tokensUsed: true,
            },
        });

        const allTimeMap = new Map<string, number>();
        allTimeQuotas.forEach(g => {
            allTimeMap.set(g.userId, g._sum.tokensUsed || 0);
        });

        // Get all unique user IDs involved
        const periodUserIds = Array.from(userPeriodMap.keys());
        const targetUserIds = periodUserIds.length > 0 ? periodUserIds : Array.from(allTimeMap.keys());

        // Fetch user profiles & session counts
        const users = await prisma.user.findMany({
            where: { id: { in: targetUserIds } },
            select: {
                id: true,
                name: true,
                email: true,
                profileImgUrl: true,
                role: true,
                isPro: true,
                proExpiresAt: true,
                _count: {
                    select: {
                        aiChatSessions: true,
                    },
                },
            },
        });

        const totalTokensInPeriod = periodQuotas.reduce((acc, q) => acc + q.tokensUsed, 0);

        const rankings = users
            .map(u => {
                const tokensInPeriod = userPeriodMap.get(u.id) || 0;
                const tokensAllTime = allTimeMap.get(u.id) || 0;
                const isUserPro = Boolean(u.isPro && u.proExpiresAt && u.proExpiresAt > now);
                const sharePercent = totalTokensInPeriod > 0 ? (tokensInPeriod / totalTokensInPeriod) * 100 : 0;

                return {
                    userId: u.id,
                    name: u.name,
                    email: u.email,
                    profileImgUrl: u.profileImgUrl,
                    role: u.role,
                    isPro: isUserPro,
                    tokensInPeriod,
                    tokensAllTime,
                    sessionCount: u._count.aiChatSessions,
                    sharePercent: Math.round(sharePercent * 10) / 10,
                };
            })
            .sort((a, b) => b.tokensInPeriod - a.tokensInPeriod || b.tokensAllTime - a.tokensAllTime)
            .map((item, index) => ({
                rank: index + 1,
                ...item,
            }));

        // 3. Summary metrics
        const activeUsersCount = rankings.filter(r => r.tokensInPeriod > 0).length;
        const avgTokensPerUser = activeUsersCount > 0 ? Math.round(totalTokensInPeriod / activeUsersCount) : 0;
        const topUserTokens = rankings.length > 0 ? rankings[0].tokensInPeriod : 0;

        return {
            summary: {
                totalTokensInPeriod,
                activeUsersCount,
                avgTokensPerUser,
                topUserTokens,
                periodDays: startStr && endStr ? Math.ceil((new Date(endStr).getTime() - new Date(startStr).getTime()) / (1000 * 3600 * 24)) + 1 : 'all',
                startStr,
                endStr,
            },
            timeSeries,
            rankings,
        };
    }
}

export const adminService = new AdminService();




