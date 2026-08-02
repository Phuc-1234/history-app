import React from "react";
import { Animated, StyleSheet, View } from "react-native";
import { colors } from "@/theme/colors";
import { useAiChatFab } from "../hooks/useAiChatFab";
import { MascotRotator } from "./MascotRotator";
import { TwinklingStars } from "./TwinklingStars";

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
                <MascotRotator size={42} />
                <TwinklingStars mode="fab" />
            </View>
        </Animated.View>
    );
};


const styles = StyleSheet.create({
    fabContainer: {
        position: "absolute",
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: colors.textLight,
        backgroundColor: colors.primary,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999,
        overflow: "visible",
    },
    fabInner: {
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
    },
});
