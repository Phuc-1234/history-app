import { useLocalSearchParams, useRouter } from "expo-router";
import { TopBarWrapper } from "../../features/top_bar";
import MindMapScreen from "../../features/mind-map/components/MindMapScreen";
import type { MindMapQuery } from "../../features/mind-map/mindMapApi";

function toMindMapQuery(params: {
    lessonId?: string;
}): MindMapQuery | undefined {
    if (!params.lessonId) return undefined;

    const lessonId = Number(params.lessonId);
    if (!Number.isInteger(lessonId) || lessonId <= 0) return undefined;

    return { lessonId };
}

export default function MindMapRoute() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        lessonId?: string;
    }>();
    const query = toMindMapQuery(params);

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/(3_4_lessons)/lesson/default-id");
        }
    };

    return (
        <TopBarWrapper
            branchConfig={{
                hierarchy: "LỚP SỬ 10",
                title: "Sơ đồ tư duy",
                subtitle: "Kháng chiến chống Pháp (1946-1954)",
                onBackPress: handleBack,
            }}
        >
            <MindMapScreen query={query} />
        </TopBarWrapper>
    );
}
