import { useEffect } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { ActivityIndicator, View } from "react-native";
import { store, persistor } from "../store/store";

// Prevent the native splash screen from auto-hiding until assets/auth are loaded
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    useEffect(() => {
        // Hide the native launch screen once everything mounts up fully
        SplashScreen.hideAsync();
    }, []);

    return (
        // 1. Give the entire app tree access to the Redux Store
        <Provider store={store}>
            {/* 2. Delay rendering UI until local storage token/states are rehydrated */}
            <PersistGate loading={<LoadingFallback />} persistor={persistor}>
                {/* 3. Expo Router Native Navigation Container */}
                <Stack
                    screenOptions={{
                        // This completely turns off the default native route headers
                        // across ALL app stack contexts, tabs, and nested screens globally.
                        headerShown: false,
                    }}
                >
                    <Stack.Screen
                        name="(tabs)"
                        
                    />
                    <Stack.Screen
                        name="modal"
                        options={{ presentation: "modal" }}
                    />
                </Stack>
            </PersistGate>
        </Provider>
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
