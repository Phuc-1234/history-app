import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { PrimaryButton, ScreenShell, UserCard } from "@/components/ui";
import { colors } from "@/theme/colors";
import { challenges } from "../mock/challengeData";
import { styles } from "../styles/challenge.styles";

function pushRoute(router: ReturnType<typeof useRouter>, route: string) {
    router.push(route as never);
}

export function ChallengeHubScreen() {
    const router = useRouter();

    return (
        <ScreenShell title="Thi đấu với bạn bè">
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={[colors.primary, "#7C3AED"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.challengeHero}
                >
                    <View>
                        <Text style={styles.challengeEyebrow}>Thi đấu lịch sử 1v1</Text>
                        <Text style={styles.challengeTitle}>Thách đấu bạn bè</Text>
                        <Text style={styles.challengeCopy}>
                            Làm cùng bộ câu hỏi, số điểm và thời gian quyết định người thắng.
                        </Text>
                    </View>
                    <PrimaryButton
                        label="Tạo thách đấu"
                        icon="flash"
                        onPress={() => pushRoute(router, "/(social)/challenge-create")}
                    />
                </LinearGradient>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Đang chờ xử lý</Text>
                    <Text style={styles.sectionHint}>2 trận</Text>
                </View>
                {challenges.slice(0, 2).map((challenge) => (
                    <View key={challenge.id} style={styles.card}>
                        <UserCard user={challenge.opponent} />
                        <Text style={styles.topicText}>{challenge.topic}</Text>
                        <View style={styles.actionRow}>
                            <PrimaryButton
                                label={challenge.status === "incoming" ? "Vào trận" : "Đang chờ"}
                                icon={challenge.status === "incoming" ? "play" : "time"}
                                onPress={() => pushRoute(router, "/(social)/battle")}
                            />
                            <PrimaryButton label="Từ chối" icon="close" variant="outline" />
                        </View>
                    </View>
                ))}

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Lịch sử gần đây</Text>
                    <Text style={styles.topicText}>Bạn thắng Quang Huy - 85 - 70</Text>
                    <PrimaryButton
                        label="Xem kết quả"
                        icon="stats-chart"
                        variant="soft"
                        onPress={() => pushRoute(router, "/(social)/battle-result")}
                    />
                </View>
            </ScrollView>
        </ScreenShell>
    );
}
