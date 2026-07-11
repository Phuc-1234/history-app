import React, { useEffect, useMemo, useRef } from "react";
import { G, Rect, Circle, Text as SvgText, Line } from "react-native-svg";
import Animated, {
    interpolate,
    useAnimatedProps,
    useSharedValue,
    withDelay,
    withSpring,
    type SharedValue,
} from "react-native-reanimated";
import type { LayoutNode } from "../types";
import { animationConfig, NODE_CONFIGS } from "../constants";
import { charsPerLine, wrapText } from "../utils/layout";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";

const AnimatedG = Animated.createAnimatedComponent(G);

// Fixed letter spacing for a clean, evenly-spaced look across all cards.
const FIXED_LETTER_SPACING = 2;

interface NodeCardProps {
    node: LayoutNode;
    // Shared value so dim/highlight runs on the UI thread without re-rendering JS.
    activeNodeId: SharedValue<string | null>;
    // SharedValue so updating the map center (on expand/collapse) doesn't
    // re-render this component. Only used for the entry fly-in animation.
    center: SharedValue<{ x: number; y: number }>;
    animateEntry?: boolean;
}

function getStableDelay(id: string, depth: number) {
    let hash = 0;
    for (let i = 0; i < id.length; i += 1) {
        hash = (hash * 31 + id.charCodeAt(i)) % 997;
    }
    return (
        animationConfig.nodeBaseDelay +
        depth * animationConfig.nodeDepthDelay +
        (hash % 8) * animationConfig.nodeSiblingDelay
    );
}

function CollapseIcon({
    x,
    y,
    color,
    collapsed,
    size,
}: {
    x: number;
    y: number;
    color: string;
    collapsed: boolean;
    size: number;
}) {
    return (
        <G>
            <Circle cx={x} cy={y} r={size} fill={color} opacity={0.16} />
            <Line
                x1={x - size * 0.38}
                y1={y}
                x2={x + size * 0.38}
                y2={y}
                stroke={color}
                strokeWidth={1.8}
                strokeLinecap="round"
            />
            {collapsed && (
                <Line
                    x1={x}
                    y1={y - size * 0.38}
                    x2={x}
                    y2={y + size * 0.38}
                    stroke={color}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                />
            )}
        </G>
    );
}

// Custom memo comparator: layoutTree rebuilds every LayoutNode as a NEW object
// on each expand/collapse, so the default React.memo (shallow ref compare) would
// re-render the entire tree every time. We deep-compare only the fields this
// card actually reads.
function areNodePropsEqual(prev: NodeCardProps, next: NodeCardProps): boolean {
    const a = prev.node;
    const b = next.node;
    if (a === b) return true;
    if (
        prev.activeNodeId !== next.activeNodeId ||
        prev.center !== next.center ||
        prev.animateEntry !== next.animateEntry
    ) {
        return false;
    }
    if (
        a.id !== b.id ||
        a.x !== b.x ||
        a.y !== b.y ||
        a.width !== b.width ||
        a.height !== b.height ||
        a.depth !== b.depth ||
        a.parentId !== b.parentId ||
        a.label !== b.label ||
        a.color !== b.color ||
        a.borderColor !== b.borderColor ||
        a.accentColor !== b.accentColor ||
        a.lightBg !== b.lightBg ||
        a.collapsed !== b.collapsed
    ) {
        return false;
    }
    const ca = a.childIds;
    const cb = b.childIds;
    if (ca.length !== cb.length) return false;
    for (let i = 0; i < ca.length; i += 1) {
        if (ca[i] !== cb[i]) return false;
    }
    return true;
}

