import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/theme/colors";
import { typography } from "@/theme/typography";

interface AiMarkdownMessageProps {
    content: string;
    textColor?: string;
    onCloseOverlay?: () => void;
}

export const AiMarkdownMessage: React.FC<AiMarkdownMessageProps> = ({
    content,
    textColor = colors.textPrimary,
    onCloseOverlay,
}) => {
    const router = useRouter();

    const handleLinkPress = (url: string) => {
        if (onCloseOverlay) {
            onCloseOverlay();
        }

        if (url.startsWith("lesson:")) {
            const lessonId = url.replace("lesson:", "");
            router.push(`/(3_4_lessons)/lesson/${lessonId}` as any);
        } else if (url.startsWith("node:")) {
            const nodeId = url.replace("node:", "");
            router.push(`/(3_4_lessons)/lesson/node/${nodeId}` as any);
        }
    };

    // Helper to render formatted inline text (bold, italic, links)
    const renderInlineText = (text: string, baseStyle: any) => {
        // Link pattern: [Label](url)
        const linkRegex = /\[([^\]]+)\]\((lesson:\d+|node:\d+|https?:\/\/[^\)]+)\)/g;
        type InlinePart =
            | { type: "text"; value: string }
            | { type: "link"; label: string; url: string };

        const parts: InlinePart[] = [];
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = linkRegex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push({
                    type: "text",
                    value: text.substring(lastIndex, match.index),
                });
            }
            parts.push({
                type: "link",
                label: match[1],
                url: match[2],
            });
            lastIndex = linkRegex.lastIndex;
        }

        if (lastIndex < text.length) {
            parts.push({
                type: "text",
                value: text.substring(lastIndex),
            });
        }

        return parts.map((part, index) => {
            if (part.type === "link") {
                return (
                    <Text
                        key={`link-${index}`}
                        style={styles.linkText}
                        onPress={() => handleLinkPress(part.url)}
                    >
                        {part.label}
                    </Text>
                );
            }

            // Parse bold (**text**) inside normal text part
            const boldParts = part.value.split(/(\*\*[^*]+\*\*)/g);
            return (
                <Text key={`text-${index}`} style={baseStyle}>
                    {boldParts.map((bPart, bIdx) => {
                        if (bPart.startsWith("**") && bPart.endsWith("**")) {
                            return (
                                <Text key={bIdx} style={styles.boldText}>
                                    {bPart.slice(2, -2)}
                                </Text>
                            );
                        }
                        return bPart;
                    })}
                </Text>
            );
        });
    };

    // Parse block elements line-by-line
    const lines = content.split("\n");

    return (
        <View style={styles.container}>
            {lines.map((line, index) => {
                const trimmed = line.trim();
                if (!trimmed) {
                    return <View key={index} style={{ height: 6 }} />;
                }

                // Headers
                if (trimmed.startsWith("# ")) {
                    return (
                        <Text key={index} style={[styles.header1, { color: textColor }]}>
                            {renderInlineText(trimmed.replace("# ", ""), styles.header1)}
                        </Text>
                    );
                }
                if (trimmed.startsWith("## ")) {
                    return (
                        <Text key={index} style={[styles.header2, { color: textColor }]}>
                            {renderInlineText(trimmed.replace("## ", ""), styles.header2)}
                        </Text>
                    );
                }
                if (trimmed.startsWith("### ")) {
                    return (
                        <Text key={index} style={[styles.header3, { color: textColor }]}>
                            {renderInlineText(trimmed.replace("### ", ""), styles.header3)}
                        </Text>
                    );
                }

                // Bullet points
                if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                    const bulletText = trimmed.substring(2);
                    return (
                        <View key={index} style={styles.bulletRow}>
                            <Text style={[styles.bulletPoint, { color: textColor }]}>•</Text>
                            <Text style={[styles.bodyText, { color: textColor, flex: 1 }]}>
                                {renderInlineText(bulletText, [styles.bodyText, { color: textColor }])}
                            </Text>
                        </View>
                    );
                }

                // Callout/Note block (*Lưu ý: ...)
                if (trimmed.startsWith("*Lưu ý:") || trimmed.startsWith("_Lưu ý:")) {
                    return (
                        <View key={index} style={styles.noteBox}>
                            <Text style={styles.noteText}>
                                {renderInlineText(trimmed, styles.noteText)}
                            </Text>
                        </View>
                    );
                }

                // Normal Paragraph
                return (
                    <Text key={index} style={[styles.bodyText, { color: textColor }]}>
                        {renderInlineText(trimmed, [styles.bodyText, { color: textColor }])}
                    </Text>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: "100%",
    },
    bodyText: {
        fontSize: 14,
        lineHeight: 20,
        fontFamily: typography.fonts.regular,
    },
    boldText: {
        fontFamily: typography.fonts.bold,
        fontWeight: "700",
    },
    linkText: {
        color: colors.primary,
        fontFamily: typography.fonts.bold,
        textDecorationLine: "underline",
    },
    header1: {
        fontSize: 18,
        fontFamily: typography.fonts.bold,
        marginVertical: 6,
    },
    header2: {
        fontSize: 16,
        fontFamily: typography.fonts.bold,
        marginVertical: 4,
    },
    header3: {
        fontSize: 14,
        fontFamily: typography.fonts.bold,
        marginVertical: 2,
    },
    bulletRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginVertical: 2,
        paddingLeft: 4,
    },
    bulletPoint: {
        fontSize: 14,
        marginRight: 6,
    },
    noteBox: {
        backgroundColor: "rgba(255, 184, 0, 0.12)",
        borderLeftWidth: 3,
        borderLeftColor: colors.warning,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        marginVertical: 6,
    },
    noteText: {
        fontSize: 12,
        color: colors.textSecondary,
        fontStyle: "italic",
    },
});
