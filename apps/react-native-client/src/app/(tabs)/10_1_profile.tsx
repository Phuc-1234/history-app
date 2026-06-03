import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import Button from "@/components/Button";
import { TopBarWrapper } from "../../features/top_bar";

export default function ProfileScreen() {
    const router = useRouter();

    return (
        <TopBarWrapper>
            <View style={styles.container}>
                <Button
                    title={"\u0110\u1ed5i m\u1eadt kh\u1ea9u"}
                    onPress={() => router.push("/(10_proflie)/10_3_password_change")}
                />
                <Button title="Login" onPress={() => router.push("/(1_auth)/1_1_login")} />
            </View>
        </TopBarWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 24,
        gap: 16,
    },
});
