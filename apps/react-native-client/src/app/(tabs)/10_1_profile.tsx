// make a button that routes to login

import Button from "@/components/Button";
import { TopBarWrapper } from "../../features/top_bar";
import { useRouter } from "expo-router";


const router = useRouter();

export default function ProfileScreen() {
    return (
        <TopBarWrapper>
            <Button title="Login" onPress={() => router.push("/(1_auth)/1_1_login")} />
        </TopBarWrapper>
    );
}
