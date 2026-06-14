import React from "react";
import { G, Rect, Circle, Text as SvgText, Line } from "react-native-svg";
import type { LayoutNode } from "../types";
import { NODE_CONFIGS } from "../constants";
import { wrapText } from "../utils/layout";

// ─── Plus/Minus Icon ────────────────────────────────────────────────────────

function PlusMinusIcon({
    cx,
    cy,
    color,
    type,
    size = 8,
}: {
    cx: number;
    cy: number;
    color: string;
    type: "plus" | "minus";
    size?: number;
}) {
    const half = size / 2;
    return (
        <G>
            <Line
                x1={cx - half} y1={cy} x2={cx + half} y2={cy}
                stroke={color} strokeWidth={1.8} strokeLinecap="round"
            />
            {type === "plus" && (
                <Line
                    x1={cx} y1={cy - half} x2={cx} y2={cy + half}
                    stroke={color} strokeWidth={1.8} strokeLinecap="round"
                />
            )}
        </G>
    );
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface MindMapSvgProps {
    nodes: LayoutNode[];
    connections: { path: string; color: string; strokeWidth: number }[];
    bounds: { width: number; height: number };
}

// ─── Component ──────────────────────────────────────────────────────────────

export function MindMapSvg({ nodes, connections, bounds }: MindMapSvgProps) {
    const renderNode = (node: LayoutNode) => {
        const config = NODE_CONFIGS[node.depth as keyof typeof NODE_CONFIGS] || NODE_CONFIGS[2];
        const isRoot = node.depth === 0;
        const hasChildren = node.childIds.length > 0;
        const maxCharsPerLine = Math.floor((node.width - config.paddingH * 2 - (node.depth === 1 ? 28 : 0)) / (config.fontSize * 0.55));
        const lines = wrapText(node.label, Math.max(12, maxCharsPerLine));
        const lineHeight = config.fontSize + 4;

        if (isRoot) {
            return (
                <G key={node.id}>
                    {/* Shadow */}
                    <Rect
                        x={node.x + 2} y={node.y + 4}
                        width={node.width} height={node.height}
                        rx={config.rx} ry={config.rx}
                        fill="rgba(100, 60, 200, 0.18)"
                    />
                    {/* Gradient body */}
                    <Rect
                        x={node.x} y={node.y}
                        width={node.width} height={node.height}
                        rx={config.rx} ry={config.rx}
                        fill="url(#rootGrad)"
                    />
                    {/* Subtle inner glow */}
                    <Rect
                        x={node.x + 1} y={node.y + 1}
                        width={node.width - 2} height={node.height - 2}
                        rx={config.rx - 1} ry={config.rx - 1}
                        fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1}
                    />
                    {/* Text */}
                    {lines.map((line, li) => (
                        <SvgText
                            key={li}
                            x={node.x + node.width / 2}
                            y={node.y + node.height / 2 - ((lines.length - 1) * lineHeight) / 2 + li * lineHeight + config.fontSize / 3}
                            textAnchor="middle"
                            fill="#FFFFFF"
                            fontSize={config.fontSize}
                            fontWeight={config.fontWeight}
                            fontFamily="System"
                        >
                            {line}
                        </SvgText>
                    ))}
                </G>
            );
        }

        // Branch node (depth 1)
        if (node.depth === 1) {
            return (
                <G key={node.id}>
                    {/* Shadow */}
                    <Rect
                        x={node.x + 1} y={node.y + 3}
                        width={node.width} height={node.height}
                        rx={config.rx} ry={config.rx}
                        fill="rgba(0,0,0,0.06)"
                    />
                    {/* Accent bar left */}
                    <Rect
                        x={node.x} y={node.y + 4}
                        width={5} height={node.height - 8}
                        rx={2.5} ry={2.5}
                        fill={node.accentColor}
                    />
                    {/* Card body */}
                    <Rect
                        x={node.x + 4} y={node.y}
                        width={node.width - 4} height={node.height}
                        rx={config.rx} ry={config.rx}
                        fill={node.color}
                        stroke={node.borderColor}
                        strokeWidth={1}
                    />
                    {/* Text */}
                    {lines.map((line, li) => (
                        <SvgText
                            key={li}
                            x={node.x + 20}
                            y={node.y + node.height / 2 - ((lines.length - 1) * lineHeight) / 2 + li * lineHeight + config.fontSize / 3}
                            textAnchor="start"
                            fill="#1E293B"
                            fontSize={config.fontSize}
                            fontWeight={config.fontWeight}
                            fontFamily="System"
                        >
                            {line}
                        </SvgText>
                    ))}
                    {/* Collapse/expand badge */}
                    {hasChildren && (
                        <G>
                            <Circle
                                cx={node.x + node.width - 16}
                                cy={node.y + node.height / 2}
                                r={9}
                                fill={node.accentColor}
                                opacity={0.12}
                            />
                            <PlusMinusIcon
                                cx={node.x + node.width - 16}
                                cy={node.y + node.height / 2}
                                color={node.accentColor}
                                type={node.collapsed ? "plus" : "minus"}
                                size={7}
                            />
                        </G>
                    )}
                </G>
            );
        }

        // Leaf/sub node (depth >= 2)
        const lightBg = node.lightBg || "#FAFAFA";
        return (
            <G key={node.id}>
                {/* Shadow */}
                <Rect
                    x={node.x + 1} y={node.y + 2}
                    width={node.width} height={node.height}
                    rx={config.rx} ry={config.rx}
                    fill="rgba(0,0,0,0.04)"
                />
                {/* Card body */}
                <Rect
                    x={node.x} y={node.y}
                    width={node.width} height={node.height}
                    rx={config.rx} ry={config.rx}
                    fill={lightBg}
                    stroke={node.borderColor}
                    strokeWidth={0.8}
                    opacity={0.95}
                />
                {/* Subtle left dot accent */}
                <Circle
                    cx={node.x + 12}
                    cy={node.y + node.height / 2}
                    r={3}
                    fill={node.accentColor}
                    opacity={0.4}
                />
                {/* Text */}
                {lines.map((line, li) => (
                    <SvgText
                        key={li}
                        x={node.x + 22}
                        y={node.y + node.height / 2 - ((lines.length - 1) * lineHeight) / 2 + li * lineHeight + config.fontSize / 3}
                        textAnchor="start"
                        fill="#334155"
                        fontSize={config.fontSize}
                        fontWeight={config.fontWeight}
                        fontFamily="System"
                    >
                        {line}
                    </SvgText>
                ))}
                {/* Collapse/expand badge — only for nodes with children */}
                {hasChildren && (
                    <G>
                        <Circle
                            cx={node.x + node.width - 14}
                            cy={node.y + node.height / 2}
                            r={8}
                            fill={node.accentColor}
                            opacity={0.12}
                        />
                        <PlusMinusIcon
                            cx={node.x + node.width - 14}
                            cy={node.y + node.height / 2}
                            color={node.accentColor}
                            type={node.collapsed ? "plus" : "minus"}
                            size={6}
                        />
                    </G>
                )}
            </G>
        );
    };

    return { renderNode };
}

export { PlusMinusIcon };
