import { Stack } from "expo-router";

export default function ProfileLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="10_2_profile_edit" />
            <Stack.Screen name="10_3_password_change" />
            <Stack.Screen name="10_4_test_history" />
            <Stack.Screen name="10_5_test_detail" />
            <Stack.Screen name="10_6_feedback" />
            <Stack.Screen name="10_7_feedback_history" />
            <Stack.Screen name="10_8_subscription" />
        </Stack>
    );
}
