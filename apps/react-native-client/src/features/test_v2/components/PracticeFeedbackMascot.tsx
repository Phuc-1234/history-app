import React from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import Mascot from "../../../components/Mascot";

interface PracticeFeedbackMascotProps {
    isCorrect: boolean;
    size?: number;
    style?: StyleProp<ViewStyle>;
}

/**
 * Component hiển thị Mascot phản hồi biểu cảm tức thì khi người dùng
 * làm câu hỏi ở chế độ PRACTICE (Đúng / Sai).
 */
export default function PracticeFeedbackMascot({
    isCorrect,
    size = 54,
    style,
}: PracticeFeedbackMascotProps) {
    const expression = isCorrect ? "tuyet-voi" : "boi-roi";

    return (
        <View style={[styles.container, style]}>
            <Mascot
                expression={expression}
                width={size}
                height={size}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
    },
});
