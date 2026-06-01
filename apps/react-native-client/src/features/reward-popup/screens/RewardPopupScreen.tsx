import React, { useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import RewardPopup from "../components/RewardPopup";
import { mockRewardData } from "../data/mockRewardData";

const text = {
    title: "Popup XP, cap do va phan thuong",
    description: "Nut demo nay tam thay cho icon lua tren top bar. Bam vao de mo hop thoai cap bac.",
    button: "Mo popup cap do",
};

export default function RewardPopupScreen() {
    const [visible, setVisible] = useState(false);

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.demoHeader}>
                <Text style={styles.demoTitle}>{text.title}</Text>
                <Text style={styles.demoDescription}>{text.description}</Text>
                <Pressable style={styles.openButton} onPress={() => setVisible(true)}>
                    <Text style={styles.openButtonIcon}>??</Text>
                    <Text style={styles.openButtonText}>{text.button}</Text>
                </Pressable>
            </View>

            <RewardPopup
                visible={visible}
                data={mockRewardData}
                onClose={() => setVisible(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        minHeight: "100%",
        width: "100%",
        backgroundColor: "#E8EBF2",
        paddingHorizontal: 24,
        paddingTop: 72,
    },
    demoHeader: {
        width: "100%",
        padding: 20,
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E0DDEA",
        shadowColor: "#1F1A2E",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
        elevation: 3,
    },
    demoTitle: {
        color: "#1D1B18",
        fontSize: 22,
        lineHeight: 30,
        fontWeight: "700",
    },
    demoDescription: {
        color: "#474555",
        fontSize: 15,
        lineHeight: 22,
        marginTop: 8,
        marginBottom: 20,
    },
    openButton: {
        minHeight: 52,
        borderRadius: 999,
        backgroundColor: "#FF9A44",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
        paddingHorizontal: 18,
    },
    openButtonIcon: {
        fontSize: 18,
    },
    openButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
});
