import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import ProfileAvatar from "../components/ProfileAvatar";
import ProfileMenuItem from "../components/ProfileMenuItem";

export default function ProfileMainScreen() {
    const router = useRouter();

    const handleEditProfile = () => {
        router.push("/(10_proflie)/10_2_profile_edit");
    };

    const handleChangePassword = () => {
        router.push("/(10_proflie)/10_3_password_change");
    };

    const handleLinkAccounts = () => {
        // TODO: Navigate to link accounts screen
    };

    const handleLogout = () => {
        router.replace("/(1_auth)/1_1_login");
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
        >
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
                <ProfileAvatar size={120} onEditPress={handleEditProfile} />
                <Text style={styles.userName}>Nguyễn Văn A</Text>
                <Text style={styles.userEmail}>nguyenvana@example.com</Text>
            </View>

            {/* Menu Items */}
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
                    icon="link-outline"
                    label="Liên kết tài khoản"
                    onPress={handleLinkAccounts}
                />
            </View>

            {/* Logout Button */}
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

    userEmail: {
        fontSize: 14,
        color: "#8E8E93",
        marginTop: 4,
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