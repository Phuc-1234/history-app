import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

import { prisma } from "@history-app/shared";

async function main() {
  const totalNodes = await prisma.node.count();
  const totalLessons = await prisma.lesson.count();
  console.log(`Total nodes: ${totalNodes}, Total lessons: ${totalLessons}`);

  // Search for any node with 'Biên' or 'Đại' or 'Phủ' or 'Chiến' or 'Chiến dịch'
  const nodes = await prisma.node.findMany({
    where: {
      OR: [
        { header: { contains: "Biên", mode: "insensitive" } },
        { body: { contains: "Biên", mode: "insensitive" } },
        { header: { contains: "Phủ", mode: "insensitive" } },
        { body: { contains: "Phủ", mode: "insensitive" } }
      ]
    },
    take: 10
  });

  console.log(`Found ${nodes.length} nodes for 'Biên'/'Phủ':`);
  for (const n of nodes) {
    console.log(`Node ${n.id}: header="${n.header}", body="${n.body.slice(0, 80)}..."`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
