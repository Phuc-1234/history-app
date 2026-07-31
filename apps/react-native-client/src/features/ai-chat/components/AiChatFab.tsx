import React from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import { useAiChatFab } from "../hooks/useAiChatFab";

interface AiChatFabProps {
    onPress: () => void;
}

export const AiChatFab: React.FC<AiChatFabProps> = ({ onPress }) => {
    const { pan, panResponder, insets } = useAiChatFab({ onPress });

    return (
        <Animated.View
            {...panResponder.panHandlers}
            style={[
                styles.fabContainer,
                {
                    bottom: 120 + insets.bottom,
                    transform: pan.getTranslateTransform(),
                },
            ]}
        >
            <View style={styles.fabInner}>
                <Ionicons name="sparkles" size={24} color="#FFF" />
            </View>
        </Animated.View>
    );
};


const styles = StyleSheet.create({
    fabContainer: {
        position: "absolute",
        right: 20,
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: colors.primary,
        zIndex: 999,
    },
    fabInner: {
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
});
