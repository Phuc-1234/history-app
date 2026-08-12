import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAppDispatch, useAppSelector } from "@/store/storeHook";
import { appLogout } from "@/features/auth/store/authSlice";
import { useGetProfileQuery } from "@/features/auth/services/authApi";
import ProfileAvatar from "../components/ProfileAvatar";
import ProfileMenuItem from "../components/ProfileMenuItem";
import { ScreenWrapper } from "../../../components/layout/ScreenWrapper";
import { colors } from "../../../theme/colors";
import typography from "../../../theme/typography";
import { Card } from "../../../components/Card";
import Button from "../../../components/Button";
import { FaintStarsOverlay } from "../../../components/ui";

export default function ProfileMainScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();

    // Auto-subscribe to profile updates
    const { refetch, isFetching } = useGetProfileQuery();

    const profile = useAppSelector((state) => state.auth.profile);

    if (!profile) {
        return (
            <ScreenWrapper
                enableScroll={true}
                showTopBar={false}
                style={styles.container}
                contentContainerStyle={styles.guestContentContainer}
            >
                <View style={styles.guestContainer}>
                    <Ionicons
                        name="person-circle-outline"
                        size={100}
                        color={colors.primary}
                        style={styles.guestIcon}
                    />
                    <Text style={styles.guestTitle}>Chế độ khách</Text>
                    <Text style={styles.guestSubText}>
                        Vui lòng đăng nhập hoặc đăng ký tài khoản để lưu trữ lịch sử làm bài và theo dõi bạn bè.
                    </Text>
                    <View style={styles.guestActions}>
                        <Button
                            title="Đăng nhập"
                            variant="primary"
                            onPress={() => router.push("/(1_auth)/1_1_login")}
                        />
                        <Button
                            title="Đăng ký"
                            variant="outline"
                            onPress={() => router.push("/(1_auth)/1_2_register")}
                        />
                    </View>
                </View>
            </ScreenWrapper>
        );
    }

    const handleEditProfile = () => {
        router.push("/(10_proflie)/10_2_profile_edit");
    };

    const handleChangePassword = () => {
        router.push("/(10_proflie)/10_3_password_change");
    };

    const handleViewHistory = () => {
        router.push("/(10_proflie)/10_4_test_history");
    };

    const handleOpenFriends = () => {
        router.push("/(social)/friends" as never);
    };

    const handleOpenItems = () => {
        router.push("/(tabs)/7_1_item" as never);
    };

    const handleSendFeedback = () => {
        router.push("/(10_proflie)/10_6_feedback");
    };

    const handleLogout = async () => {
        await dispatch(appLogout());
        router.replace("/(1_auth)/1_1_login");
    };

    return (
        <ScreenWrapper
            enableScroll={true}
            enableRefresh={true}
            refreshing={isFetching}
            onRefresh={refetch}
            contentContainerStyle={styles.contentContainer}
            style={styles.container}
        >
            <View>
            <View style={styles.avatarSection}>
                <ProfileAvatar
                    uri={profile?.profileImgUrl}
                    frameUri={profile?.equippedFrameUrl}
                    size={120}
                    name={profile?.name}
                    showEditButton={true}
                    onEditPress={() => router.push("/(10_proflie)/10_2_profile_edit?triggerImagePicker=true")}
                />
                <Text style={styles.userName}>{profile?.name || "Người dùng"}</Text>
            </View>


            <View style={styles.menuSection}>
                {/* Quick action buttons */}
                <View style={styles.quickGrid}>
                    {/* Pro button — shiny gradient */}
                    <TouchableOpacity
                        style={styles.proButtonWrapper}
                        onPress={() => router.push("/(10_proflie)/10_8_subscription" as any)}
                        activeOpacity={0.82}
                    >
                        <LinearGradient
                            colors={colors.proGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.squareButtonPro}
                        >
                            <FaintStarsOverlay />
                            {/* shimmer strip */}
                            <LinearGradient
                                colors={["transparent", "rgba(255,255,255,0.35)", "transparent"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.proShimmer}
                            />
                            <Ionicons name="sparkles" size={22} color="#fff" />
                            <Text style={styles.squareLabelPro}>
                                {profile?.isPro ? "Bạn đã là người dùng PRO!" : "Đăng ký Sắc Sử PRO"}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Row 1: Test history & Friends */}
                    <View style={styles.gridRow}>
                        <TouchableOpacity
                            style={styles.squareButtonWrapper}
                            onPress={handleViewHistory}
                            activeOpacity={0.82}
                        >
                            <View style={styles.squareButton}>
                                <Ionicons name="document-text-outline" size={26} color={colors.primary} />
                                <Text style={styles.squareLabel}>Lịch sử làm bài</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.squareButtonWrapper}
                            onPress={handleOpenFriends}
                            activeOpacity={0.82}
                        >
                            <View style={styles.squareButton}>
                                <Ionicons name="people-outline" size={26} color={colors.primary} />
                                <Text style={styles.squareLabel}>Bạn bè & theo dõi</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Row 2: Vật phẩm & Feedback */}
                    <View style={styles.gridRow}>
                        <TouchableOpacity
                            style={styles.squareButtonWrapper}
                            onPress={handleOpenItems}
                            activeOpacity={0.82}
                        >
                            <View style={styles.squareButton}>
                                <Ionicons name="gift-outline" size={26} color={colors.primary} />
                                <Text style={styles.squareLabel}>Vật phẩm</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.squareButtonWrapper}
                            onPress={handleSendFeedback}
                            activeOpacity={0.82}
                        >
                            <View style={styles.squareButton}>
                                <Ionicons name="chatbubble-ellipses-outline" size={26} color={colors.primary} />
                                <Text style={styles.squareLabel}>Góp ý</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.sectionHeader}>Quản lý tài khoản</Text>
                <Card variant="soft" style={styles.menuContainer}>
                    <ProfileMenuItem
                        icon="person-outline"
                        label="Sửa thông tin"
                        onPress={handleEditProfile}
                    />
                    <ProfileMenuItem
                        icon="lock-closed-outline"
                        label="Đổi mật khẩu"
                        onPress={handleChangePassword}
                    />
                </Card>
            </View>

            <View style={styles.versionContainer}>
                <Text style={styles.versionText}>Phiên bản 4.4.1</Text>
                <Text style={styles.groupText}>Thực hiện bởi nhóm "Sử Việt"</Text>
            </View>
            <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.7}
            >
                <Ionicons name="log-out-outline" size={20} color={colors.textLight} />
                <Text style={styles.logoutText}>Đăng xuất</Text>
            </TouchableOpacity>
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    contentContainer: {
        paddingBottom: 40,
    },
    avatarSection: {
        alignItems: "center",
        paddingTop: 30,
        paddingBottom: 24,
    },
    userName: {
        fontFamily: typography.fonts.bold,
        fontSize: 20,
        color: colors.textPrimary,
        marginTop: 16,
    },
    tierBadge: {
        backgroundColor: colors.primaryContainer,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 5,
        marginTop: 6,
    },
    tierText: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 13,
        color: colors.primary,
    },
    menuSection: {
        paddingHorizontal: 20,
        marginTop: 8,
    },
    sectionHeader: {
        fontFamily: typography.fonts.medium,
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 16,
        marginBottom: 8,
        paddingLeft: 4,
    },
    menuContainer: {
        paddingVertical: 8,
        marginBottom: 8,
    },
    versionContainer: {
        alignItems: "center",
        marginTop: 24,
        marginBottom: 4,
    },
    versionText: {
        fontFamily: typography.fonts.regular,
        fontSize: 12,
        color: colors.textSecondary,
    },
    groupText: {
        fontFamily: typography.fonts.medium,
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 20,
        marginTop: 20,
        paddingVertical: 14,
        backgroundColor: colors.error,
        borderRadius: 30,
    },
    logoutText: {
        fontFamily: typography.fonts.bold,
        fontSize: 15,
        color: colors.textLight,
        marginLeft: 8,
    },
    guestContentContainer: {
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    guestContainer: {
        alignItems: "center",
        justifyContent: "center",
    },
    guestIcon: {
        marginBottom: 16,
    },
    guestTitle: {
        fontFamily: typography.fonts.bold,
        fontSize: 22,
        color: colors.textPrimary,
        marginBottom: 8,
    },
    guestSubText: {
        fontFamily: typography.fonts.regular,
        fontSize: 15,
        color: colors.textSecondary,
        textAlign: "center",
        marginBottom: 24,
        lineHeight: 22,
    },
    guestActions: {
        width: "100%",
        gap: 8,
    },
    proBadgeContainer: {
        marginTop: 8,
        borderRadius: 20,
        overflow: "hidden",
    },
    proBadge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        alignItems: "center",
        justifyContent: "center",
    },
    proBadgeText: {
        fontSize: 12,
        fontWeight: "800",
        color: "#ffffff",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    // Quick grid
    quickGrid: {
        gap: 10,
        marginBottom: 4,
    },
    gridRow: {
        flexDirection: "row",
        gap: 10,
    },
    squareButtonWrapper: {
        flex: 1,
        aspectRatio: 2.1,
        borderRadius: 12,
        overflow: "hidden",
    },
    proButtonWrapper: {
        width: "100%",
        height: 50,
        borderRadius: 12,
        overflow: "hidden",
    },
    squareButton: {
        backgroundColor: colors.primaryContainer,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        flex: 1
    },
    squareButtonPro: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        overflow: "hidden",
    },
    proShimmer: {
        position: "absolute",
        top: 0,
        left: "-30%",
        width: "60%",
        height: "100%",
        transform: [{ skewX: "-20deg" }],
    },
    squareLabel: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 12,
        color: colors.textPrimary,
        textAlign: "center",
    },
    squareLabelPro: {
        fontFamily: typography.fonts.bold,
        fontSize: 14,
        color: "#fff",
        textAlign: "center",
    },
});
