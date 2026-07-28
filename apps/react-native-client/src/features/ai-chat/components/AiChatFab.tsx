import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";

interface AiChatFabProps {
    onPress: () => void;
}

export const AiChatFab: React.FC<AiChatFabProps> = ({ onPress }) => {
    return (
        <Pressable style={styles.fabContainer} onPress={onPress}>
            <Ionicons name="sparkles" size={24} color="#FFF" />
        </Pressable>
    );
};

const styles = StyleSheet.create({
    fabContainer: {
        position: "absolute",
        bottom: 90,
        right: 20,
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
        zIndex: 999,
    },
});
