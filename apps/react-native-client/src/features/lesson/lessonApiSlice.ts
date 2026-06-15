// features/lesson/lessonApiSlice.ts
import { apiSlice } from "../../services/apiSlice";
import { LessonWithContentDto } from "@history-app/shared";

// Local types — mirrors BE progressTypes & NodeDetailResponse
export interface ProgressConsequence {
    eventType: string;
    message: string;
    xpGained?: number;
    goldGained?: number;
}

export interface NodeDetail {
    id: number;
    position: number;
    header: string | null;
    body: string;
    imgUrl: string | null;
    sectionId: number;
    videoId: string | null;
    video: { id: string; hlsUrl: string; duration: number | null } | null;
    hasRelevantQuestions: boolean;
    isStudied: boolean | null;
    isCompleted: boolean | null;
}

export const contentApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getLessonTree: builder.query<LessonWithContentDto, number>({
            query: (lessonId) => `/api/content/lessons/${lessonId}/tree`,
            providesTags: (result, error, lessonId) => [{ type: "History", id: lessonId }],
        }),
        getNodeDetail: builder.query<NodeDetail, number>({
            query: (nodeId) => `/api/content/nodes/${nodeId}`,
        }),
        finishStudyNode: builder.mutation<
            { consequences: ProgressConsequence[] },
            number
        >({
            query: (nodeId) => ({
                url: `/api/content/nodes/${nodeId}/finish-study`,
                method: "POST",
            }),
            async onQueryStarted(nodeId, { dispatch, queryFulfilled, getState }) {
                try {
                    const { data } = await queryFulfilled;
                    
                    const isNodeCompleted = data.consequences.some(
                        (c) => c.eventType === "NODE_COMPLETED"
                    );

                    if (isNodeCompleted) {
                        // 1. Update getNodeDetail cache
                        dispatch(
                            (apiSlice.util.updateQueryData as any)("getNodeDetail", nodeId, (draft: any) => {
                                if (draft) {
                                    draft.isCompleted = true;
                                }
                            })
                        );

                        // 2. Locate which lesson contains this node in the cached state
                        const state = getState() as any;
                        const queries = state.api?.queries || {};
                        let foundLessonId: number | null = null;

                        for (const queryKey of Object.keys(queries)) {
                            if (queryKey.startsWith("getLessonTree(")) {
                                const qData = queries[queryKey]?.data;
                                if (qData && qData.sections) {
                                    const checkSection = (sec: any): boolean => {
                                        if (sec.nodes && sec.nodes.some((n: any) => n.id === nodeId)) {
                                            return true;
                                        }
                                        if (sec.children) {
                                            for (const child of sec.children) {
                                                if (checkSection(child)) return true;
                                            }
                                        }
                                        return false;
                                    };
                                    for (const sec of qData.sections) {
                                        if (checkSection(sec)) {
                                            foundLessonId = queries[queryKey].originalArgs;
                                            break;
                                        }
                                    }
                                }
                                if (foundLessonId !== null) break;
                            }
                        }

                        // 3. Update the getLessonTree cache and recalculate section/lesson progress counts
                        if (foundLessonId !== null) {
                            dispatch(
                                (apiSlice.util.updateQueryData as any)("getLessonTree", foundLessonId, (draft: any) => {
                                    if (!draft) return;
                                    let nodeFound = false;

                                    const updateSection = (sec: any) => {
                                        if (sec.nodes) {
                                            const node = sec.nodes.find((n: any) => n.id === nodeId);
                                            if (node) {
                                                if (!node.isComplete) {
                                                    node.isComplete = true;
                                                    nodeFound = true;
                                                }
                                            }
                                        }
                                        if (sec.children) {
                                            for (const child of sec.children) {
                                                updateSection(child);
                                            }
                                        }
                                    };

                                    for (const sec of draft.sections || []) {
                                        updateSection(sec);
                                    }

                                    if (nodeFound) {
                                        if (draft.progress) {
                                            draft.progress.completedNodes = Math.min(
                                                draft.progress.totalNodes,
                                                draft.progress.completedNodes + 1
                                            );
                                        }

                                        const recalcSectionProgress = (sec: any): { total: number; completed: number } => {
                                            let total = sec.nodes ? sec.nodes.length : 0;
                                            let completed = sec.nodes ? sec.nodes.filter((n: any) => n.isComplete).length : 0;

                                            if (sec.children) {
                                                for (const child of sec.children) {
                                                    const childProgress = recalcSectionProgress(child);
                                                    total += childProgress.total;
                                                    completed += childProgress.completed;
                                                }
                                            }
                                            sec.progress = { totalNodes: total, completedNodes: completed };
                                            return { total, completed };
                                        };

                                        for (const sec of draft.sections || []) {
                                            recalcSectionProgress(sec);
                                        }
                                    }
                                })
                            );

                            // 4. Update the getGradeStructure cache and recalculate topic/grade progress counts
                            for (const queryKey of Object.keys(queries)) {
                                if (queryKey.startsWith("getGradeStructure(")) {
                                    const gradeId = queries[queryKey].originalArgs;
                                    if (gradeId !== undefined) {
                                        dispatch(
                                            (apiSlice.util.updateQueryData as any)("getGradeStructure", gradeId, (draft: any) => {
                                                if (!draft) return;
                                                let lessonUpdated = false;

                                                for (const topic of draft.topics || []) {
                                                    const lesson = topic.lessons?.find((l: any) => l.id === foundLessonId);
                                                    if (lesson && lesson.progress) {
                                                        if (lesson.progress.completedNodes < lesson.progress.totalNodes) {
                                                            lesson.progress.completedNodes += 1;
                                                            lessonUpdated = true;
                                                        }
                                                    }

                                                    if (lessonUpdated) {
                                                        let topicCompleted = 0;
                                                        let topicTotal = 0;
                                                        for (const l of topic.lessons || []) {
                                                            topicCompleted += l.progress?.completedNodes ?? 0;
                                                            topicTotal += l.progress?.totalNodes ?? 0;
                                                        }
                                                        if (topic.progress) {
                                                            topic.progress.completedNodes = topicCompleted;
                                                            topic.progress.totalNodes = topicTotal;
                                                        }
                                                        break;
                                                    }
                                                }

                                                if (lessonUpdated) {
                                                    let gradeCompleted = 0;
                                                    let gradeTotal = 0;
                                                    for (const topic of draft.topics || []) {
                                                        gradeCompleted += topic.progress?.completedNodes ?? 0;
                                                        gradeTotal += topic.progress?.totalNodes ?? 0;
                                                    }
                                                    if (draft.progress) {
                                                        draft.progress.completedNodes = gradeCompleted;
                                                        draft.progress.totalNodes = gradeTotal;
                                                    }
                                                }
                                            })
                                        );
                                    }
                                }
                            }
                        }
                    }
                } catch (err) {
                    console.error("Local cache progress update failed:", err);
                }
            },
        }),
    }),
});

export const {
    useGetLessonTreeQuery,
    useGetNodeDetailQuery,
    useFinishStudyNodeMutation,
} = contentApi;