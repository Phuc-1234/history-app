import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View, TouchableOpacity } from "react-native";
import { X, Type } from "lucide-react-native";
import { FillInBlankQuestion as FillInBlankQuestionType } from "../types";


interface Props {
    question: FillInBlankQuestionType;
    value: string | undefined;
    onChange: (text: string) => void;
    disabled?: boolean;
}

export default function FillInBlankQuestion({
    question,
    value = "",
    onChange,
    disabled = false
}: Props) {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={styles.container}>
            <Text style={styles.questionText}>{question.text}</Text>

            <View style={styles.inputOuterContainer}>
                <View
                    style={[
                        styles.inputWrapper,
                        isFocused && styles.inputWrapperFocused,
                        disabled && styles.inputWrapperDisabled
                    ]}
                >
                    <View style={styles.iconContainer}>
                        <Type size={20} color={isFocused ? "#5D45F9" : "#A0AEC0"} />
                    </View>

                    <TextInput
                        style={styles.textInput}
                        value={value}
                        onChangeText={onChange}
                        placeholder={question.placeholder || "Nhập câu trả lời của bạn..."}
                        placeholderTextColor="#A0AEC0"
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        editable={!disabled}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    {value.length > 0 && !disabled && (
                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={() => onChange("")}
                            activeOpacity={0.6}
                        >
                            <X size={16} color="#718096" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <Text style={styles.helperText}>
                * Vui lòng nhập câu trả lời chính xác, hệ thống sẽ tự động đối chiếu không phân biệt chữ hoa/chữ thường.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        paddingVertical: 10,
    },
    questionText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1A202C",
        lineHeight: 26,
        marginBottom: 28,
    },
    inputOuterContainer: {
        width: "100%",
        marginBottom: 20,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderWidth: 1.5,
        borderColor: "#E2E8F0",
        borderRadius: 20,
        paddingHorizontal: 16,
        height: 60,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
    },
    inputWrapperFocused: {
        borderColor: "#5D45F9",
        shadowColor: "#5D45F9",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    inputWrapperDisabled: {
        backgroundColor: "#F7FAFC",
        borderColor: "#E2E8F0",
        opacity: 0.8,
    },
    iconContainer: {
        marginRight: 12,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: "600",
        color: "#2D3748",
        height: "100%",
        paddingVertical: 0,
    },
    clearButton: {
        padding: 6,
        backgroundColor: "#EDF2F7",
        borderRadius: 100,
        marginLeft: 8,
    },
    helperText: {
        fontSize: 12,
        color: "#718096",
        lineHeight: 18,
        fontWeight: "500",
        paddingHorizontal: 4,
    },
});
