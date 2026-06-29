import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

import { prisma } from "@history-app/shared";

async function main() {
  const lessons = [5, 7];
  for (const id of lessons) {
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        sections: {
          orderBy: { position: "asc" },
          include: {
            nodes: {
              orderBy: { position: "asc" }
            }
          }
        }
      }
    });
    if (!lesson) continue;

    console.log(`\n========================================`);
    console.log(`LESSON ID ${id}: "${lesson.name}"`);
    for (const section of lesson.sections) {
      console.log(`Section: "${section.name}"`);
      for (const node of section.nodes) {
        console.log(`  - Node ID: ${node.id}, Header: "${node.header}"`);
        console.log(`    Body: ${node.body.substring(0, 300)}...`);
      }
    }
  }
}

main()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
