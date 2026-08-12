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
        } else if (url.startsWith("grade:")) {
            const grade = url.replace("grade:", "");
            router.push({
                pathname: "/(3_4_lessons)/lesson_menu",
                params: { grade },
            } as any);
        }
    };

    // Helper to render formatted inline text (bold, italic, links)
    const renderInlineText = (text: string, baseStyle: any): React.ReactNode => {
        // Link pattern: [Label](url)
        // Bold: **text**
        // Italic: *text* or _text_
        // Tag Badge: [tag]
        const tokenRegex = /(\[.+?\]\((?:lesson:\d+|node:\d+|grade:\d+|https?:\/\/[^\)]+)\)|\*\*.+?\*\*|\*.+?\*|_.+?_|\[.+?\])/g;

        const parts = text.split(tokenRegex);

        return parts.map((part, index) => {
            if (index % 2 === 0) {
                return part ? part : null;
            }

            // Link: [Label](url)
            if (part.startsWith("[") && part.includes("](") && part.endsWith(")")) {
                const labelStart = 1;
                const labelEnd = part.indexOf("](");
                const label = part.substring(labelStart, labelEnd);
                const url = part.substring(labelEnd + 2, part.length - 1);

                return (
                    <Text
                        key={`link-${index}`}
                        style={styles.linkText}
                        onPress={() => handleLinkPress(url)}
                    >
                        {renderInlineText(label, styles.linkText)}
                    </Text>
                );
            }

            // Bold: **text**
            if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
                const innerText = part.slice(2, -2);
                return (
                    <Text key={`bold-${index}`} style={styles.boldText}>
                        {renderInlineText(innerText, [baseStyle, styles.boldText])}
                    </Text>
                );
            }

            // Italic: *text* or _text_
            if (
                ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) &&
                part.length > 2
            ) {
                const innerText = part.slice(1, -1);
                return (
                    <Text key={`italic-${index}`} style={styles.italicText}>
                        {renderInlineText(innerText, [baseStyle, styles.italicText])}
                    </Text>
                );
            }

            // Tag Badge: [tag]
            if (part.startsWith("[") && part.endsWith("]") && part.length > 2) {
                const innerText = part.slice(1, -1);
                return (
                    <Text key={`tag-${index}`} style={styles.tagBadge}>
                        {renderInlineText(innerText, styles.tagBadge)}
                    </Text>
                );
            }

            return part;
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
