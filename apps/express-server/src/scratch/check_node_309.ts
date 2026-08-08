import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

import { prisma } from "@history-app/shared";

async function main() {
  console.log("=== Node 309 ===");
  const node309 = await prisma.node.findUnique({
    where: { id: 309 },
    include: { section: { include: { lesson: true } } }
  });
  console.log("Node 309:", JSON.stringify(node309, null, 2));

  console.log("\n=== Search Nodes for 'Điện Biên Phủ' ===");
  const nodes = await prisma.node.findMany({
    where: {
      OR: [
        { header: { contains: "Điện Biên Phủ", mode: "insensitive" } },
        { body: { contains: "Điện Biên Phủ", mode: "insensitive" } }
      ]
    },
    take: 10,
    include: { section: { include: { lesson: true } } }
  });
  console.log(`Found ${nodes.length} nodes:`);
  for (const n of nodes) {
    console.log(`- Node ID: ${n.id}`);
    console.log(`  Header: ${n.header}`);
    console.log(`  Lesson: ${n.section?.lesson?.name} (Lesson ID: ${n.section?.lessonId})`);
    console.log(`  Section: ${n.section?.name}`);
    console.log(`  Body: ${n.body?.slice(0, 150)}...\n`);
  }

  console.log("\n=== Search Lessons for 'Điện Biên Phủ' ===");
  const lessons = await prisma.lesson.findMany({
    where: {
      name: { contains: "Điện Biên Phủ", mode: "insensitive" }
    }
  });
  console.log(JSON.stringify(lessons, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
