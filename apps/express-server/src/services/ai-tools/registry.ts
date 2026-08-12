import { AITool, GeminiFunctionDeclaration } from "./types";
import { searchCourseTool } from "./tools/searchCourseTool";
import { getLessonDetailTool } from "./tools/getLessonDetailTool";
import { getNodeDetailTool } from "./tools/getNodeDetailTool";
import { getGradeOverviewTool } from "./tools/getGradeOverviewTool";

const ALL_TOOLS: AITool[] = [
    searchCourseTool,
    getLessonDetailTool,
    getNodeDetailTool,
    getGradeOverviewTool
];

export class AIToolRegistry {
    private toolsMap: Map<string, AITool> = new Map();

    constructor() {
        for (const tool of ALL_TOOLS) {
            this.toolsMap.set(tool.declaration.name, tool);
        }
    }

    getFunctionDeclarations(): GeminiFunctionDeclaration[] {
        return ALL_TOOLS.map((tool) => tool.declaration);
    }

    async executeToolCall(toolName: string, args: any): Promise<any> {
        const tool = this.toolsMap.get(toolName);
        if (!tool) {
            return {
                status: "error",
                message: `Tool '${toolName}' is not registered in the system.`
            };
        }
        return await tool.execute(args || {});
    }
}

export const aiToolRegistry = new AIToolRegistry();
