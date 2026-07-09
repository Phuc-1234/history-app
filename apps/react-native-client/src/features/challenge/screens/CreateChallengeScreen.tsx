import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Avatar, PrimaryButton, ScreenShell } from "@/components/ui";
import { colors } from "@/theme/colors";
import { questionPacks, users } from "../mock/challengeData";
import { styles } from "../styles/challenge.styles";

function pushRoute(router: ReturnType<typeof useRouter>, route: string) {
    router.push(route as never);
}

export function CreateChallengeScreen() {
    const router = useRouter();
    const [selectedPack, setSelectedPack] = useState(questionPacks[0].id);
    const opponent = users[0];

    return (
        <ScreenShell title="Tạo thách đấu">
            <ScrollView
                contentContainerStyle={styles.contentWithFooter}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.card}>
                    <View style={styles.rowCenter}>
                        <Avatar user={opponent} />
                        <View style={styles.userInfo}>
                            <Text style={styles.userName}>{opponent.name}</Text>
                            <Text style={styles.userMeta}>
                                Lv. {opponent.level} - Tỉ lệ thắng {opponent.winRate}%
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.iconButton}>
                            <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>
                <Text style={styles.sectionTitle}>Chọn chủ đề</Text>
                <View style={styles.chipRow}>
                    {["Tất cả", "Triều đại", "Chiến dịch", "Nhân vật", "Văn hóa"].map((chip) => (
                        <View key={chip} style={[styles.chip, chip === "Tất cả" && styles.chipActive]}>
                            <Text style={[styles.chipText, chip === "Tất cả" && styles.chipTextActive]}>
                                {chip}
                            </Text>
                        </View>
                    ))}
                </View>
                {questionPacks.map((pack) => {
                    const selected = pack.id === selectedPack;
                    return (
                        <TouchableOpacity
                            key={pack.id}
                            style={[styles.packCard, selected && styles.packCardSelected]}
                            onPress={() => setSelectedPack(pack.id)}
                            activeOpacity={0.84}
                        >
                            <View style={styles.packIcon}>
                                <Ionicons name="book" size={22} color={colors.primary} />
                            </View>
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{pack.title}</Text>
                                <Text style={styles.userMeta}>{pack.meta}</Text>
                                <Text style={styles.rewardText}>{pack.reward}</Text>
                            </View>
                            {selected ? (
                                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                            ) : null}
                        </TouchableOpacity>
                    );
                })}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Luật thi đấu</Text>
                    <Text style={styles.bodyText}>
                        Hai người cùng làm một bộ câu hỏi. Đúng nhiều hơn sẽ thắng, nếu hòa sẽ xét
                        thời gian hoàn thành.
                    </Text>
                </View>
            </ScrollView>
            <View style={styles.footer}>
                <Text style={styles.footerHint}>Đã chọn: Nhà Trần chống Nguyên Mông</Text>
                <PrimaryButton
                    label="Gửi lời thách đấu"
                    icon="send"
                    onPress={() => pushRoute(router, "/(social)/challenges")}
                />
            </View>
        </ScreenShell>
    );
}
