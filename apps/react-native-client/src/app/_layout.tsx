import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { ActivityIndicator, View } from "react-native";
// 1. Import SafeAreaProvider
import { SafeAreaProvider } from "react-native-safe-area-context";
import { store, persistor } from "../store/store";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { GlobalSessionModal } from "../components/GlobalSessionModal";
import { GlobalNetworkModal } from "../components/GlobalNetworkModal";
import messaging from "@react-native-firebase/messaging";
import { useNotification } from "../features/notification";
import { Toast } from "../components/Toast";
import { toastService, type ToastType } from "../services/toastService";

import { useFonts } from "expo-font";

import { LoadingProvider } from "../features/loading";
import { SideDrawerProvider } from "../components/layout/SideDrawerContext";

// Register background handler for Firebase Cloud Messaging (Android)
try {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
        console.log("Message handled in the background!", remoteMessage);
    });
} catch (error) {
    console.warn("[Firebase Messaging] Failed to register background message handler. Firebase might not be initialized natively:", error);
}

import { PvpActiveRoomPromptModal } from "../features/pvp";
import { GlobalTestResumePromptModal } from "../features/test_v2";

// Prevent the native splash screen from auto-hiding until assets/auth are loaded
SplashScreen.preventAutoHideAsync();

function NotificationInitializer() {
    useNotification();
    return null;
}

export default function RootLayout() {
    const [fontsLoaded, fontError] = useFonts({
        "Nunito-Black": require("../../assets/fonts/Nunito-Black.ttf"),
        "Nunito-BlackItalic": require("../../assets/fonts/Nunito-BlackItalic.ttf"),
        "Nunito-Bold": require("../../assets/fonts/Nunito-Bold.ttf"),
        "Nunito-BoldItalic": require("../../assets/fonts/Nunito-BoldItalic.ttf"),
        "Nunito-ExtraBold": require("../../assets/fonts/Nunito-ExtraBold.ttf"),
        "Nunito-ExtraBoldItalic": require("../../assets/fonts/Nunito-ExtraBoldItalic.ttf"),
        "Nunito-ExtraLight": require("../../assets/fonts/Nunito-ExtraLight.ttf"),
        "Nunito-ExtraLightItalic": require("../../assets/fonts/Nunito-ExtraLightItalic.ttf"),
        "Nunito-Italic": require("../../assets/fonts/Nunito-Italic.ttf"),
        "Nunito-Light": require("../../assets/fonts/Nunito-Light.ttf"),
        "Nunito-LightItalic": require("../../assets/fonts/Nunito-LightItalic.ttf"),
        "Nunito-Medium": require("../../assets/fonts/Nunito-Medium.ttf"),
        "Nunito-MediumItalic": require("../../assets/fonts/Nunito-MediumItalic.ttf"),
        "Nunito-Regular": require("../../assets/fonts/Nunito-Regular.ttf"),
        "Nunito-SemiBold": require("../../assets/fonts/Nunito-SemiBold.ttf"),
        "Nunito-SemiBoldItalic": require("../../assets/fonts/Nunito-SemiBoldItalic.ttf"),
    });

    useEffect(() => {
        if (fontsLoaded || fontError) {
            // Hide the native launch screen once everything mounts up fully and fonts are loaded
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontError]);

    if (!fontsLoaded && !fontError) {
        return <LoadingFallback />;
    }

    return (
        // 2. Wrap your entire application context tree
        
        <SafeAreaProvider>
            {/* 1. Give the entire app tree access to the Redux Store */}
            <Provider store={store}>
                {/* 2. Delay rendering UI until local storage token/states are rehydrated */}
                <PersistGate loading={<LoadingFallback />} persistor={persistor}>
                    <NotificationInitializer />
                    <LoadingProvider>
                        <SideDrawerProvider>
                            {/* 3. Expo Router Native Navigation Container */}
                            <Stack
                                screenOptions={{
                                    // This completely turns off the default native route headers
                                    // across ALL app stack contexts, tabs, and nested screens globally.
                                    headerShown: false,
                                }}
                            >
                                <Stack.Screen name="(tabs)" />
                                <Stack.Screen
                                    name="modal"
                                    options={{ presentation: "modal" }}
                                />
                            </Stack>
                            <GlobalSessionModal />
                            <GlobalNetworkModal />
                            <PvpActiveRoomPromptModal />
                            <GlobalTestResumePromptModal />
                            <GlobalToastContainer />
                        </SideDrawerProvider>
                    </LoadingProvider>
                </PersistGate>
            </Provider>
        </SafeAreaProvider>
       
    );
}

// Simple fallback spinner layout while Redux Persist reads data from disk
function LoadingFallback() {
    return (
        <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
            <ActivityIndicator size="large" color="#0000ff" />
        </View>
    );
}

function GlobalToastContainer() {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState("");
    const [type, setType] = useState<ToastType>("success");
    const [duration, setDuration] = useState<number | undefined>(undefined);

    useEffect(() => {
        return toastService.subscribe((msg, t, dur) => {
            setMessage(msg);
            setType(t);
            setDuration(dur);
            setVisible(true);
        });
    }, []);

    return (
        <Toast
            message={message}
            type={type}
            visible={visible}
            duration={duration}
            onHide={() => setVisible(false)}
        />
    );
}