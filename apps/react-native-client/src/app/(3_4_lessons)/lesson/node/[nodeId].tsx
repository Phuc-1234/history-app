// app/(3_4_lessons)/lesson/node/[nodeId].tsx
import React from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenWrapper } from "../../../../components/layout/ScreenWrapper";
import { NodeScreen } from "../../../../features/lesson/components/NodeScreen";
import { useAppSelector } from "../../../../store/storeHook";

export default function NodeDetailScreen() {
    const { nodeId, sectionNodeIds, lessonName } = useLocalSearchParams<{
        nodeId: string;
        sectionNodeIds?: string; // comma-separated sibling node IDs from parent
        lessonName?: string;
    }>();
    const router = useRouter();
    const id = Number(nodeId);

    const queries = useAppSelector((state: any) => state.api?.queries);

    const { steps, parentSectionsString } = React.useMemo(() => {
        if (!queries) return { steps: [], parentSectionsString: "" };

        let foundSteps: any[] = [];
        let foundPathStr = "";

        for (const queryKey of Object.keys(queries)) {
            if (queryKey.startsWith("getLessonTree(")) {
                const qData = queries[queryKey]?.data;
                if (qData && qData.sections) {
                    // Check if this lesson tree contains our current nodeId
                    const containsNode = (sections: any[]): boolean => {
                        for (const sec of sections) {
                            if (sec.nodes && sec.nodes.some((n: any) => n.id === id)) {
                                return true;
                            }
                            if (sec.children && containsNode(sec.children)) {
                                return true;
                            }
                        }
                        return false;
                    };
                    if (!containsNode(qData.sections)) {
                        continue;
                    }

                    const navigationSteps: any[] = [];
                    const collectNodeSteps = (sec: any) => {
                        if (sec.nodes) {
                            for (const n of sec.nodes) {
                                navigationSteps.push({ type: "NODE", nodeId: n.id });
                            }
                        }
                        if (sec.children) {
                            for (const child of sec.children) {
                                collectNodeSteps(child);
                            }
                        }
                    };
                    for (const sec of qData.sections) {
                        collectNodeSteps(sec);
                        navigationSteps.push({
                            type: "SECTION_TEST",
                            sectionId: sec.id,
                            sectionName: sec.name,
                        });
                    }
                    navigationSteps.push({
                        type: "LESSON_TEST",
                        lessonId: qData.id,
                        lessonName: qData.name,
                    });
                    foundSteps = navigationSteps;

                    const getParentPath = (sections: any[], targetNodeId: number): any[] | null => {
                        for (const sec of sections) {
                            if (sec.nodes && sec.nodes.some((n: any) => n.id === id)) {
                                return [sec];
                            }
                            if (sec.children && sec.children.length > 0) {
                                const path = getParentPath(sec.children, targetNodeId);
                                if (path) {
                                    return [sec, ...path];
                                }
                            }
                        }
                        return null;
                    };
                    const path = getParentPath(qData.sections, id);
                    if (path) {
                        foundPathStr = path.map((s: any) => s.name).join(" > ");
                    }
                    break;
                }
            }
        }
        return { steps: foundSteps, parentSectionsString: foundPathStr };
    }, [queries, id]);

    const handleStepNavigation = (step: any) => {
        if (step.type === "NODE") {
            router.replace({
                pathname: "/(3_4_lessons)/lesson/node/[nodeId]",
                params: {
                    nodeId: String(step.nodeId),
                    sectionNodeIds: sectionNodeIds ?? "",
                    lessonName: lessonName ?? "",
                },
            } as any);
        } else if (step.type === "SECTION_TEST") {
            router.push({
                pathname: "/(6_tests)/6_2_ques_choose",
                params: {
                    scopeType: "SECTION",
                    scopeId: String(step.sectionId),
                    purposeType: "PRACTICE",
                },
            });
        } else if (step.type === "LESSON_TEST") {
            router.push({
                pathname: "/(6_tests)/6_2_ques_choose",
                params: {
                    scopeType: "LESSON",
                    scopeId: String(step.lessonId),
                    purposeType: "EXAM",
                },
            });
        }
    };

    // Parse sibling node IDs for fallback prev/next navigation
    const siblingIds: number[] = sectionNodeIds
        ? sectionNodeIds.split(",").map(Number).filter((n) => !isNaN(n))
        : [];
    const siblingIdx = siblingIds.indexOf(id);

    const fallbackPrevNodeId = siblingIdx > 0 ? siblingIds[siblingIdx - 1] : null;
    const fallbackNextNodeId = siblingIdx >= 0 && siblingIdx < siblingIds.length - 1 ? siblingIds[siblingIdx + 1] : null;

    const navigateToNode = (targetId: number) => {
        router.replace({
            pathname: "/(3_4_lessons)/lesson/node/[nodeId]",
            params: {
                nodeId: String(targetId),
                sectionNodeIds: sectionNodeIds ?? "",
                lessonName: lessonName ?? "",
            },
        } as any);
    };

    const currentIdx = steps.findIndex((step: any) => step.type === "NODE" && step.nodeId === id);

    const onPrevPress = currentIdx > 0 
        ? () => handleStepNavigation(steps[currentIdx - 1]) 
        : (fallbackPrevNodeId != null ? () => navigateToNode(fallbackPrevNodeId) : undefined);

    const onNextPress = currentIdx !== -1 && currentIdx < steps.length - 1 
        ? () => handleStepNavigation(steps[currentIdx + 1]) 
        : (fallbackNextNodeId != null ? () => navigateToNode(fallbackNextNodeId) : undefined);

    return (
        <ScreenWrapper
            showTopBar={false}
            branchConfig={{
                hierarchy: parentSectionsString,
                onBackPress: () => router.back(),
            }}
        >
            <NodeScreen
                nodeId={id}
                lessonName={lessonName}
                onBack={() => router.back()}
                onQuizPress={() => {
                    router.push({
                        pathname: "/(6_tests)/6_2_ques_choose",
                        params: {
                            scopeType: "NODE",
                            scopeId: String(id),
                            purposeType: "PRACTICE",
                        },
                    });
                }}
                onPrevPress={onPrevPress}
                onNextPress={onNextPress}
            />
        </ScreenWrapper>
    );
}
