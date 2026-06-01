import { prisma } from "@history-app/shared";

async function main() {
    console.log("🌱 Starting seed database script...");

    // 1. Ensure minimal prerequisite structures exist (Grade, Topic, Lesson)
    // This satisfies relational constraints up to lessonId 1, 2, and 3
    console.log("Checking structural hierarchy prerequisites (Lessons 1, 2, 3)...");
    
    

    await prisma.topic.upsert({
        where: { id: 11 },
        update: {},
        create: { id: 11, name: "World History Foundation", position: 4, gradeId: 10 }
    });

    for (const lessonId of [1, 2, 3]) {
        await prisma.lesson.upsert({
            where: { id: lessonId },
            update: {},
            create: {
                id: lessonId,
                name: `Lesson Blueprint Volume ${lessonId}`,
                position: lessonId,
                topicId: 11
            }
        });
    }

    // 2. Create 2 Non-Manual Tests linked to Lesson 1 and Lesson 2
    console.log("Generating non-manual Test structures...");
    
    const test1 = await prisma.test.upsert({
        where: { id: "101" },
        update: {},
        create: {
            id: "101",
            questionNumber: 10,
            title: "Ancient Civilizations Assessment",
            timeLimit: 100, 
            isManual: false,
            passThreshold: 70,
            xpReward: 120,
            goldReward: 50,
            lessonId: 1 // Scope bound
        }
    });

    const test2 = await prisma.test.upsert({
        where: { id: "102" },
        update: {},
        create: {
            id: "102",
            questionNumber: 10,
            title: "Medieval Europe Breakthrough",
            timeLimit: 30, 
            isManual: false,
            passThreshold: 75,
            xpReward: 150,
            goldReward: 75,
            lessonId: 2 // Scope bound
        }
    });

    console.log(`Created Tests: ID ${test1.id} (Lesson 1) & ID ${test2.id} (Lesson 2)`);

    // 3. Dynamic Question Pool Matrix (3 Types x 4 Difficulties x 4 variants = 48 Questions)
    console.log("Generating comprehensive question pool variants...");
    
    const types: ("CHOOSE" | "FILL" | "MATCH")[] = ["CHOOSE", "FILL", "MATCH"];
    const difficulties = [1, 2, 3, 4];
    const lessonsPool = [1, 2, 3];
    
    let counter = 0;

    for (const type of types) {
        for (const difficulty of difficulties) {
            // Generate 4 distinct question variations per type/difficulty combo to offer a rich pool
            for (let variant = 1; variant <= 4; variant++) {
                counter++;
                
                // Assign to random Lesson ID (1, 2, or 3)
                const assignedLessonId = lessonsPool[Math.floor(Math.random() * lessonsPool.length)];

                // Setup blueprint answers array dependent on core schema types
                const answersData = [];
                
                if (type === "CHOOSE") {
                    answersData.push(
                        { content: "Correct historical response choice", isCorrect: true },
                        { content: "Plausible distractor element A", isCorrect: false },
                        { content: "Plausible distractor element B", isCorrect: false }
                    );
                } else if (type === "FILL") {
                    answersData.push(
                        { content: "exact_match_keyphrase", isCorrect: true }
                    );
                } else if (type === "MATCH") {
                    answersData.push(
                        { content: "Pairing set", leftText: "Concept Alpha", rightText: "Definition Alpha", isCorrect: true },
                        { content: "Pairing set", leftText: "Concept Beta", rightText: "Definition Beta", isCorrect: true }
                    );
                }

                await prisma.question.create({
                    data: {
                        type,
                        difficulty,
                        promptText: `Verify knowledge query regarding metadata profile [Type: ${type} | Difficulty: ${difficulty} | Run: #${variant}]`,
                        
                        lessonId: assignedLessonId, // Exactly 1 scope item satisfies database check constraints
                        answers: {
                            create: answersData
                        }
                    }
                });
            }
        }
    }

    console.log(`🎉 Successfully seeded ${counter} multi-tier questions across lessons 1, 2, and 3!`);
}

main()
    .catch((e) => {
        console.error("❌ Error seeding data:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });