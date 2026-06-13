// app/(3_4_lessons)/lesson/node/[nodeId].tsx
import React from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { NodeScreen } from "../../../../features/lesson/components/NodeScreen";

export default function NodeDetailScreen() {
    const { nodeId } = useLocalSearchParams<{ nodeId: string }>();
    const router = useRouter();

    const id = Number(nodeId);

    return (
        <NodeScreen
            nodeId={id}
            onBack={() => router.back()}
            onQuizPress={() => {
                // TODO: navigate to node-scoped test when test feature is wired
                console.log("Quiz pressed for node:", id);
            }}
        />
    );
}
