import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Avatar, PrimaryButton, ScreenShell, StatCard } from "@/components/ui";
import { colors } from "@/theme/colors";
import { users } from "../mock/challengeData";
import { styles } from "../styles/challenge.styles";

function pushRoute(router: ReturnType<typeof useRouter>, route: string) {
    router.push(route as never);
}

export function BattleResultScreen() {
    const router = useRouter();

    return (
        <ScreenShell title="Kết quả đối đầu">
            <ScrollView
                contentContainerStyle={styles.contentWithFooter}
                showsVerticalScrollIndicator={false}
            >
                <LinearGradient
                    colors={[colors.primary, "#7C3AED"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.resultHero}
                >
                    <Ionicons name="trophy" size={40} color="#FDE68A" />
                    <Text style={styles.resultTitle}>Bạn thắng!</Text>
                    <Text style={styles.challengeCopy}>Nhà Trần chống Nguyên Mông</Text>
                    <Text style={styles.finalScore}>85 - 70</Text>
                </LinearGradient>
                <View style={styles.comparisonCard}>
                    <View style={styles.playerScore}>
                        <Avatar user={users[1]} />
                        <Text style={styles.userName}>Bạn</Text>
                        <Text style={styles.userMeta}>8/10 đúng</Text>
                        <Text style={styles.rewardText}>+120 XP</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.playerScore}>
                        <Avatar user={users[0]} />
                        <Text style={styles.userName}>Lan Chi</Text>
                        <Text style={styles.userMeta}>7/10 đúng</Text>
                        <Text style={styles.rewardText}>+80 XP</Text>
                    </View>
                </View>
                <View style={styles.summaryGrid}>
                    <StatCard value="80%" label="Độ chính xác" />
                    <StatCard value="23s" label="Nhanh hơn" />
                    <StatCard value="2/3" label="Câu khó đúng" />
                </View>
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Câu cần ôn lại</Text>
                    <Text style={styles.topicText}>Hội nghị Diên Hồng - Sai</Text>
                    <Text style={styles.topicText}>
                        Chiến thuật thủy chiến Bạch Đằng - Đúng chậm
                    </Text>
                </View>
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Lịch sử đối đầu</Text>
                    <Text style={styles.topicText}>Bạn 3 - 1 Lan Chi</Text>
                </View>
            </ScrollView>
            <View style={styles.footer}>
                <PrimaryButton
                    label="Thách đấu lại"
                    icon="refresh"
                    onPress={() => pushRoute(router, "/(social)/challenge-create")}
                />
                <PrimaryButton
                    label="Về danh sách bạn bè"
                    icon="people"
                    variant="outline"
                    onPress={() => pushRoute(router, "/(social)/friends")}
                />
            </View>
        </ScreenShell>
    );
}
