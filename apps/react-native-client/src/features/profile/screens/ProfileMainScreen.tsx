import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppDispatch, useAppSelector } from "@/store/storeHook";
import { appLogout } from "@/features/auth/store/authSlice";
import { useGetProfileQuery } from "@/features/auth/services/authApi";
import ProfileAvatar from "../components/ProfileAvatar";
import ProfileMenuItem from "../components/ProfileMenuItem";
import { ScreenWrapper } from "../../../components/layout/ScreenWrapper";
import { colors } from "../../../theme/colors";
import Button from "../../../components/Button";

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

    const handleOpenChallenges = () => {
        router.push("/(social)/challenges" as never);
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
                    size={120}
                    showEditButton={false}
                />
                <Text style={styles.userName}>{profile?.name || "Người dùng"}</Text>
                
                {profile?.tierName && (
                    <View style={styles.tierBadge}>
                        <Text style={styles.tierText}>{profile.tierName}</Text>
                    </View>
                )}
            </View>


            <View style={styles.menuSection}>
                <Text style={styles.sectionHeader}>Quản lý tài khoản</Text>
                <View style={styles.menuContainer}>
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
                </View>

                <Text style={styles.sectionHeader}>Quản lý làm bài</Text>
                <View style={styles.menuContainer}>
                    <ProfileMenuItem
                        icon="document-text-outline"
                        label="Lịch sử làm bài"
                        onPress={handleViewHistory}
                    />
                </View>

                <Text style={styles.sectionHeader}>Cộng đồng</Text>
                <View style={styles.menuContainer}>
                    <ProfileMenuItem
                        icon="people-outline"
                        label="Bạn bè & theo dõi"
                        onPress={handleOpenFriends}
                    />
                    <ProfileMenuItem
                        icon="flash-outline"
                        label="Thi đấu với bạn bè"
                        onPress={handleOpenChallenges}
                    />
                </View>
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
        fontSize: 20,
        fontWeight: "500",
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
        fontSize: 13,
        fontWeight: "600",
        color: colors.primary,
    },
    menuSection: {
        paddingHorizontal: 20,
        marginTop: 8,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: "500",
        color: colors.textSecondary,
        marginTop: 16,
        marginBottom: 8,
        paddingLeft: 4,
    },
    menuContainer: {
        backgroundColor: colors.primaryContainer,
        borderRadius: 12,
        paddingVertical: 8,
        marginBottom: 8,
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
        fontSize: 15,
        fontWeight: "500",
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
        fontSize: 22,
        fontWeight: "500",
        color: colors.textPrimary,
        marginBottom: 8,
    },
    guestSubText: {
        fontSize: 15,
        fontWeight: "400",
        color: colors.textSecondary,
        textAlign: "center",
        marginBottom: 24,
        lineHeight: 22,
    },
    guestActions: {
        width: "100%",
        gap: 8,
    },
});
