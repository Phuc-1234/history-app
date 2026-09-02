import React from "react";
import {
    Modal as RNModal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import Mascot from "./Mascot";
import colors from "../theme/colors";
import typography from "../theme/typography";
import { Ionicons } from "@expo/vector-icons";

import { useAppSelector } from "@/store/storeHook";

interface PremiumModalProps {
    visible: boolean;
    onClose: () => void;
    featureName?: string; // Optional: specific feature they tried to access, e.g. "bài học này"
    title?: string;
    description?: string;
}

export function PremiumModal({
    visible,
    onClose,
    featureName = "nội dung này",
    title,
    description,
}: PremiumModalProps) {
    const router = useRouter();
    const profile = useAppSelector((state) => state.auth.profile);

    const handleUpgrade = () => {
        onClose();
        if (!profile) {
            router.push("/(1_auth)/1_1_login");
            return;
        }
        // Redirect to subscription screen
        router.push("/(10_proflie)/10_8_subscription" as any);
    };

    return (
        <RNModal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
                    {/* Mascot character */}
                    <Mascot
                        expression="confident"
                        width={120}
                        height={120}
                        style={styles.mascot}
                    />

                    {/* Premium Tag */}
                    <View style={styles.crownContainer}>
                        <Text style={styles.premiumText}>ĐẶC QUYỀN PRO</Text>
                    </View>

                    {/* Title & Description */}
                    <Text style={styles.title}>{title || "Mở khóa để tiếp tục học"}</Text>
                    <Text style={styles.message}>
                        {description || `Rất tiếc, ${featureName} chỉ dành cho tài khoản PRO. Hãy nâng cấp để trải nghiệm trọn vẹn:`}
                    </Text>

                    {/* Benefits List */}
                    <View style={styles.benefitsContainer}>
                        <View style={styles.benefitItem}>
                            <Ionicons name="book-outline" size={16} color={colors.primary} />
                            <Text style={styles.benefitText}>Mở khoá toàn bộ bài học</Text>
                        </View>
                        <View style={styles.benefitItem}>
                            <Ionicons name="document-text-outline" size={16} color={colors.secondary} />
                            <Text style={styles.benefitText}>Mở khoá toàn bộ đề thpt</Text>
                        </View>
                        <View style={styles.benefitItem}>
                            <Ionicons name="layers-outline" size={16} color={colors.warning} />
                            <Text style={styles.benefitText}>Mở khoá thẻ lật</Text>
                        </View>
                        <View style={styles.benefitItem}>
                            <Ionicons name="git-network-outline" size={16} color={colors.success} />
                            <Text style={styles.benefitText}>Mở khoá mind map</Text>
                        </View>
                        <View style={styles.benefitItem}>
                            <Ionicons name="sparkles-outline" size={16} color={colors.secondaryHover} />
                            <Text style={styles.benefitText}>Hạn mức AI Chat cao gấp 10 lần</Text>
                        </View>
                    </View>

                    {/* Buttons */}
                    <View style={styles.buttons}>
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={onClose}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.cancelText}>Để sau</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={styles.confirmBtn}
                            onPress={handleUpgrade}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.confirmText}>Nâng cấp ngay</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </RNModal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(43, 29, 18, 0.5)", // Dark brown translucent overlay matching theme
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 24,
        width: "100%",
        maxWidth: 340,
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: colors.borderMedium,
    },
    mascot: {
        marginBottom: 10,
    },
    crownContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.secondaryContainer,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "rgba(229, 169, 59, 0.3)",
    },
    premiumText: {
        fontFamily: typography.fonts.bold,
        fontSize: 12,
        color: colors.secondaryHover,
        letterSpacing: 0.5,
    },
    title: {
        fontFamily: typography.fonts.bold,
        fontSize: 20,
        color: colors.textPrimary,
        marginBottom: 8,
        textAlign: "center",
    },
    message: {
        fontFamily: typography.fonts.regular,
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: "center",
        marginBottom: 16,
        lineHeight: 20,
    },
    benefitsContainer: {
        width: "100%",
        backgroundColor: colors.surfaceVariant,
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
        gap: 8,
    },
    benefitItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    benefitText: {
        fontFamily: typography.fonts.medium,
        fontSize: 13,
        color: colors.textPrimary,
        flex: 1,
    },
    buttons: {
        flexDirection: "row",
        width: "100%",
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: colors.surfaceVariant,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: colors.borderMedium,
    },
    cancelText: {
        fontFamily: typography.fonts.bold,
        fontSize: 15,
        color: colors.textSecondary,
    },
    confirmBtn: {
        flex: 1.5,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    confirmText: {
        fontFamily: typography.fonts.bold,
        fontSize: 15,
        color: colors.textLight,
    },
});
