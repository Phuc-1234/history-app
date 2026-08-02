import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/theme/colors";
import { typography } from "@/theme/typography";

interface AiMarkdownMessageProps {
    content: string;
    textColor?: string;
    onCloseOverlay?: () => void;
    selectable?: boolean;
}

export const AiMarkdownMessage: React.FC<AiMarkdownMessageProps> = ({
    content,
    textColor = colors.textPrimary,
    onCloseOverlay,
    selectable = true,
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

            // Parse bold (**text**), italic (*text* or _text_), and standalone tags ([tag]) inside normal text part
            const tokens = part.value.split(/(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|\[[^\]]+\])/g);
            return (
                <Text key={`text-${index}`} style={baseStyle}>
                    {tokens.map((tPart, tIdx) => {
                        if (tPart.startsWith("**") && tPart.endsWith("**")) {
                            return (
                                <Text key={tIdx} style={styles.boldText}>
                                    {tPart.slice(2, -2)}
                                </Text>
                            );
                        }
                        if (
                            (tPart.startsWith("*") && tPart.endsWith("*") && tPart.length > 2) ||
                            (tPart.startsWith("_") && tPart.endsWith("_") && tPart.length > 2)
                        ) {
                            return (
                                <Text key={tIdx} style={styles.italicText}>
                                    {tPart.slice(1, -1)}
                                </Text>
                            );
                        }
                        if (tPart.startsWith("[") && tPart.endsWith("]") && tPart.length > 2) {
                            return (
                                <Text key={tIdx} style={styles.tagBadge}>
                                    {tPart.slice(1, -1)}
                                </Text>
                            );
                        }
                        return tPart;
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
                        <Text key={index} selectable={selectable} style={[styles.header1, { color: textColor }]}>
                            {renderInlineText(trimmed.replace("# ", ""), styles.header1)}
                        </Text>
                    );
                }
                if (trimmed.startsWith("## ")) {
                    return (
                        <Text key={index} selectable={selectable} style={[styles.header2, { color: textColor }]}>
                            {renderInlineText(trimmed.replace("## ", ""), styles.header2)}
                        </Text>
                    );
                }
                if (trimmed.startsWith("### ")) {
                    return (
                        <Text key={index} selectable={selectable} style={[styles.header3, { color: textColor }]}>
                            {renderInlineText(trimmed.replace("### ", ""), styles.header3)}
                        </Text>
                    );
                }

                // Task list items (- [ ] or - [x])
                if (trimmed.startsWith("- [ ] ") || trimmed.startsWith("- [x] ") || trimmed.startsWith("- [X] ")) {
                    const isChecked = trimmed.startsWith("- [x] ") || trimmed.startsWith("- [X] ");
                    const taskText = trimmed.substring(6);
                    return (
                        <View key={index} style={styles.bulletRow}>
                            <Text style={[styles.bulletPoint, { color: textColor }]}>
                                {isChecked ? "☑" : "☐"}
                            </Text>
                            <Text selectable={selectable} style={[styles.bodyText, { color: textColor, flex: 1 }]}>
                                {renderInlineText(taskText, [styles.bodyText, { color: textColor }])}
                            </Text>
                        </View>
                    );
                }

                // Bullet points
                if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                    const bulletText = trimmed.substring(2);
                    return (
                        <View key={index} style={styles.bulletRow}>
                            <Text style={[styles.bulletPoint, { color: textColor }]}>•</Text>
                            <Text selectable={selectable} style={[styles.bodyText, { color: textColor, flex: 1 }]}>
                                {renderInlineText(bulletText, [styles.bodyText, { color: textColor }])}
                            </Text>
                        </View>
                    );
                }

                // Blockquote / Callout note block (> ...)
                if (trimmed.startsWith(">")) {
                    const quoteText = trimmed.replace(/^>\s*/, "");
                    return (
                        <View key={index} style={styles.noteBox}>
                            <Text selectable={selectable} style={styles.noteText}>
                                {renderInlineText(quoteText, styles.noteText)}
                            </Text>
                        </View>
                    );
                }

                // Callout/Note block (*Lưu ý: ...)
                if (trimmed.startsWith("*Lưu ý:") || trimmed.startsWith("_Lưu ý:")) {
                    return (
                        <View key={index} style={styles.noteBox}>
                            <Text selectable={selectable} style={styles.noteText}>
                                {renderInlineText(trimmed, styles.noteText)}
                            </Text>
                        </View>
                    );
                }

                // Normal Paragraph
                return (
                    <Text key={index} selectable={selectable} style={[styles.bodyText, { color: textColor }]}>
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
    },
    italicText: {
        fontFamily: typography.fonts.italic,
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
        fontFamily: typography.fonts.regular,
        fontSize: 14,
        marginRight: 6,
    },
    noteBox: {
        backgroundColor: colors.warningContainer,
        borderLeftWidth: 3,
        borderLeftColor: colors.warning,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        marginVertical: 6,
    },
    noteText: {
        fontFamily: typography.fonts.italic,
        fontSize: 12,
        color: colors.textSecondary,
    },
    tagBadge: {
        fontFamily: typography.fonts.semiBold,
        color: colors.primary,
        backgroundColor: colors.secondaryContainer,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        fontSize: 12,
        overflow: "hidden",
    },
});
