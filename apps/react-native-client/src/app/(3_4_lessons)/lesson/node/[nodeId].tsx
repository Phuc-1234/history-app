// app/(3_4_lessons)/lesson/node/[nodeId].tsx
import React from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenWrapper } from "../../../../components/layout/ScreenWrapper";
import { NodeScreen } from "../../../../features/lesson/components/NodeScreen";

export default function NodeDetailScreen() {
    const { nodeId, sectionNodeIds } = useLocalSearchParams<{
        nodeId: string;
        sectionNodeIds?: string; // comma-separated sibling node IDs from parent
    }>();
    const router = useRouter();
    const id = Number(nodeId);

    // Parse sibling node IDs for prev/next navigation
    const siblingIds: number[] = sectionNodeIds
        ? sectionNodeIds.split(",").map(Number).filter((n) => !isNaN(n))
        : [];
    const currentIdx = siblingIds.indexOf(id);

    const prevNodeId = currentIdx > 0 ? siblingIds[currentIdx - 1] : null;
    const nextNodeId = currentIdx >= 0 && currentIdx < siblingIds.length - 1 ? siblingIds[currentIdx + 1] : null;

    const navigateToNode = (targetId: number) => {
        router.replace({
            pathname: "/(3_4_lessons)/lesson/node/[nodeId]",
            params: {
                nodeId: String(targetId),
                sectionNodeIds: sectionNodeIds ?? "",
            },
        } as any);
    };

    return (
        <ScreenWrapper
            branchConfig={{
                hierarchy: "Nội dung bài",
                title: `Phần ${id}`,
                onBackPress: () => router.back(),
            }}
        >
            <NodeScreen
                nodeId={id}
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
                onPrevPress={prevNodeId != null ? () => navigateToNode(prevNodeId) : undefined}
                onNextPress={nextNodeId != null ? () => navigateToNode(nextNodeId) : undefined}
            />
        </ScreenWrapper>
    );
}
