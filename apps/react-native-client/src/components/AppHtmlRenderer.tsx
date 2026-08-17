import React, { useMemo } from "react";
import {
    StyleSheet,
    View,
    Platform,
    useWindowDimensions,
    StyleProp,
    ViewStyle,
} from "react-native";
import RenderHtml, {
    TNodeChildrenRenderer,
    MixedStyleDeclaration,
} from "react-native-render-html";
import { colors } from "../theme/colors";
import typography from "../theme/typography";

export function hslToHex(h: number, s: number, l: number, a?: number): string {
    const sDec = s / 100;
    const lDec = l / 100;
    const k = (n: number) => (n + h / 30) % 12;
    const factor = sDec * Math.min(lDec, 1 - lDec);
    const f = (n: number) =>
        lDec - factor * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

    const r = Math.round(255 * f(0));
    const g = Math.round(255 * f(8));
    const b = Math.round(255 * f(4));

    const rHex = Math.max(0, Math.min(255, r)).toString(16).padStart(2, "0");
    const gHex = Math.max(0, Math.min(255, g)).toString(16).padStart(2, "0");
    const bHex = Math.max(0, Math.min(255, b)).toString(16).padStart(2, "0");

    if (a !== undefined && !isNaN(a)) {
        const aAlpha = Math.max(0, Math.min(1, a));
        const aHex = Math.round(aAlpha * 255).toString(16).padStart(2, "0");
        return `#${rHex}${gHex}${bHex}${aHex}`;
    }
    return `#${rHex}${gHex}${bHex}`;
}

export function convertHslInHtml(html: string): string {
    if (!html) return "";
    return html.replace(
        /hsla?\(\s*(\d+(?:\.\d+)?)(?:deg)?\s*[\s,]+\s*(\d+(?:\.\d+)?)%\s*[\s,]+\s*(\d+(?:\.\d+)?)%(?:\s*[\s,\/]+\s*(\d+(?:\.\d+)?%?))?\s*\)/gi,
        (_match, hStr, sStr, lStr, aStr) => {
            const h = parseFloat(hStr);
            const s = parseFloat(sStr);
            const l = parseFloat(lStr);
            let a: number | undefined = undefined;
            if (aStr) {
                a = aStr.endsWith("%") ? parseFloat(aStr) / 100 : parseFloat(aStr);
            }
            return hslToHex(h, s, l, a);
        }
    );
}

