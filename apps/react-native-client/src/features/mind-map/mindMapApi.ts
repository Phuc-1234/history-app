import { apiSlice } from "../../services/apiSlice";
import type {
    GetMindMapResponse,
    MindMapNode as ApiMindMapNode,
} from "@history-app/shared";
import { BRANCH_COLORS } from "./constants";
import type { MindMapNode } from "./types";

export type MindMapQuery = { lessonId: number };

function getQueryPath(query: MindMapQuery): string {
    
    return `/api/content/mindmap?lessonId=${encodeURIComponent(query.lessonId)}`;
}

function shortLabel(value: string | undefined | null): string {
    const text = (value ?? "").replace(/\s+/g, " ").trim();
    if (text.length <= 120) return text;
    return `${text.slice(0, 117).trim()}...`;
}

function getNodeLabel(node: ApiMindMapNode): string {
    if (node.type === "grade") return node.name || `Lop ${node.id}`;
    if (node.type === "node") return shortLabel(node.header || node.body || `Noi dung ${node.id}`);
    return shortLabel(node.name || node.header || node.body || `${node.type} ${node.id}`);
}

function toVisualNode(
    node: ApiMindMapNode,
    depth = 0,
    branchIndex = 0,
): MindMapNode {
    const colors =
        depth === 0
            ? {
                  color: "#7C3AED",
                  borderColor: "#7C3AED",
                  accentColor: "#5B21B6",
              }
            : BRANCH_COLORS[branchIndex % BRANCH_COLORS.length];

    return {
        id: `${node.type}-${node.id}`,
        label: getNodeLabel(node),
        color: colors.color,
        borderColor: colors.borderColor,
        accentColor: colors.accentColor,
        children: (node.children ?? []).map((child, index) =>
            toVisualNode(
                child,
                depth + 1,
                depth === 0 ? index : branchIndex,
            ),
        ),
    };
}

export const mindMapApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getMindMap: builder.query<MindMapNode, MindMapQuery>({
            query: getQueryPath,
            transformResponse: (response: GetMindMapResponse) => {
                if ("error" in response) {
                    throw new Error(response.error);
                }

                return toVisualNode(response.tree);
            },
            providesTags: (_result, _error, query) => [
                {
                    type: "History",
                    id: `mindmap-lesson-${query.lessonId}`,
                },
            ],
        }),
    }),
    overrideExisting: true,
});

export const { useGetMindMapQuery } = mindMapApi;
