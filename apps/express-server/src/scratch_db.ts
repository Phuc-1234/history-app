import { prisma } from "@history-app/shared";

async function main() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                isVerified: true,
                totalXp: true,
                currentStreak: true,
            }
        });
        console.log("USERS:", JSON.stringify(users, null, 2));
    } catch (e) {
        console.error("Error inspecting DB:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
