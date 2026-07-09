import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Avatar, PrimaryButton, ScreenShell } from "@/components/ui";
import { colors } from "@/theme/colors";
import { users } from "../mock/challengeData";
import { styles } from "../styles/challenge.styles";

function pushRoute(router: ReturnType<typeof useRouter>, route: string) {
    router.push(route as never);
}

export function BattleScreen() {
    const router = useRouter();
    const [answer, setAnswer] = useState("A");
    const options: [string, string][] = [
        ["A", "Trần Hưng Đạo"],
        ["B", "Trần Quang Khải"],
        ["C", "Phạm Ngũ Lão"],
        ["D", "Yết Kiêu"],
    ];

    return (
        <ScreenShell title="Thi đấu 1v1">
            <ScrollView
                contentContainerStyle={styles.contentWithFooter}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.scoreCard}>
                    <View style={styles.playerScore}>
                        <Avatar user={users[1]} size={44} />
                        <Text style={styles.userName}>Bạn</Text>
                        <Text style={styles.scoreText}>4</Text>
                    </View>
                    <View style={styles.roundPill}>
                        <Text style={styles.roundPillText}>Câu 5/10</Text>
                    </View>
                    <View style={styles.playerScore}>
                        <Avatar user={users[0]} size={44} />
                        <Text style={styles.userName}>Lan Chi</Text>
                        <Text style={styles.scoreText}>3</Text>
                    </View>
                </View>
                <View style={styles.card}>
                    <Text style={styles.userMeta}>
                        Nhà Trần chống Nguyên Mông - Khó vừa
                    </Text>
                    <Text style={styles.questionText}>
                        Ai là vị tướng đã chỉ huy trận Bạch Đằng năm 1288?
                    </Text>
                </View>
                {options.map(([key, value]) => {
                    const selected = answer === key;
                    return (
                        <TouchableOpacity
                            key={key}
                            style={[styles.answerCard, selected && styles.answerCardSelected]}
                            onPress={() => setAnswer(key)}
                            activeOpacity={0.84}
                        >
                            <Text style={[styles.answerKey, selected && styles.answerKeySelected]}>
                                {key}
                            </Text>
                            <Text style={[styles.answerText, selected && { color: "#FFFFFF" }]}>
                                {value}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
                <View style={styles.livePanel}>
                    <View style={styles.onlineDot} />
                    <Text style={[styles.userMeta, { color: colors.success }]}>
                        Lan Chi vừa trả lời câu 5 - 3 giây trước
                    </Text>
                </View>
            </ScrollView>
            <View style={styles.footer}>
                <Text style={styles.footerHint}>Đúng nhanh hơn sẽ được ưu tiên khi hòa</Text>
                <View style={styles.actionRow}>
                    <PrimaryButton label="Bỏ qua" icon="play-skip-forward" variant="outline" />
                    <PrimaryButton
                        label="Trả lời"
                        icon="checkmark"
                        onPress={() => pushRoute(router, "/(social)/battle-result")}
                    />
                </View>
            </View>
        </ScreenShell>
    );
}
