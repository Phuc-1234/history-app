import dotenv from "dotenv";
import path from "path";

// Load environment variables before importing prisma
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

import { prisma } from "@history-app/shared";
import { contentService } from "../services/contentService";

async function run() {
  console.log("Starting MindMap Sync check...");
  
  const lessons = await prisma.lesson.findMany({
    include: {
      sections: true,
      mindMap: true,
    },
  });

  console.log(`Found total ${lessons.length} lessons in database.`);

  const targets = lessons.filter(l => l.sections.length > 0 && !l.mindMap);
  console.log(`Identified ${targets.length} lessons having sections but missing MindMap record.`);

  for (const l of targets) {
    console.log(`Processing Lesson ID ${l.id} ("${l.name}")...`);
    try {
      const generatedTree = await contentService.generateMindMapForLesson(l.id);
      await prisma.mindMap.create({
        data: {
          lessonId: l.id,
          data: generatedTree as any,
        },
      });
      console.log(`Successfully created MindMap for Lesson ID ${l.id}`);
    } catch (err: any) {
      console.error(`Failed to create MindMap for Lesson ID ${l.id}:`, err.message || err);
    }
  }

  console.log("Sync check finished successfully.");
}

run()
  .then(() => {
    prisma.$disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error("Critical error in sync script:", err);
    prisma.$disconnect();
    process.exit(1);
  });
