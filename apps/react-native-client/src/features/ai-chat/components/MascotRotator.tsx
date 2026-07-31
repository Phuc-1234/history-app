import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import Mascot, { MascotExpression } from "../../../components/Mascot";

interface MascotRotatorProps {
    size: number;
}

const EXPRESSIONS: MascotExpression[] = [
    "very-happy",
    "happy",
    "thinking",
    
    "confident",
    "cheering",
];

export const MascotRotator: React.FC<MascotRotatorProps> = ({ size }) => {
    const [expression, setExpression] = useState<MascotExpression>("confident");

    useEffect(() => {
        // Initial random selection
        const initialIndex = Math.floor(Math.random() * EXPRESSIONS.length);
        setExpression(EXPRESSIONS[initialIndex]);

        const intervalId = setInterval(() => {
            setExpression((prev) => {
                const choices = EXPRESSIONS.filter((exp) => exp !== prev);
                const randomIndex = Math.floor(Math.random() * choices.length);
                return choices[randomIndex];
            });
        }, 30000); // 30 seconds interval

        return () => clearInterval(intervalId);
    }, []);

    return (
        <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
            <Mascot
                expression={expression}
                width={size * 1.5}
                height={size * 1.5}
                style={{
                    transform: [{ translateY: size * 0.15 }],
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: "hidden",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "transparent",
    },
});
