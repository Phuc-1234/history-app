import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Platform,
    LayoutChangeEvent,
} from "react-native";
import Svg, {
    Path,
    G,
    Rect,
    Circle,
    Defs,
    LinearGradient as SvgLinearGradient,
    Stop,
    Text as SvgText,
    ForeignObject,
    Line,
} from "react-native-svg";
import { Maximize2, Plus, Minus } from "lucide-react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MindMapNode {
    id: string;
    label: string;
    children: MindMapNode[];
    color: string;
    borderColor: string;
    accentColor: string;
}

interface LayoutNode {
    id: string;
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    borderColor: string;
    accentColor: string;
    depth: number;
    parentId: string | null;
    collapsed: boolean;
    childIds: string[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const BRANCH_COLORS = [
    { color: "#F5F3FF", borderColor: "#C4B5FD", accentColor: "#7C3AED", lightBg: "#FAF5FF" },
    { color: "#EFF6FF", borderColor: "#93C5FD", accentColor: "#2563EB", lightBg: "#F0F7FF" },
    { color: "#ECFDF5", borderColor: "#6EE7B7", accentColor: "#059669", lightBg: "#F0FDF4" },
    { color: "#FFFBEB", borderColor: "#FCD34D", accentColor: "#D97706", lightBg: "#FEFCE8" },
    { color: "#FFF1F2", borderColor: "#FDA4AF", accentColor: "#E11D48", lightBg: "#FFF1F2" },
];

const SAFE_PADDING = Platform.OS === "web" ? 52 : 36;
const MOBILE_BREAKPOINT = 600;

const NODE_CONFIGS = {
    0: { minWidth: 200, height: 56, fontSize: 14, fontWeight: "700" as const, rx: 16, paddingH: 28, paddingV: 14 },
    1: { minWidth: 155, height: 44, fontSize: 12.5, fontWeight: "600" as const, rx: 12, paddingH: 22, paddingV: 12 },
    2: { minWidth: 120, height: 36, fontSize: 11.5, fontWeight: "500" as const, rx: 10, paddingH: 18, paddingV: 10 },
};

const SPRING_CONFIG = { damping: 20, stiffness: 150 };

function getScaleLimits(isMobile: boolean) {
    return { min: isMobile ? 0.45 : 0.35, max: isMobile ? 2 : 2.5 };
}

// ─── Sample Data ─────────────────────────────────────────────────────────────

const SAMPLE_DATA: MindMapNode = {
    id: "root",
    label: "Kháng chiến chống Pháp (1946-1954)",
    color: "#7C3AED",
    borderColor: "#7C3AED",
    accentColor: "#5B21B6",
    children: [
        {
            id: "b1",
            label: "Bối cảnh lịch sử",
            ...BRANCH_COLORS[0],
            children: [
                { id: "b1-1", label: "Pháp quay lại xâm lược VN", ...BRANCH_COLORS[0], children: [] },
                { id: "b1-2", label: "Hiệp định Sơ bộ 6/3/1946", ...BRANCH_COLORS[0], children: [] },
                { id: "b1-3", label: "Tạm ước 14/9/1946", ...BRANCH_COLORS[0], children: [] },
            ],
        },
        {
            id: "b2",
            label: "Đường lối kháng chiến",
            ...BRANCH_COLORS[1],
            children: [
                { id: "b2-1", label: "Toàn dân", ...BRANCH_COLORS[1], children: [] },
                { id: "b2-2", label: "Toàn diện", ...BRANCH_COLORS[1], children: [] },
                { id: "b2-3", label: "Trường kỳ", ...BRANCH_COLORS[1], children: [] },
                { id: "b2-4", label: "Tự lực cánh sinh", ...BRANCH_COLORS[1], children: [] },
            ],
        },
        {
            id: "b3",
            label: "Diễn biến chính",
            ...BRANCH_COLORS[2],
            children: [
                { id: "b3-1", label: "Toàn quốc kháng chiến 12/1946", ...BRANCH_COLORS[2], children: [] },
                { id: "b3-2", label: "Việt Bắc Thu - Đông 1947", ...BRANCH_COLORS[2], children: [] },
                { id: "b3-3", label: "Biên Giới Thu - Đông 1950", ...BRANCH_COLORS[2], children: [] },
                { id: "b3-4", label: "Điện Biên Phủ 1954", ...BRANCH_COLORS[2], children: [] },
            ],
        },
        {
            id: "b4",
            label: "Kết quả",
            ...BRANCH_COLORS[3],
            children: [
                { id: "b4-1", label: "Chiến thắng ĐBP lịch sử", ...BRANCH_COLORS[3], children: [] },
                { id: "b4-2", label: "Hiệp định Genève 7/1954", ...BRANCH_COLORS[3], children: [] },
                { id: "b4-3", label: "Giải phóng miền Bắc", ...BRANCH_COLORS[3], children: [] },
            ],
        },
        {
            id: "b5",
            label: "Ý nghĩa lịch sử",
            ...BRANCH_COLORS[4],
            children: [
                { id: "b5-1", label: "Củng cố chính quyền", ...BRANCH_COLORS[4], children: [] },
                { id: "b5-2", label: "Tiền đề thống nhất", ...BRANCH_COLORS[4], children: [] },
                { id: "b5-3", label: "Cổ vũ GPDT thế giới", ...BRANCH_COLORS[4], children: [] },
            ],
        },
    ],
};

// ─── Text wrapping helper ────────────────────────────────────────────────────

function wrapText(text: string, maxCharsPerLine: number): string[] {
    if (text.length <= maxCharsPerLine) return [text];
    const words = text.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
        if ((current.length + (current ? 1 : 0) + word.length) > maxCharsPerLine && current) {
            lines.push(current);
            current = word;
        } else {
            current = current ? current + " " + word : word;
        }
    }
    if (current) lines.push(current);
    return lines;
}

// ─── Layout Engine ───────────────────────────────────────────────────────────

function measureNode(label: string, depth: number): { width: number; height: number } {
    const config = NODE_CONFIGS[depth as keyof typeof NODE_CONFIGS] || NODE_CONFIGS[2];
    const maxCharsPerLine = Math.floor((config.minWidth - config.paddingH) / (config.fontSize * 0.55));
    const lines = wrapText(label, Math.max(12, maxCharsPerLine));
    const charWidth = config.fontSize * 0.55;
    const longestLine = Math.max(...lines.map((l) => l.length * charWidth));
    const textWidth = longestLine;
    const width = Math.max(config.minWidth, textWidth + config.paddingH * 2 + (depth === 1 ? 28 : 0));
    const lineHeight = config.fontSize + 4;
    const height = Math.max(config.height, lines.length * lineHeight + config.paddingV);
    return { width, height };
}

function layoutTree(
    node: MindMapNode,
    depth: number,
    startY: number,
    parentId: string | null,
    collapsedSet: Set<string>
): { nodes: LayoutNode[]; totalHeight: number } {
    const { width, height } = measureNode(node.label, depth);
    const visibleChildren = collapsedSet.has(node.id) ? [] : node.children;

    if (visibleChildren.length === 0) {
        return {
            nodes: [{
                id: node.id, label: node.label, x: 0, y: startY,
                width, height, color: node.color, borderColor: node.borderColor,
                accentColor: node.accentColor, depth, parentId,
                collapsed: collapsedSet.has(node.id),
                childIds: node.children.map((c) => c.id),
            }],
            totalHeight: height,
        };
    }

    const vGap = 12;
    let childY = startY;
    const allNodes: LayoutNode[] = [];

    for (const child of visibleChildren) {
        const result = layoutTree(child, depth + 1, childY, node.id, collapsedSet);
        allNodes.push(...result.nodes);
        childY += result.totalHeight + vGap;
    }

    const totalChildHeight = childY - startY - vGap;
    const myY = startY + totalChildHeight / 2 - height / 2;

    allNodes.push({
        id: node.id, label: node.label, x: 0, y: myY,
        width, height, color: node.color, borderColor: node.borderColor,
        accentColor: node.accentColor, depth, parentId,
        collapsed: collapsedSet.has(node.id),
        childIds: node.children.map((c) => c.id),
    });

    return { nodes: allNodes, totalHeight: Math.max(totalChildHeight, height) };
}

function applyHorizontalPositions(nodes: LayoutNode[]): LayoutNode[] {
    const depthX: Record<number, number> = { 0: 0 };
    const hGap = 70;
    const sorted = [...nodes].sort((a, b) => a.depth - b.depth);

    for (const node of sorted) {
        if (node.depth > 0 && depthX[node.depth] === undefined) {
            const parent = sorted.find((n) => n.id === node.parentId);
            if (parent) {
                depthX[node.depth] = (depthX[parent.depth] ?? 0) + parent.width + hGap;
            }
        }
    }

    return nodes.map((n) => ({ ...n, x: depthX[n.depth] ?? 0 }));
}

function normalizeCoordinates(nodes: LayoutNode[]): LayoutNode[] {
    if (nodes.length === 0) return nodes;
    let minX = Infinity, minY = Infinity;
    for (const n of nodes) {
        if (n.x < minX) minX = n.x;
        if (n.y < minY) minY = n.y;
    }
    return nodes.map((n) => ({
        ...n,
        x: n.x - minX + SAFE_PADDING,
        y: n.y - minY + SAFE_PADDING,
    }));
}

function computeBounds(nodes: LayoutNode[]): { width: number; height: number } {
    if (nodes.length === 0) return { width: 400, height: 300 };
    let maxX = -Infinity, maxY = -Infinity;
    for (const n of nodes) {
        if (n.x + n.width + 32 > maxX) maxX = n.x + n.width + 32;
        if (n.y + n.height + 4 > maxY) maxY = n.y + n.height + 4;
    }
    return { width: maxX + SAFE_PADDING, height: maxY + SAFE_PADDING };
}

// ─── Bezier ──────────────────────────────────────────────────────────────────

function buildBezierPath(fromX: number, fromY: number, toX: number, toY: number): string {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const off = dy * 0.08;
    return `M ${fromX} ${fromY} C ${fromX + dx * 0.4} ${fromY + off}, ${fromX + dx * 0.6} ${toY - off}, ${toX} ${toY}`;
}

// ─── Plus/Minus Icon (vẽ bằng Line thay vì SvgText để luôn center) ────────────

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

// ─── Component ───────────────────────────────────────────────────────────────

export default function MindMapScreen() {
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
    const [addNodeTarget, setAddNodeTarget] = useState<string | null>(null);
    const prevContainerRef = useRef({ width: 0, height: 0 });
    const hasInitialFitRef = useRef(false);
    const prevAutoFitContainerRef = useRef({ width: 0, height: 0 });

    const isMobile = containerSize.width > 0 && containerSize.width < MOBILE_BREAKPOINT;

    // ── Layout
    const { nodes, bounds } = useMemo(() => {
        const { nodes: raw } = layoutTree(SAMPLE_DATA, 0, 0, null, collapsedNodes);
        const positioned = applyHorizontalPositions(raw);
        const normalized = normalizeCoordinates(positioned);
        return { nodes: normalized, bounds: computeBounds(normalized) };
    }, [collapsedNodes]);

    // ── Shared values
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const savedTx = useSharedValue(0);
    const savedTy = useSharedValue(0);

    // ── Calculate best-fit
    const calcFitTransform = useCallback((cw: number, ch: number) => {
        if (cw === 0 || ch === 0) return { s: 1, tx: 0, ty: 0 };
        const limits = getScaleLimits(cw < MOBILE_BREAKPOINT);
        let fitScale = Math.min(cw / bounds.width, ch / bounds.height);
        if (cw < MOBILE_BREAKPOINT) {
            fitScale = Math.max(fitScale, 0.7);
            fitScale = Math.min(fitScale, 1.0);
        } else {
            fitScale = Math.max(limits.min, Math.min(1.15, fitScale));
        }
        return {
            s: fitScale,
            tx: (cw - bounds.width * fitScale) / 2,
            ty: (ch - bounds.height * fitScale) / 2,
        };
    }, [bounds]);

    const applyTransform = useCallback((s: number, tx: number, ty: number, animate = true) => {
        const fn = animate ? withSpring : withTiming;
        const cfg = animate ? SPRING_CONFIG : { duration: 1 };
        translateX.value = fn(tx, cfg);
        translateY.value = fn(ty, cfg);
        scale.value = fn(s, cfg);
        savedScale.value = s;
        savedTx.value = tx;
        savedTy.value = ty;
    }, []);

    const fitView = useCallback(() => {
        const t = calcFitTransform(containerSize.width, containerSize.height);
        applyTransform(t.s, t.tx, t.ty);
    }, [containerSize, calcFitTransform, applyTransform]);

    // ── Auto-fit: chỉ lần đầu + resize container
    useEffect(() => {
        if (containerSize.width === 0 || containerSize.height === 0) return;
        const prev = prevAutoFitContainerRef.current;
        const sizeChanged =
            Math.abs(containerSize.width - prev.width) > 30 ||
            Math.abs(containerSize.height - prev.height) > 30;
        if (!hasInitialFitRef.current || sizeChanged) {
            const t = calcFitTransform(containerSize.width, containerSize.height);
            applyTransform(t.s, t.tx, t.ty);
            hasInitialFitRef.current = true;
            prevAutoFitContainerRef.current = { width: containerSize.width, height: containerSize.height };
        }
    }, [containerSize.width, containerSize.height, calcFitTransform, applyTransform]);

    // ── Dimensions listener
    useEffect(() => {
        const sub = Dimensions.addEventListener("change", ({ window }) => {
            setContainerSize({ width: window.width, height: window.height });
        });
        return () => sub.remove();
    }, []);

    // ── Container layout
    const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
        const { width: w, height: h } = e.nativeEvent.layout;
        const prev = prevContainerRef.current;
        if (Math.abs(w - prev.width) > 30 || Math.abs(h - prev.height) > 30 || prev.width === 0) {
            prevContainerRef.current = { width: w, height: h };
            setContainerSize({ width: w, height: h });
        }
    }, []);

    // ── Pan gesture
    const panGesture = useMemo(
        () =>
            Gesture.Pan()
                .onUpdate((e) => {
                    translateX.value = savedTx.value + e.translationX;
                    translateY.value = savedTy.value + e.translationY;
                })
                .onEnd(() => {
                    savedTx.value = translateX.value;
                    savedTy.value = translateY.value;
                }),
        []
    );

    // ── Zoom buttons
    const ZOOM_STEP = 0.15;
    const handleZoomIn = useCallback(() => {
        const limits = getScaleLimits(isMobile);
        const newScale = Math.min(limits.max, savedScale.value + ZOOM_STEP);
        const cx = containerSize.width / 2;
        const cy = containerSize.height / 2;
        const ratio = newScale / savedScale.value;
        applyTransform(newScale, cx - ratio * (cx - savedTx.value), cy - ratio * (cy - savedTy.value));
    }, [isMobile, containerSize, applyTransform]);

    const handleZoomOut = useCallback(() => {
        const limits = getScaleLimits(isMobile);
        const newScale = Math.max(limits.min, savedScale.value - ZOOM_STEP);
        const cx = containerSize.width / 2;
        const cy = containerSize.height / 2;
        const ratio = newScale / savedScale.value;
        applyTransform(newScale, cx - ratio * (cx - savedTx.value), cy - ratio * (cy - savedTy.value));
    }, [isMobile, containerSize, applyTransform]);

    // ── Animated style
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
    }));

    // ── Toggle collapse
    const toggleCollapse = useCallback((nodeId: string) => {
        setCollapsedNodes((prev) => {
            const next = new Set(prev);
            next.has(nodeId) ? next.delete(nodeId) : next.add(nodeId);
            return next;
        });
    }, []);

    const handleAddNode = useCallback((parentId: string) => {
        setAddNodeTarget(parentId);
        setTimeout(() => setAddNodeTarget(null), 1500);
    }, []);

    // ── Connections
    const connections = useMemo(() => {
        const nodeMap = new Map(nodes.map((n) => [n.id, n]));
        const conns: { path: string; color: string; strokeWidth: number }[] = [];
        for (const node of nodes) {
            if (!node.parentId) continue;
            const parent = nodeMap.get(node.parentId);
            if (!parent || parent.collapsed) continue;
            conns.push({
                path: buildBezierPath(
                    parent.x + parent.width, parent.y + parent.height / 2,
                    node.x, node.y + node.height / 2
                ),
                color: node.accentColor,
                strokeWidth: node.depth === 1 ? 2.5 : 1.5,
            });
        }
        return conns;
    }, [nodes]);

    const handleNodePress = useCallback((nodeId: string, depth: number) => {
        if (depth === 0) return;
        const node = nodes.find((n) => n.id === nodeId);
        if (node && node.childIds.length > 0) toggleCollapse(nodeId);
    }, [nodes, toggleCollapse]);

    // ── Render node SVG
    const renderNode = useCallback((node: LayoutNode) => {
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

        // Leaf node (depth >= 2)
        const lightBg = (node as any).lightBg || "#FAFAFA";
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
                {/* "+" add button */}
                <G>
                    <Circle
                        cx={node.x + node.width + 14}
                        cy={node.y + node.height / 2}
                        r={10}
                        fill="#FFFFFF"
                        stroke={node.accentColor}
                        strokeWidth={1.2}
                    />
                    <PlusMinusIcon
                        cx={node.x + node.width + 14}
                        cy={node.y + node.height / 2}
                        color={node.accentColor}
                        type="plus"
                        size={7}
                    />
                </G>
            </G>
        );
    }, []);

    return (
        <GestureHandlerRootView style={styles.root}>
            <View style={styles.screen}>
                <View style={styles.mapArea} onLayout={onContainerLayout}>
                    {/* ══ Zoom toolbar ══ */}
                    <View style={styles.toolbar}>
                        <TouchableOpacity activeOpacity={0.7} style={styles.toolbarBtn} onPress={handleZoomIn}>
                            <Plus size={20} color="#7C3AED" strokeWidth={2.5} />
                        </TouchableOpacity>
                        <TouchableOpacity activeOpacity={0.7} style={styles.toolbarBtn} onPress={fitView}>
                            <Maximize2 size={18} color="#7C3AED" />
                        </TouchableOpacity>
                        <TouchableOpacity activeOpacity={0.7} style={styles.toolbarBtn} onPress={handleZoomOut}>
                            <Minus size={20} color="#7C3AED" strokeWidth={2.5} />
                        </TouchableOpacity>
                    </View>

                    {/* ══ Toast ══ */}
                    {addNodeTarget !== null && (
                        <View style={styles.addNodeToast}>
                            <Text style={styles.addNodeToastText}>
                                + Thêm node vào &ldquo;{addNodeTarget}&rdquo;
                            </Text>
                        </View>
                    )}

                    {/* ══ Mind map ══ */}
                    <GestureDetector gesture={panGesture}>
                        <Animated.View
                            style={[{ width: bounds.width, height: bounds.height }, animatedStyle]}
                        >
                            <Svg width={bounds.width} height={bounds.height} viewBox={`0 0 ${bounds.width} ${bounds.height}`}>
                                <Defs>
                                    <SvgLinearGradient id="rootGrad" x1="0" y1="0" x2="1" y2="1">
                                        <Stop offset="0" stopColor="#7C3AED" />
                                        <Stop offset="0.5" stopColor="#6D28D9" />
                                        <Stop offset="1" stopColor="#4F46E5" />
                                    </SvgLinearGradient>
                                </Defs>

                                {/* Background blobs */}
                                <Circle cx={bounds.width * 0.1} cy={bounds.height * 0.2} r={140} fill="#EDE9FE" opacity={0.15} />
                                <Circle cx={bounds.width * 0.65} cy={bounds.height * 0.5} r={120} fill="#DBEAFE" opacity={0.12} />
                                <Circle cx={bounds.width * 0.4} cy={bounds.height * 0.85} r={100} fill="#D1FAE5" opacity={0.1} />

                                {/* Connections */}
                                {connections.map((conn, i) => (
                                    <Path key={`c-${i}`} d={conn.path} stroke={conn.color} strokeWidth={conn.strokeWidth} fill="none" opacity={0.45} />
                                ))}

                                {/* Nodes */}
                                {nodes.map(renderNode)}
                            </Svg>

                            {/* Touchable overlays */}
                            {nodes.map((node) => {
                                if (node.depth === 0) return null;
                                return (
                                    <React.Fragment key={`t-${node.id}`}>
                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            style={{
                                                position: "absolute",
                                                left: node.x,
                                                top: node.y,
                                                width: node.width,
                                                height: node.height,
                                                borderRadius: NODE_CONFIGS[node.depth as keyof typeof NODE_CONFIGS]?.rx ?? 10,
                                            }}
                                            onPress={() => handleNodePress(node.id, node.depth)}
                                        />
                                        {node.depth >= 2 && (
                                            <TouchableOpacity
                                                activeOpacity={0.6}
                                                style={{
                                                    position: "absolute",
                                                    left: node.x + node.width + 4,
                                                    top: node.y + node.height / 2 - 10,
                                                    width: 20,
                                                    height: 20,
                                                    borderRadius: 10,
                                                }}
                                                onPress={() => handleAddNode(node.id)}
                                            />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </Animated.View>
                    </GestureDetector>
                </View>
            </View>
        </GestureHandlerRootView>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#FFFFFF" },
    screen: { flex: 1 },

    mapArea: {
        flex: 1,
        backgroundColor: "#FDFBFF",
        overflow: "hidden",
    },

    toolbar: {
        position: "absolute",
        right: 12,
        bottom: 24,
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        zIndex: 10,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 6,
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
            android: { elevation: 4 },
            web: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
        }),
    },
    toolbarBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#F3F0FF",
        alignItems: "center",
        justifyContent: "center",
    },

    addNodeToast: {
        position: "absolute",
        bottom: 20,
        left: 20,
        right: 80,
        backgroundColor: "#7C3AED",
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
        zIndex: 20,
    },
    addNodeToastText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "600",
        textAlign: "center",
    },
});