export const NodeCard = React.memo(function NodeCard({
    node,
    center,
    activeNodeId,
    animateEntry = true,
}: NodeCardProps) {
    const enter = useSharedValue(0);
    const didEnter = useRef(false);

    const config =
        NODE_CONFIGS[node.depth as keyof typeof NODE_CONFIGS] ||
        NODE_CONFIGS[2];
    const hasChildren = node.childIds.length > 0;
    const lines = useMemo(
        () => wrapText(node.label, charsPerLine(node.depth, node.width)),
        [node.depth, node.label, node.width],
    );
    const lineHeight = config.fontSize + 4;

    useEffect(() => {
        if (didEnter.current) return;
        didEnter.current = true;
        if (!animateEntry) {
            enter.value = 1;
            return;
        }
        enter.value = 0;
        enter.value = withDelay(
            getStableDelay(node.id, node.depth),
            withSpring(1, animationConfig.spring),
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [node.id]);

    const animatedProps = useAnimatedProps(() => {
        const nodeCenterX = node.x + node.width / 2;
        const nodeCenterY = node.y + node.height / 2;
        const cx = center.value.x;
        const cy = center.value.y;
        const startX = (cx - nodeCenterX) * animationConfig.nodeStartOffset;
        const startY = (cy - nodeCenterY) * animationConfig.nodeStartOffset;
        const scale = interpolate(
            enter.value,
            [0, 1],
            [animationConfig.nodeStartScale, 1],
        );
        const tx = interpolate(enter.value, [0, 1], [startX, 0]);
        const ty = interpolate(enter.value, [0, 1], [startY, 0]);
        const dimOpacity = animationConfig.nodeIdleOpacity;

        return {
            opacity: enter.value * dimOpacity,
            transform: `translate(${nodeCenterX + tx} ${nodeCenterY + ty}) scale(${scale}) translate(${-nodeCenterX} ${-nodeCenterY})`,
        };
    });

    // ── Depth 0: root ───────────────────────────────────────────────────────
    if (node.depth === 0) {
        return (
            <AnimatedG animatedProps={animatedProps}>
                <Rect
                    x={node.x}
                    y={node.y}
                    width={node.width}
                    height={node.height}
                    rx={config.rx}
                    ry={config.rx}
                    fill="url(#rootGrad)"
                />
                {lines.map((line, li) => (
                    <SvgText
                        key={li}
                        x={node.x + node.width / 2}
                        y={
                            node.y +
                            node.height / 2 -
                            ((lines.length - 1) * lineHeight) / 2 +
                            li * lineHeight +
                            config.fontSize / 3
                        }
                        textAnchor="middle"
                        letterSpacing={FIXED_LETTER_SPACING}
                        fill="#FFFFFF"
                        fontSize={config.fontSize}
                        fontWeight={config.fontWeight}
                        fontFamily={typography.fonts.bold}
                    >
                        {line}
                    </SvgText>
                ))}
            </AnimatedG>
        );
    }

    // ── Depth 1: branch ─────────────────────────────────────────────────────
    if (node.depth === 1) {
        return (
            <AnimatedG animatedProps={animatedProps}>
                <Rect
                    x={node.x}
                    y={node.y}
                    width={4}
                    height={node.height}
                    rx={2}
                    ry={2}
                    fill={node.accentColor}
                />
                <Rect
                    x={node.x + 4}
                    y={node.y}
                    width={node.width - 4}
                    height={node.height}
                    rx={config.rx}
                    ry={config.rx}
                    fill={node.color}
                    stroke={node.borderColor}
                    strokeWidth={1}
                />
                {lines.map((line, li) => (
                    <SvgText
                        key={li}
                        x={node.x + node.width / 2 + 2}
                        y={
                            node.y +
                            node.height / 2 -
                            ((lines.length - 1) * lineHeight) / 2 +
                            li * lineHeight +
                            config.fontSize / 3
                        }
                        textAnchor="middle"
                        letterSpacing={FIXED_LETTER_SPACING}
                        fill={colors.textPrimary}
                        fontSize={config.fontSize}
                        fontWeight={config.fontWeight}
                        fontFamily={typography.fonts.semiBold}
                    >
                        {line}
                    </SvgText>
                ))}
                {hasChildren && (
                    <CollapseIcon
                        x={node.x + node.width - 16}
                        y={node.y + node.height / 2}
                        color={node.accentColor}
                        collapsed={node.collapsed}
                        size={9}
                    />
                )}
            </AnimatedG>
        );
    }

    // ── Depth 2: leaf ───────────────────────────────────────────────────────
    const lightBg = node.lightBg || colors.surface;
    return (
        <AnimatedG animatedProps={animatedProps}>
            <Rect
                x={node.x}
                y={node.y}
                width={node.width}
                height={node.height}
                rx={config.rx}
                ry={config.rx}
                fill={lightBg}
                stroke={node.borderColor}
                strokeWidth={0.9}
            />
            <Circle
                cx={node.x + 12}
                cy={node.y + node.height / 2}
                r={3}
                fill={node.accentColor}
                opacity={0.55}
            />
            {lines.map((line, li) => (
                <SvgText
                    key={li}
                    x={node.x + node.width / 2 + 6}
                    y={
                        node.y +
                        node.height / 2 -
                        ((lines.length - 1) * lineHeight) / 2 +
                        li * lineHeight +
                        config.fontSize / 3
                    }
                    textAnchor="middle"
                    letterSpacing={FIXED_LETTER_SPACING}
                    fill={colors.textSecondary}
                    fontSize={config.fontSize}
                    fontWeight={config.fontWeight}
                    fontFamily={typography.fonts.medium}
                >
                    {line}
                </SvgText>
            ))}
            {hasChildren && (
                <CollapseIcon
                    x={node.x + node.width - 14}
                    y={node.y + node.height / 2}
                    color={node.accentColor}
                    collapsed={node.collapsed}
                    size={8}
                />
            )}
        </AnimatedG>
    );
}, areNodePropsEqual);
