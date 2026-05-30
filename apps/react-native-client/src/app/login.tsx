import React from "react";
import { View, StyleSheet } from "react-native";
import { LoginForm } from "../features/auth";

export default function Login() {
    return (
        <View style={styles.container}>
            <LoginForm />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
});
