import { Request, Response } from "express";
import { prisma } from "@history-app/shared";

export const getFlashcardsByLesson = async (req: Request, res: Response) => {
    try {
        const lessonId = Number(req.params.lessonId);
        if (Number.isNaN(lessonId)) {
            return res.status(400).json({ error: "Invalid lessonId" });
        }

        const flashcards = await prisma.flashcard.findMany({
            where: {
                OR: [
                    { lessonId },
                    {
                        section: {
                            lessonId
                        }
                    },
                    {
                        node: {
                            section: {
                                lessonId
                            }
                        }
                    }
                ]
            }
        });

        return res.status(200).json(flashcards);
    } catch (err) {
        console.error("Fetch flashcards by lesson error:", err);
        return res.status(500).json({ error: "Failed to fetch flashcards by lesson." });
    }
};

export const getFlashcardsBySection = async (req: Request, res: Response) => {
    try {
        const sectionId = Number(req.params.sectionId);
        if (Number.isNaN(sectionId)) {
            return res.status(400).json({ error: "Invalid sectionId" });
        }

        const targetSection = await prisma.section.findUnique({
            where: { id: sectionId },
            select: { id: true, lessonId: true }
        });

        if (!targetSection) {
            return res.status(404).json({ error: "Section not found." });
        }

        const allSections = await prisma.section.findMany({
            where: { lessonId: targetSection.lessonId },
            select: { id: true, parentSectionId: true }
        });

        const descendantIds = new Set<number>([sectionId]);
        let sizeBefore: number;
        do {
            sizeBefore = descendantIds.size;
            for (const sec of allSections) {
                if (sec.parentSectionId && descendantIds.has(sec.parentSectionId)) {
                    descendantIds.add(sec.id);
                }
            }
        } while (descendantIds.size > sizeBefore);

        const descendantList = Array.from(descendantIds);

        const flashcards = await prisma.flashcard.findMany({
            where: {
                OR: [
                    { sectionId: { in: descendantList } },
                    {
                        node: {
                            sectionId: { in: descendantList }
                        }
                    }
                ]
            }
        });

        return res.status(200).json(flashcards);
    } catch (err) {
        console.error("Fetch flashcards by section error:", err);
        return res.status(500).json({ error: "Failed to fetch flashcards by section." });
    }
};

export const getFlashcardsByNode = async (req: Request, res: Response) => {
    try {
        const nodeId = Number(req.params.nodeId);
        if (Number.isNaN(nodeId)) {
            return res.status(400).json({ error: "Invalid nodeId" });
        }

        const flashcards = await prisma.flashcard.findMany({
            where: { nodeId }
        });

        return res.status(200).json(flashcards);
    } catch (err) {
        console.error("Fetch flashcards by node error:", err);
        return res.status(500).json({ error: "Failed to fetch flashcards by node." });
    }
};