export function preprocessHtml(html: string): string {
    if (!html) return "";
    let processed = html;

    // 1. Convert <font color="..."> and <font size="..."> to style
    processed = processed.replace(
        /<font\s+([^>]*?)color=["']([^"']+)["']([^>]*?)>/gi,
        '<span $1style="color:$2;"$3>'
    );
    processed = processed.replace(/<\/font>/gi, "</span>");

    // 2. Convert align="..." HTML attribute to inline style text-align
    processed = processed.replace(
        /<([a-z1-6]+)\s+([^>]*?)align=["'](center|right|left|justify)["']([^>]*?)>/gi,
        '<$1 $2style="text-align:$3;" $4>'
    );

    // 3. Convert shorthand background: to background-color: in inline style attributes
    processed = processed.replace(/style=(["'])(.*?)\1/gi, (_match, quote, styleContent) => {
        const updatedStyle = styleContent.replace(
            /(^|;|\s*)background\s*:\s*([^;]+)/gi,
            "$1background-color:$2"
        );
        return `style=${quote}${updatedStyle}${quote}`;
    });

    // 4. Convert HSL/HSLA to Hex
    processed = convertHslInHtml(processed);

    return processed;
}

export function extractInlineStyles(styleAttr?: string): Record<string, any> | null {
    if (!styleAttr) return null;
    const res: Record<string, any> = {};
    const declarations = styleAttr.split(";");

    for (const decl of declarations) {
        const colonIdx = decl.indexOf(":");
        if (colonIdx === -1) continue;
        const key = decl.substring(0, colonIdx).trim().toLowerCase();
        const val = decl.substring(colonIdx + 1).trim();
        if (!key || !val) continue;

        if (key === "color") {
            res.color = val;
        } else if (key === "background-color" || key === "background") {
            res.backgroundColor = val;
        } else if (key === "text-align") {
            res.textAlign = val;
        } else if (key === "font-size") {
            const sizeVal = val.toLowerCase();
            if (sizeVal.endsWith("px") || sizeVal.endsWith("pt")) {
                const num = parseFloat(sizeVal);
                if (!isNaN(num) && num > 0) res.fontSize = Math.round(num);
            } else if (sizeVal.endsWith("em") || sizeVal.endsWith("rem")) {
                const num = parseFloat(sizeVal);
                if (!isNaN(num) && num > 0) res.fontSize = Math.round(num * 15);
            } else {
                const num = parseFloat(sizeVal);
                if (!isNaN(num) && num > 0) res.fontSize = Math.round(num);
            }
        } else if (key === "font-style") {
            if (val.toLowerCase() === "italic") {
                res.fontStyle = "italic";
                res.fontFamily = typography.fonts.italic;
            }
        } else if (key === "font-weight") {
            const fw = val.toLowerCase();
            if (fw === "bold" || fw === "bolder" || parseInt(fw, 10) >= 600) {
                res.fontFamily = typography.fonts.bold;
                res.fontWeight = "bold";
            }
        } else if (key === "text-decoration" || key === "text-decoration-line") {
            const td = val.toLowerCase();
            if (td.includes("underline")) res.textDecorationLine = "underline";
            else if (td.includes("line-through")) res.textDecorationLine = "line-through";
        }
    }

    return Object.keys(res).length > 0 ? res : null;
}

const defaultTagsStyles: Record<string, MixedStyleDeclaration> = {
    p: {
        marginTop: 0,
        marginBottom: 8,
    },
    a: {
        color: colors.primary,
        textDecorationLine: "underline",
    },
    li: {
        fontFamily: typography.fonts.regular,
        fontSize: 15,
        lineHeight: 22,
    },
    strong: {
        fontFamily: typography.fonts.bold,
        fontWeight: "bold",
    },
    b: {
        fontFamily: typography.fonts.bold,
        fontWeight: "bold",
    },
    i: {
        fontFamily: typography.fonts.italic,
        fontStyle: "italic",
    },
    em: {
        fontFamily: typography.fonts.italic,
        fontStyle: "italic",
    },
    u: {
        textDecorationLine: "underline",
    },
    s: {
        textDecorationLine: "line-through",
    },
    del: {
        textDecorationLine: "line-through",
    },
    strike: {
        textDecorationLine: "line-through",
    },
    mark: {
        backgroundColor: "#ffe066",
    },
    th: {
        fontFamily: typography.fonts.bold,
        fontWeight: "bold",
    },
    h1: {
        fontFamily: typography.fonts.extraBold,
        fontSize: 20,
        marginBottom: 6,
    },
    h2: {
        fontFamily: typography.fonts.bold,
        fontSize: 18,
        marginBottom: 6,
    },
    h3: {
        fontFamily: typography.fonts.bold,
        fontSize: 16,
        marginBottom: 4,
    },
    blockquote: {
        borderLeftWidth: 3,
        borderLeftColor: colors.primary,
        paddingLeft: 10,
        marginVertical: 6,
        fontStyle: "italic",
    },
    code: {
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
        backgroundColor: colors.surfaceVariant,
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
        fontSize: 13,
    },
};

const defaultClassesStyles: Record<string, MixedStyleDeclaration> = {
    "text-tiny": {
        fontSize: 10,
        lineHeight: 14,
    },
    "text-small": {
        fontSize: 13,
        lineHeight: 18,
    },
    "text-big": {
        fontSize: 20,
        lineHeight: 28,
    },
    "text-huge": {
        fontSize: 24,
        lineHeight: 34,
    },
    "text-align-center": { textAlign: "center" },
    "text-align-right": { textAlign: "right" },
    "text-align-left": { textAlign: "left" },
    "text-align-justify": { textAlign: "justify" },
    "ql-align-center": { textAlign: "center" },
    "ql-align-right": { textAlign: "right" },
    "ql-align-left": { textAlign: "left" },
    "ql-align-justify": { textAlign: "justify" },
    "text-center": { textAlign: "center" },
    "text-right": { textAlign: "right" },
    "text-left": { textAlign: "left" },
    "text-justify": { textAlign: "justify" },
    "marker-yellow": { backgroundColor: "#ffe066" },
    "marker-green": { backgroundColor: "#a2f4bf" },
    "marker-pink": { backgroundColor: "#ffc0cb" },
    "marker-blue": { backgroundColor: "#a0c4ff" },
    "pen-red": { color: "#e63946" },
    "pen-green": { color: "#2a9d8f" },
};

const defaultRenderers = {
    p: ({ tnode, style, TDefaultRenderer, ...props }: any) => {
        const extracted = extractInlineStyles(tnode.attributes?.style);
        const inlineAlign = extracted?.textAlign || tnode.attributes?.align;
        const textAlign = inlineAlign || style?.textAlign;

        let extraStyle: any = null;
        if (textAlign === "center") {
            extraStyle = { width: "100%", alignItems: "center", textAlign: "center" };
        } else if (textAlign === "right") {
            extraStyle = { width: "100%", alignItems: "flex-end", textAlign: "right" };
        } else if (textAlign === "left") {
            extraStyle = { width: "100%", alignItems: "flex-start", textAlign: "left" };
        } else if (textAlign === "justify") {
            extraStyle = { width: "100%", textAlign: "justify" };
        }

        return (
            <TDefaultRenderer
                tnode={tnode}
                style={[style, extraStyle, extracted].filter(Boolean)}
                {...props}
            />
        );
    },
    div: ({ tnode, style, TDefaultRenderer, ...props }: any) => {
        const extracted = extractInlineStyles(tnode.attributes?.style);
        const inlineAlign = extracted?.textAlign || tnode.attributes?.align;
        const textAlign = inlineAlign || style?.textAlign;

        let extraStyle: any = null;
        if (textAlign === "center") {
            extraStyle = { width: "100%", alignItems: "center", textAlign: "center" };
        } else if (textAlign === "right") {
            extraStyle = { width: "100%", alignItems: "flex-end", textAlign: "right" };
        } else if (textAlign === "left") {
            extraStyle = { width: "100%", alignItems: "flex-start", textAlign: "left" };
        } else if (textAlign === "justify") {
            extraStyle = { width: "100%", textAlign: "justify" };
        }

        return (
            <TDefaultRenderer
                tnode={tnode}
                style={[style, extraStyle, extracted].filter(Boolean)}
                {...props}
            />
        );
    },
    figure: ({ tnode, style, TDefaultRenderer, ...props }: any) => {
        const inlineAlign =
            tnode.attributes?.style?.match(/text-align\s*:\s*(center|right|left|justify)/i)?.[1]
            || tnode.attributes?.align;
        const textAlign = inlineAlign || style?.textAlign;

        let extraStyle: any = null;
        if (textAlign === "center") {
            extraStyle = { width: "100%", alignItems: "center" };
        } else if (textAlign === "right") {
            extraStyle = { width: "100%", alignItems: "flex-end" };
        }

        return (
            <TDefaultRenderer
                tnode={tnode}
                style={extraStyle ? [style, extraStyle] : style}
                {...props}
            />
        );
    },
    span: ({ tnode, style, TDefaultRenderer, ...props }: any) => {
        const extracted = extractInlineStyles(tnode.attributes?.style);
        if (extracted) {
            return (
                <TDefaultRenderer
                    tnode={tnode}
                    style={[style, extracted]}
                    {...props}
                />
            );
        }
        return <TDefaultRenderer tnode={tnode} style={style} {...props} />;
    },
    mark: ({ tnode, style, TDefaultRenderer, ...props }: any) => {
        const extracted = extractInlineStyles(tnode.attributes?.style);
        const markStyle = { backgroundColor: "#ffe066", ...extracted };
        return (
            <TDefaultRenderer
                tnode={tnode}
                style={[style, markStyle]}
                {...props}
            />
        );
    },
    table: ({ tnode }: any) => (
        <View style={styles.table}>
            <TNodeChildrenRenderer tnode={tnode} />
        </View>
    ),
    tbody: ({ tnode }: any) => (
        <View style={styles.tbody}>
            <TNodeChildrenRenderer tnode={tnode} />
        </View>
    ),
    tr: ({ tnode }: any) => (
        <View style={styles.tr}>
            <TNodeChildrenRenderer tnode={tnode} />
        </View>
    ),
    td: ({ tnode }: any) => {
        const extracted = extractInlineStyles(tnode.attributes?.style);
        return (
            <View style={[styles.td, extracted]}>
                <TNodeChildrenRenderer tnode={tnode} />
            </View>
        );
    },
    th: ({ tnode }: any) => {
        const extracted = extractInlineStyles(tnode.attributes?.style);
        return (
            <View style={[styles.td, styles.th, extracted]}>
                <TNodeChildrenRenderer tnode={tnode} />
            </View>
        );
    },
};

export interface AppHtmlRendererProps {
    html: string;
    contentWidth?: number;
    baseStyle?: MixedStyleDeclaration;
    tagsStyles?: Record<string, MixedStyleDeclaration>;
    classesStyles?: Record<string, MixedStyleDeclaration>;
    renderers?: Record<string, any>;
    containerStyle?: StyleProp<ViewStyle>;
    defaultTextProps?: any;
}

export function AppHtmlRenderer({
    html,
    contentWidth,
    baseStyle,
    tagsStyles,
    classesStyles,
    renderers,
    containerStyle,
    defaultTextProps,
}: AppHtmlRendererProps) {
    const { width } = useWindowDimensions();
    const resolvedWidth = contentWidth ?? (width - 40);

    const processedHtml = useMemo(() => {
        return preprocessHtml(html || "");
    }, [html]);

    const mergedBaseStyle = useMemo<MixedStyleDeclaration>(() => ({
        fontFamily: typography.fonts.regular,
        color: colors.textSecondary,
        fontSize: 16,
        lineHeight: 24,
        ...baseStyle,
    }), [baseStyle]);

    const mergedTagsStyles = useMemo(() => ({
        ...defaultTagsStyles,
        ...tagsStyles,
    }), [tagsStyles]);

    const mergedClassesStyles = useMemo(() => ({
        ...defaultClassesStyles,
        ...classesStyles,
    }), [classesStyles]);

    const mergedRenderers = useMemo(() => ({
        ...defaultRenderers,
        ...renderers,
    }), [renderers]);

    if (!processedHtml || !processedHtml.trim()) {
        return null;
    }

    return (
        <View style={containerStyle}>
            <RenderHtml
                contentWidth={resolvedWidth}
                source={{ html: processedHtml }}
                baseStyle={mergedBaseStyle}
                tagsStyles={mergedTagsStyles}
                classesStyles={mergedClassesStyles}
                renderers={mergedRenderers}
                defaultTextProps={defaultTextProps}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    table: {
        borderWidth: 1,
        borderColor: colors.borderMedium,
        borderRadius: 4,
        overflow: "hidden",
        marginVertical: 12,
        backgroundColor: colors.surface,
    },
    tbody: {
        flexDirection: "column",
    },
    tr: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: colors.borderMedium,
    },
    td: {
        flex: 1,
        padding: 10,
        justifyContent: "center",
        borderRightWidth: 1,
        borderRightColor: colors.borderMedium,
    },
    th: {
        backgroundColor: colors.surfaceVariant,
    },
});

export default AppHtmlRenderer;
