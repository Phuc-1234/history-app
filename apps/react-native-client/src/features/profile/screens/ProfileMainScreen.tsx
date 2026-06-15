import React from "react";
import {
    ScrollView,
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

export default function ProfileMainScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();

    // Auto-subscribe to profile updates
    useGetProfileQuery();

    const profile = useAppSelector((state) => state.auth.profile);

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
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
        >
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

            <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.7}
            >
                <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
                <Text style={styles.logoutText}>Đăng xuất</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9F8FD",
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
        fontWeight: "700",
        color: "#1C1C1E",
        marginTop: 16,
    },
    tierBadge: {
        backgroundColor: "#E8E4F4",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 6,
    },
    tierText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#5856D6",
    },
    menuSection: {
        paddingHorizontal: 20,
        marginTop: 8,
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 20,
        marginTop: 24,
        paddingVertical: 16,
        backgroundColor: "#FFF0F0",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#FFE0E0",
    },
    logoutText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FF3B30",
        marginLeft: 8,
    },
});
