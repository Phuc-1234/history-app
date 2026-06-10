import React, { useEffect, useMemo } from "react";
import { G, Rect, Circle, Text as SvgText, Line } from "react-native-svg";
import Animated, {
    Easing,
    interpolate,
    useAnimatedProps,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import type { LayoutNode } from "../types";
import { animationConfig, NODE_CONFIGS } from "../constants";
import { wrapText } from "../utils/layout";

const AnimatedG = Animated.createAnimatedComponent(G);

interface NodeCardProps {
    node: LayoutNode;
    index: number;
    center: { x: number; y: number };
    activeNodeId: string | null;
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
            <Circle cx={x} cy={y} r={size} fill={color} opacity={0.14} />
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

export function NodeCard({ node, index, center, activeNodeId }: NodeCardProps) {
    const enter = useSharedValue(0);
    const focus = useSharedValue(0);
    const hasActive = activeNodeId !== null;
    const isActive = activeNodeId === node.id;
    const isRelated = isActive || node.parentId === activeNodeId || node.childIds.includes(activeNodeId ?? "");

    const config = NODE_CONFIGS[node.depth as keyof typeof NODE_CONFIGS] || NODE_CONFIGS[2];
    const hasChildren = node.childIds.length > 0;
    const lines = useMemo(() => {
        const maxCharsPerLine = Math.floor(
            (node.width - config.paddingH * 2 - (node.depth === 1 ? 28 : 0)) /
                (config.fontSize * 0.55),
        );
        return wrapText(node.label, Math.max(12, maxCharsPerLine));
    }, [config.fontSize, config.paddingH, node.depth, node.label, node.width]);
    const lineHeight = config.fontSize + 4;

    useEffect(() => {
        enter.value = 0;
        enter.value = withDelay(
            animationConfig.nodeBaseDelay +
                node.depth * animationConfig.nodeDepthDelay +
                index * animationConfig.nodeSiblingDelay,
            withSpring(1, animationConfig.spring),
        );
    }, [enter, index, node.depth, node.id]);

    useEffect(() => {
        focus.value = withTiming(isActive ? 1 : 0, {
            duration: 160,
            easing: Easing.out(Easing.cubic),
        });
    }, [focus, isActive]);

    const animatedProps = useAnimatedProps(() => {
        const nodeCenterX = node.x + node.width / 2;
        const nodeCenterY = node.y + node.height / 2;
        const startX = (center.x - nodeCenterX) * animationConfig.nodeStartOffset;
        const startY = (center.y - nodeCenterY) * animationConfig.nodeStartOffset;
        const scale =
            interpolate(
                enter.value,
                [0, 1],
                [animationConfig.nodeStartScale, 1],
            ) + focus.value * (animationConfig.nodeActiveScale - 1);
        const tx = interpolate(enter.value, [0, 1], [startX, 0]);
        const ty = interpolate(enter.value, [0, 1], [startY, 0]);
        const dimOpacity =
            hasActive && !isRelated ? animationConfig.nodeDimOpacity : animationConfig.nodeIdleOpacity;

        return {
            opacity: enter.value * dimOpacity,
            transform: `translate(${nodeCenterX + tx} ${nodeCenterY + ty}) scale(${scale}) translate(${-nodeCenterX} ${-nodeCenterY})`,
        };
    });

    const glowOpacity = isActive ? 0.26 : 0.08;
    const shadowOpacity = isActive ? 0.18 : 0.07;

    if (node.depth === 0) {
        return (
            <AnimatedG animatedProps={animatedProps}>
                <Rect
                    x={node.x - 7}
                    y={node.y - 6}
                    width={node.width + 14}
                    height={node.height + 14}
                    rx={config.rx + 8}
                    ry={config.rx + 8}
                    fill="#7C3AED"
                    opacity={glowOpacity}
                />
                <Rect
                    x={node.x + 5}
                    y={node.y + 8}
                    width={node.width}
                    height={node.height}
                    rx={config.rx}
                    ry={config.rx}
                    fill="#312E81"
                    opacity={shadowOpacity}
                />
                <Rect
                    x={node.x}
                    y={node.y}
                    width={node.width}
                    height={node.height}
                    rx={config.rx}
                    ry={config.rx}
                    fill="url(#rootGrad)"
                />
                <Rect
                    x={node.x + 1}
                    y={node.y + 1}
                    width={node.width - 2}
                    height={node.height - 2}
                    rx={config.rx - 1}
                    ry={config.rx - 1}
                    fill="none"
                    stroke="rgba(255,255,255,0.46)"
                    strokeWidth={1}
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
                        fill="#FFFFFF"
                        fontSize={config.fontSize}
                        fontWeight={config.fontWeight}
                        fontFamily="System"
                    >
                        {line}
                    </SvgText>
                ))}
            </AnimatedG>
        );
    }

    if (node.depth === 1) {
        return (
            <AnimatedG animatedProps={animatedProps}>
                <Rect
                    x={node.x - 5}
                    y={node.y - 5}
                    width={node.width + 10}
                    height={node.height + 10}
                    rx={config.rx + 7}
                    ry={config.rx + 7}
                    fill={node.accentColor}
                    opacity={glowOpacity}
                />
                <Rect
                    x={node.x + 4}
                    y={node.y + 7}
                    width={node.width}
                    height={node.height}
                    rx={config.rx}
                    ry={config.rx}
                    fill="#0F172A"
                    opacity={shadowOpacity}
                />
                <Rect
                    x={node.x}
                    y={node.y + 4}
                    width={5}
                    height={node.height - 8}
                    rx={2.5}
                    ry={2.5}
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
                    stroke={isActive ? node.accentColor : node.borderColor}
                    strokeWidth={isActive ? 1.4 : 1}
                />
                <Rect
                    x={node.x + 10}
                    y={node.y + 2}
                    width={node.width - 20}
                    height={1.2}
                    rx={0.6}
                    ry={0.6}
                    fill="#FFFFFF"
                    opacity={0.72}
                />
                {lines.map((line, li) => (
                    <SvgText
                        key={li}
                        x={node.x + 20}
                        y={
                            node.y +
                            node.height / 2 -
                            ((lines.length - 1) * lineHeight) / 2 +
                            li * lineHeight +
                            config.fontSize / 3
                        }
                        textAnchor="start"
                        fill="#172033"
                        fontSize={config.fontSize}
                        fontWeight={config.fontWeight}
                        fontFamily="System"
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

    const lightBg = node.lightBg || "#FAFAFA";
    return (
        <AnimatedG animatedProps={animatedProps}>
            <Rect
                x={node.x - 4}
                y={node.y - 4}
                width={node.width + 8}
                height={node.height + 8}
                rx={config.rx + 6}
                ry={config.rx + 6}
                fill={node.accentColor}
                opacity={glowOpacity}
            />
            <Rect
                x={node.x + 3}
                y={node.y + 5}
                width={node.width}
                height={node.height}
                rx={config.rx}
                ry={config.rx}
                fill="#0F172A"
                opacity={shadowOpacity}
            />
            <Rect
                x={node.x}
                y={node.y}
                width={node.width}
                height={node.height}
                rx={config.rx}
                ry={config.rx}
                fill={lightBg}
                stroke={isActive ? node.accentColor : node.borderColor}
                strokeWidth={isActive ? 1.25 : 0.9}
                opacity={0.99}
            />
            <Circle
                cx={node.x + 12}
                cy={node.y + node.height / 2}
                r={3.5}
                fill={node.accentColor}
                opacity={isActive ? 0.78 : 0.52}
            />
            {lines.map((line, li) => (
                <SvgText
                    key={li}
                    x={node.x + 22}
                    y={
                        node.y +
                        node.height / 2 -
                        ((lines.length - 1) * lineHeight) / 2 +
                        li * lineHeight +
                        config.fontSize / 3
                    }
                    textAnchor="start"
                    fill="#334155"
                    fontSize={config.fontSize}
                    fontWeight={config.fontWeight}
                    fontFamily="System"
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
}
