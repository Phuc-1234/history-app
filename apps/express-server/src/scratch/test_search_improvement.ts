import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

import { prisma } from "@history-app/shared";

const STOP_WORDS = new Set([
    "nội", "dung", "có", "gì", "là", "như", "thế", "nào", "bài", "học",
    "các", "những", "cho", "của", "và", "trong", "với", "được", "ra", "đã",
    "thì", "đó", "này", "ở", "trên", "màn", "hình", "đang", "xem", "hỏi", "biết", "mình", "nghe", "về", "kể"
]);

function getNodeTitle(node: { header: string | null; body: string }) {
    if (node.header && node.header.trim()) {
        return node.header.trim();
    }
    if (node.body && node.body.trim()) {
        const clean = node.body.trim().replace(/[\n\r]+/g, " ");
        return clean.length > 35 ? clean.slice(0, 35).trim() + "..." : clean;
    }
    return "Chi tiết kiến thức";
}

async function testSearch(query: string) {
    console.log(`\n=================== SEARCH: "${query}" ===================`);
    const cleanQuery = query.trim();
    const keywords = cleanQuery
        .toLowerCase()
        .split(/\s+/)
        .filter((k) => k.length > 1 && !STOP_WORDS.has(k))
        .slice(0, 5);

    console.log("Extracted keywords:", keywords);

    // 1. Primary search: Full phrase match
    let matchingNodes = await prisma.node.findMany({
        where: {
            OR: [
                { header: { contains: cleanQuery, mode: "insensitive" } },
                { body: { contains: cleanQuery, mode: "insensitive" } }
            ]
        },
        take: 5,
        include: { section: { include: { lesson: true } } }
    });

    console.log(`Primary (full phrase) found ${matchingNodes.length} nodes.`);

    // 2. Secondary search: All keywords match (AND condition)
    if (matchingNodes.length < 5 && keywords.length > 0) {
        const andConditions = keywords.map((k) => ({
            OR: [
                { header: { contains: k, mode: "insensitive" as const } },
                { body: { contains: k, mode: "insensitive" as const } }
            ]
        }));

        const existingIds = new Set(matchingNodes.map((n) => n.id));
        const secondaryNodes = await prisma.node.findMany({
            where: {
                AND: andConditions
            },
            take: 5 - matchingNodes.length,
            include: { section: { include: { lesson: true } } }
        });

        for (const n of secondaryNodes) {
            if (!existingIds.has(n.id)) {
                matchingNodes.push(n);
            }
        }
        console.log(`Secondary (AND keywords) total nodes: ${matchingNodes.length}`);
    }

    // Output formatted node titles
    for (const n of matchingNodes) {
        const title = getNodeTitle(n);
        console.log(`- Node ${n.id}: title="${title}" (header="${n.header}")`);
        console.log(`  Snippet: ${n.body.slice(0, 80)}...`);
    }
}

async function main() {
    await testSearch("Kể cho mình nghe về Trận Điện Biên Phủ đi!");
    await testSearch("Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập");
    await testSearch("Đổi mới 1986");
}

main().catch(console.error).finally(() => prisma.$disconnect());
