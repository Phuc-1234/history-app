import React, { useState } from "react";
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    TextInputProps,
    StyleProp,
    ViewStyle,
} from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import colors from "../theme/colors";
import typography from "../theme/typography";

interface InputProps extends TextInputProps {
    icon?: React.ElementType;
    isPassword?: boolean;
    containerStyle?: StyleProp<ViewStyle>;
}

export default function Input({
    icon: IconComponent,
    isPassword,
    containerStyle,
    style,
    ...props
}: InputProps) {
    const [secureText, setSecureText] = useState(isPassword);

    return (
        <View style={[styles.container, containerStyle]}>
            {IconComponent && (
                <View style={styles.iconLeft}>
                    <IconComponent size={20} color={colors.textPlaceholder} />
                </View>
            )}

            <TextInput
                style={[
                    styles.input,
                    IconComponent && { paddingLeft: 58 },
                    isPassword && { paddingRight: 58 },
                    style,
                ]}
                placeholderTextColor={colors.textPlaceholder}
                secureTextEntry={secureText}
                autoCapitalize="none"
                {...props}
            />

            {isPassword && (
                <TouchableOpacity
                    onPress={() => setSecureText(!secureText)}
                    style={styles.iconRight}
                    activeOpacity={0.7}
                >
                    {secureText ? (
                        <Eye size={20} color={colors.textPlaceholder} />
                    ) : (
                        <EyeOff size={20} color={colors.textPlaceholder} />
                    )}
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        position: "relative",
        marginVertical: 8,
    },
    input: {
        fontFamily: typography.fonts.regular,
        backgroundColor: colors.inputBackground,
        borderRadius: 30,
        paddingLeft: 24,
        paddingRight: 24,
        fontSize: 16,
        color: colors.textDark,
        height: 54,
        textAlignVertical: "center",
    },
    iconLeft: {
        position: "absolute",
        left: 24,
        top: 0,
        bottom: 0,
        justifyContent: "center",
        zIndex: 1,
    },
    iconRight: {
        position: "absolute",
        right: 20,
        top: 0,
        bottom: 0,
        justifyContent: "center",
        zIndex: 1,
    },
});
