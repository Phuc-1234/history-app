import { Stack } from "expo-router";

export default function ProfileLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="10_2_profile_edit" />
            <Stack.Screen name="10_3_password_change" />
        </Stack>
    );
}
