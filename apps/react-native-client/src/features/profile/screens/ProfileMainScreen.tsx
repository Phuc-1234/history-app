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

export default function ProfileMainScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();

    // Auto-subscribe to profile updates
    const { refetch, isFetching } = useGetProfileQuery();

    const profile = useAppSelector((state) => state.auth.profile);

    const handleGoToHome = () => {
        router.push("/(tabs)/home");
    };

    const handleEditProfile = () => {
        router.push("/(10_proflie)/10_2_profile_edit");
    };

    const handleChangePassword = () => {
        router.push("/(10_proflie)/10_3_password_change");
    };

    const handleLinkAccounts = () => {
        // TODO: Navigate to link accounts screen
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

            <TouchableOpacity
                style={styles.homeButton}
                onPress={handleGoToHome}
                activeOpacity={0.8}
            >
                <Ionicons name="home-outline" size={18} color={colors.textLight} />
                <Text style={styles.homeButtonText}>Đi tới Trang chủ</Text>
            </TouchableOpacity>

            <View style={styles.menuSection}>
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
                    <ProfileMenuItem
                        icon="document-text-outline"
                        label="Lịch sử làm bài"
                        onPress={handleViewHistory}
                    />
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
                    <ProfileMenuItem
                        icon="link-outline"
                        label="Liên kết tài khoản"
                        onPress={handleLinkAccounts}
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
    menuContainer: {
        backgroundColor: colors.primaryContainer,
        borderRadius: 12,
        paddingVertical: 8,
    },
    homeButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 20,
        marginTop: 16,
        paddingVertical: 14,
        backgroundColor: colors.primary,
        borderRadius: 30,
        gap: 8,
    },
    homeButtonText: {
        fontSize: 15,
        fontWeight: "500",
        color: colors.textLight,
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 20,
        marginTop: 12,
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
});
