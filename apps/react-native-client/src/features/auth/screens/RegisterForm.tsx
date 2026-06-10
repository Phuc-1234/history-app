import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { User, Lock, Mail } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Input from "../../../components/Input";
import Button from "../../../components/Button";
import SocialLoginButtons from "../components/SocialLoginButtons";
import useRegisterForm from "../hooks/useRegisterForm"; // Using your brand new hook

export default function RegisterForm() {
    const {
        name,
        setName,
        email,
        setEmail,
        password,
        setPassword,
        confirmPassword,
        setConfirmPassword,
        formError,
        isLoading,
        navigateToLogin,
        handleRegister,
    } = useRegisterForm();
    const insets = useSafeAreaInsets();

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.keyboardAvoid}
        >
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContainer,
                    { paddingBottom: Math.max(insets.bottom, 20) }
                ]}
                bounces={false}
                keyboardShouldPersistTaps="handled"
            >
                <LinearGradient
                    colors={["#4332eb", "#593df2", "#7b4fff"]}
                    style={styles.banner}
                >
                    <View style={styles.logoContainer}>
                        <Svg width="50" height="40" viewBox="0 0 24 24">
                            <Path
                                d="M12 21C12 21 7 18 2 20V5C7 3 12 6 12 6C12 6 17 3 22 5V20C17 18 12 21 12 21Z"
                                fill="white"
                            />
                        </Svg>
                        <Text style={styles.star}>★</Text>
                    </View>
                    <Text style={styles.welcomeText}>Chào mừng!</Text>
                    <Text style={styles.subText}>Tạo tài khoản để bắt đầu học</Text>
                </LinearGradient>

                <View style={styles.formContainer}>
                    <Text style={styles.title}>Đăng ký</Text>

                    {/* Display client/backend errors gracefully above fields */}
                    {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

                    <Input
                        icon={User}
                        placeholder="Tên"
                        value={name}
                        autoCapitalize="words"
                        onChangeText={setName}
                        editable={!isLoading}
                    />
                    <Input
                        icon={Mail} // Using separate Mail icon if available for clarity
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!isLoading}
                    />
                    <Input
                        icon={Lock}
                        placeholder="Mật khẩu"
                        isPassword
                        value={password}
                        onChangeText={setPassword}
                        autoCapitalize="none"
                        editable={!isLoading}
                    />
                    <Input
                        icon={Lock}
                        placeholder="Xác nhận mật khẩu"
                        isPassword
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        autoCapitalize="none"
                        editable={!isLoading}
                    />

                    {isLoading ? (
                        <View style={styles.loadingWrapper}>
                            <ActivityIndicator size="small" color="#593df2" />
                        </View>
                    ) : (
                        <Button title="Đăng ký" onPress={handleRegister} />
                    )}

                    <View style={styles.dividerContainer}>
                        <View style={styles.line} />
                        <Text style={styles.dividerText}>HOẶC ĐĂNG KÝ BẰNG</Text>
                        <View style={styles.line} />
                    </View>

                    <SocialLoginButtons />

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Đã có tài khoản? </Text>
                        <TouchableOpacity
                            activeOpacity={0.6}
                            onPress={navigateToLogin}
                            disabled={isLoading}
                        >
                            <Text style={styles.registerText}>Đăng nhập</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    keyboardAvoid: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    scrollContainer: { flexGrow: 1, backgroundColor: "#FFFFFF" },
    banner: {
        paddingTop: 65,
        paddingBottom: 55,
        alignItems: "center",
        justifyContent: "center",
    },
    errorText: { color: "#FF3B30", fontSize: 14, fontWeight: "600", marginBottom: 12, textAlign: "center" },
    loadingWrapper: { height: 48, justifyContent: "center", alignItems: "center" },
    logoContainer: { position: "relative", marginBottom: 12 },
    star: {
        position: "absolute",
        top: -10,
        alignSelf: "center",
        color: "#FFA800",
        fontSize: 16,
    },
    welcomeText: {
        color: "#FFFFFF",
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 4,
    },
    subText: {
        color: "#E0DBFF",
        fontSize: 12,
        fontWeight: "400",
        opacity: 0.85,
    },
    formContainer: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        marginTop: -26,
        paddingHorizontal: 24,
        paddingTop: 28,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1A202C",
        marginBottom: 16,
    },
    dividerContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 20,
    },
    line: { flex: 1, height: 1, backgroundColor: "#E2E8F0" },
    dividerText: {
        fontSize: 10,
        fontWeight: "700",
        color: "#A0AEC0",
        paddingHorizontal: 12,
        letterSpacing: 0.5,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 30,
        marginBottom: 20,
    },
    footerText: { fontSize: 13, color: "#718096", fontWeight: "400" },
    registerText: { fontSize: 13, fontWeight: "700", color: "#4B3BF6" },
});
