import { apiSlice } from "../../services/apiSlice";
import type {
    GetMindMapResponse,
    MindMapNode as ApiMindMapNode,
} from "@history-app/shared";
import { BRANCH_COLORS } from "./constants";
import type { MindMapNode } from "./types";
import { colors } from "../../theme/colors";

export type MindMapQuery = { lessonId: number };

function getQueryPath(query: MindMapQuery): string {
    return `/api/content/mindmap?lessonId=${encodeURIComponent(query.lessonId)}`;
}

function stripHtml(html: string | undefined | null): string {
    if (!html) return "";
    const clean = html.replace(/<[^>]*>/g, " ");
    return clean.replace(/\s+/g, " ").trim();
}

function shortLabel(value: string | undefined | null, isHtml = false): string {
    const cleanValue = isHtml ? stripHtml(value) : value;
    const text = (cleanValue ?? "").replace(/\s+/g, " ").trim();
    if (text.length <= 120) return text;
    return `${text.slice(0, 117).trim()}...`;
}

function getNodeLabel(node: ApiMindMapNode): string {
    if (node.type === "grade") return node.name || `Lop ${node.id}`;
    if (node.type === "node")
        return shortLabel(
            node.header || node.body || `Noi dung ${node.id}`,
            !node.header,
        );
    return shortLabel(
        node.name || node.header || node.body || `${node.type} ${node.id}`,
        !node.name && !node.header,
    );
}

function toVisualNode(
    node: ApiMindMapNode,
    depth = 0,
    branchIndex = 0,
): MindMapNode {
    const nodeColors =
        depth === 0
            ? {
                  color: colors.primary,
                  borderColor: colors.primary,
                  accentColor: colors.primaryHover,
              }
            : BRANCH_COLORS[branchIndex % BRANCH_COLORS.length];

    return {
        id: `${node.type}-${node.id}`,
        label: getNodeLabel(node),
        color: nodeColors.color,
        borderColor: nodeColors.borderColor,
        accentColor: nodeColors.accentColor,
        children: (node.children ?? []).map((child, index) =>
            toVisualNode(child, depth + 1, depth === 0 ? index : branchIndex),
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
