import React from "react";
import { Image, ImageStyle, StyleProp, StyleSheet, DimensionValue } from "react-native";

// Các biểu cảm hỗ trợ bằng cả Tiếng Anh và Tiếng Việt
export type MascotExpression =
    | "very-happy" | "rat-vui" | "tuyet-voi"
    | "happy" | "vui" | "hoi-vui"
    | "sad" | "buon" | "that-vong"
    | "confused" | "boi-roi"
    | "thinking" | "suy-nghi"
    | "focused" | "tap-trung"
    | "confident" | "tu-tin"
    | "cheering" | "co-len"
    | "neutral";

export interface MascotEvent {
    type: "finish-test" | "complete-flashcard" | "login" | "error";
    score?: number;         // Điểm số bài thi (hệ 10 hoặc hệ 100)
    total?: number;         // Tổng số câu hỏi
    correctRatio?: number;  // Tỷ lệ câu trả lời đúng (từ 0 đến 1.0)
}

interface MascotProps {
    expression?: MascotExpression;
    event?: MascotEvent;
    width?: DimensionValue;
    height?: DimensionValue;
    style?: StyleProp<ImageStyle>;
}

// Định nghĩa tĩnh các require để Metro Bundler có thể đóng gói tài nguyên chính xác
const EXPRESSIONS: Record<MascotExpression, any> = {
    "very-happy": require("../../assets/images/mascot/aLong_ratvui.png"),
    "rat-vui": require("../../assets/images/mascot/aLong_ratvui.png"),
    "tuyet-voi": require("../../assets/images/mascot/aLong_tuyetvoi.png"),
    "happy": require("../../assets/images/mascot/aLong_hoivui.png"),
    "vui": require("../../assets/images/mascot/aLong_hoivui.png"),
    "hoi-vui": require("../../assets/images/mascot/aLong_hoivui.png"),
    "sad": require("../../assets/images/mascot/aLong_buon.png"),
    "buon": require("../../assets/images/mascot/aLong_buon.png"),
    "that-vong": require("../../assets/images/mascot/aLong_thatvong.png"),
    "confused": require("../../assets/images/mascot/aLong_boiroi.png"),
    "boi-roi": require("../../assets/images/mascot/aLong_boiroi.png"),
    "thinking": require("../../assets/images/mascot/aLong_suynghi.png"),
    "suy-nghi": require("../../assets/images/mascot/aLong_suynghi.png"),
    "focused": require("../../assets/images/mascot/aLong_taptrung.png"),
    "tap-trung": require("../../assets/images/mascot/aLong_taptrung.png"),
    "confident": require("../../assets/images/mascot/aLong_tutin.png"),
    "tu-tin": require("../../assets/images/mascot/aLong_tutin.png"),
    "cheering": require("../../assets/images/mascot/aLong_colen.png"),
    "co-len": require("../../assets/images/mascot/aLong_colen.png"),
    "neutral": require("../../assets/images/mascot/aLong_tutin.png"), // Tự tin làm biểu cảm mặc định
};

export default function Mascot({
    expression,
    event,
    width = 150,
    height = 150,
    style,
}: MascotProps) {
    let selectedExpression: MascotExpression = "neutral";

    if (expression) {
        selectedExpression = expression;
    } else if (event) {
        if (event.type === "finish-test") {
            const score = event.score ?? 0;
            // Chuẩn hóa điểm về hệ 100 nếu điểm truyền vào dạng hệ 10 (ví dụ 8.5 -> 85)
            const normalizedScore = score <= 10 ? score * 10 : score;
            
            if (normalizedScore >= 80) {
                // Điểm giỏi/xuất sắc (>= 80% hoặc >= 8.0/10)
                selectedExpression = "tuyet-voi";
            } else if (normalizedScore >= 50) {
                // Điểm trung bình/khá (>= 50% hoặc >= 5.0/10)
                selectedExpression = "happy";
            } else {
                // Điểm yếu (< 50% hoặc < 5.0/10)
                selectedExpression = "sad";
            }
        } else if (event.type === "complete-flashcard") {
            const ratio = event.correctRatio ?? 1.0;
            if (ratio >= 0.8) {
                selectedExpression = "very-happy";
            } else if (ratio >= 0.5) {
                selectedExpression = "happy";
            } else {
                selectedExpression = "sad";
            }
        } else if (event.type === "login") {
            selectedExpression = "happy";
        } else if (event.type === "error") {
            selectedExpression = "confused";
        }
    }

    const source = EXPRESSIONS[selectedExpression] || EXPRESSIONS["neutral"];

    return (
        <Image
            source={source}
            style={[
                styles.mascot,
                { width: width, height: height },
                style
            ]}
            resizeMode="contain"
        />
    );
}

const styles = StyleSheet.create({
    mascot: {
        alignSelf: "center",
    },
});
