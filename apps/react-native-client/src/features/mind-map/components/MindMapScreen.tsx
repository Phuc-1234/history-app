import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Platform,
    type LayoutChangeEvent,
} from "react-native";
import Svg, {
    Path,
    Circle,
    Rect,
    Defs,
    LinearGradient as SvgLinearGradient,
    Stop,
    Text as SvgText,
    G,
    Line,
} from "react-native-svg";
import { Maximize2, ChevronsDownUp, ChevronsUpDown } from "lucide-react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from "react-native-reanimated";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";

import { SAMPLE_DATA, NODE_CONFIGS, SPRING_CONFIG, getScaleLimits, MOBILE_BREAKPOINT } from "../constants";
import type { MindMapNode, LayoutNode } from "../types";
import {
    layoutTree,
    applyHorizontalPositions,
    normalizeCoordinates,
    computeBounds,
    buildBezierPath,
    wrapText,
    measureMaxWidthsPerDepth,
} from "../utils/layout";

// ─── Helpers ────────────────────────────────────────────────────────────────

function computeLayout(collapsedSet: Set<string>) {
    const maxWidths = measureMaxWidthsPerDepth(SAMPLE_DATA);
    const { nodes: raw } = layoutTree(SAMPLE_DATA, 0, 0, null, collapsedSet, maxWidths);
    const positioned = applyHorizontalPositions(raw);
    const normalized = normalizeCoordinates(positioned);
    return { nodes: normalized, bounds: computeBounds(normalized) };
}

function collectParentIds(node: MindMapNode, set: Set<string>) {
    if (node.children.length > 0) {
        set.add(node.id);
        for (const child of node.children) collectParentIds(child, set);
    }
}

// ─── Component ──────────────────────────────────────────────────────────────

// Collect all parent IDs except root → initial collapsed state
function getInitialCollapsed(): Set<string> {
    const ids = new Set<string>();
    collectParentIds(SAMPLE_DATA, ids);
    ids.delete("root");
    return ids;
}

export default function MindMapScreen() {
    const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(getInitialCollapsed);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    // ── Layout — recompute on collapse change
    const { nodes, bounds } = useMemo(
        () => computeLayout(collapsedNodes),
        [collapsedNodes]
    );

    // ── Compute the base fit scale (SVG → container)
    const fitScale = useMemo(() => {
        const cw = containerSize.width;
        const ch = containerSize.height;
        if (cw === 0 || ch === 0) return 1;
        const limits = getScaleLimits(cw < MOBILE_BREAKPOINT);
        let fs = Math.min(cw / bounds.width, ch / bounds.height);
        if (cw < MOBILE_BREAKPOINT) {
            fs = Math.max(fs, 0.7);
            fs = Math.min(fs, 1.0);
        } else {
            fs = Math.max(limits.min, Math.min(1.15, fs));
        }
        return fs;
    }, [containerSize.width, containerSize.height, bounds]);

    // Rendered SVG size (the mind map scaled to fit the container)
    const svgDisplayWidth = bounds.width * fitScale;
    const svgDisplayHeight = bounds.height * fitScale;

    // ── Shared transform values (user pan / zoom only)
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const userScale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const savedTx = useSharedValue(0);
    const savedTy = useSharedValue(0);

    // ── Container measurement
    const handleLayout = useCallback((e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        setContainerSize({ width, height });
    }, []);

    // ── Reset pan/zoom when bounds change (collapse/expand)
    useEffect(() => {
        translateX.value = 0;
        translateY.value = 0;
        userScale.value = 1;
        savedScale.value = 1;
        savedTx.value = 0;
        savedTy.value = 0;
    }, [bounds]);

    const fitView = useCallback(() => {
        translateX.value = withSpring(0, SPRING_CONFIG);
        translateY.value = withSpring(0, SPRING_CONFIG);
        userScale.value = withSpring(1, SPRING_CONFIG);
        savedScale.value = 1;
        savedTx.value = 0;
        savedTy.value = 0;
    }, []);

    // ── Pan + Pinch gestures
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

    const pinchGesture = useMemo(

// TODO: fix this later
() => Gesture.Pinch().enabled(false), // 👈 This completely turns it off safely
    []

//         () => {
//     // 1. Calculate the limits here on the JS thread during memoization
//     const isMobile = containerSize.width < MOBILE_BREAKPOINT;
//     const limits = getScaleLimits(isMobile); 

//     return Gesture.Pinch()
//         .onUpdate((e) => {
//             // 2. Use the pre-calculated limits safely inside the worklet
//             const newScale = Math.max(
//                 limits.min, 
//                 Math.min(limits.max, savedScale.value * e.scale)
//             );
//             const ratio = newScale / savedScale.value;
//             translateX.value = e.focalX - ratio * (e.focalX - savedTx.value);
//             translateY.value = e.focalY - ratio * (e.focalY - savedTy.value);
//             userScale.value = newScale;
//         })
//         .onEnd(() => {
//             savedScale.value = userScale.value;
//             savedTx.value = translateX.value;
//             savedTy.value = translateY.value;
//         });
// }, [containerSize.width]



); // 3. Re-run if container width changes (e.g., orientation change)

    const composedGesture = useMemo(
        () => Gesture.Race(pinchGesture, panGesture),
        [pinchGesture, panGesture]
    );

    // ── Animated style (pan/zoom on top of base fit)
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: userScale.value },
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

    // ── Expand / Collapse All
    const handleExpandAll = useCallback(() => setCollapsedNodes(new Set()), []);
    const handleCollapseAll = useCallback(() => {
        const ids = new Set<string>();
        collectParentIds(SAMPLE_DATA, ids);
        ids.delete("root");
        setCollapsedNodes(ids);
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

    // ─── Render SVG node ──────────────────────────────────────────────────
    const renderSvgNode = useCallback((node: LayoutNode) => {
        const config = NODE_CONFIGS[node.depth as keyof typeof NODE_CONFIGS] || NODE_CONFIGS[2];
        const isRoot = node.depth === 0;
        const hasChildren = node.childIds.length > 0;
        const maxCharsPerLine = Math.floor((node.width - config.paddingH * 2 - (node.depth === 1 ? 28 : 0)) / (config.fontSize * 0.55));
        const lines = wrapText(node.label, Math.max(12, maxCharsPerLine));
        const lineHeight = config.fontSize + 4;

        // Root node
        if (isRoot) {
            return (
                <G key={node.id}>
                    <Rect x={node.x + 2} y={node.y + 4} width={node.width} height={node.height} rx={config.rx} ry={config.rx} fill="rgba(100,60,200,0.18)" />
                    <Rect x={node.x} y={node.y} width={node.width} height={node.height} rx={config.rx} ry={config.rx} fill="url(#rootGrad)" />
                    <Rect x={node.x + 1} y={node.y + 1} width={node.width - 2} height={node.height - 2} rx={config.rx - 1} ry={config.rx - 1} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
                    {lines.map((line, li) => (
                        <SvgText key={li} x={node.x + node.width / 2} y={node.y + node.height / 2 - ((lines.length - 1) * lineHeight) / 2 + li * lineHeight + config.fontSize / 3} textAnchor="middle" fill="#FFFFFF" fontSize={config.fontSize} fontWeight={config.fontWeight} fontFamily="System">{line}</SvgText>
                    ))}
                </G>
            );
        }

        // Branch node (depth 1)
        if (node.depth === 1) {
            return (
                <G key={node.id}>
                    <Rect x={node.x + 1} y={node.y + 3} width={node.width} height={node.height} rx={config.rx} ry={config.rx} fill="rgba(0,0,0,0.06)" />
                    <Rect x={node.x} y={node.y + 4} width={5} height={node.height - 8} rx={2.5} ry={2.5} fill={node.accentColor} />
                    <Rect x={node.x + 4} y={node.y} width={node.width - 4} height={node.height} rx={config.rx} ry={config.rx} fill={node.color} stroke={node.borderColor} strokeWidth={1} />
                    {lines.map((line, li) => (
                        <SvgText key={li} x={node.x + 20} y={node.y + node.height / 2 - ((lines.length - 1) * lineHeight) / 2 + li * lineHeight + config.fontSize / 3} textAnchor="start" fill="#1E293B" fontSize={config.fontSize} fontWeight={config.fontWeight} fontFamily="System">{line}</SvgText>
                    ))}
                    {hasChildren && (
                        <G>
                            <Circle cx={node.x + node.width - 16} cy={node.y + node.height / 2} r={9} fill={node.accentColor} opacity={0.12} />
                            {node.collapsed ? (
                                <Line x1={node.x + node.width - 19.5} y1={node.y + node.height / 2} x2={node.x + node.width - 12.5} y2={node.y + node.height / 2} stroke={node.accentColor} strokeWidth={1.8} strokeLinecap="round" />
                            ) : (
                                <G>
                                    <Line x1={node.x + node.width - 19.5} y1={node.y + node.height / 2} x2={node.x + node.width - 12.5} y2={node.y + node.height / 2} stroke={node.accentColor} strokeWidth={1.8} strokeLinecap="round" />
                                    <Line x1={node.x + node.width - 16} y1={node.y + node.height / 2 - 3.5} x2={node.x + node.width - 16} y2={node.y + node.height / 2 + 3.5} stroke={node.accentColor} strokeWidth={1.8} strokeLinecap="round" />
                                </G>
                            )}
                        </G>
                    )}
                </G>
            );
        }

        // Leaf/sub node (depth >= 2)
        const lightBg = node.lightBg || "#FAFAFA";
        return (
            <G key={node.id}>
                <Rect x={node.x + 1} y={node.y + 2} width={node.width} height={node.height} rx={config.rx} ry={config.rx} fill="rgba(0,0,0,0.04)" />
                <Rect x={node.x} y={node.y} width={node.width} height={node.height} rx={config.rx} ry={config.rx} fill={lightBg} stroke={node.borderColor} strokeWidth={0.8} opacity={0.95} />
                <Circle cx={node.x + 12} cy={node.y + node.height / 2} r={3} fill={node.accentColor} opacity={0.4} />
                {lines.map((line, li) => (
                    <SvgText key={li} x={node.x + 22} y={node.y + node.height / 2 - ((lines.length - 1) * lineHeight) / 2 + li * lineHeight + config.fontSize / 3} textAnchor="start" fill="#334155" fontSize={config.fontSize} fontWeight={config.fontWeight} fontFamily="System">{line}</SvgText>
                ))}
                {hasChildren && (
                    <G>
                        <Circle cx={node.x + node.width - 14} cy={node.y + node.height / 2} r={8} fill={node.accentColor} opacity={0.12} />
                        {node.collapsed ? (
                            <Line x1={node.x + node.width - 17} y1={node.y + node.height / 2} x2={node.x + node.width - 11} y2={node.y + node.height / 2} stroke={node.accentColor} strokeWidth={1.8} strokeLinecap="round" />
                        ) : (
                            <G>
                                <Line x1={node.x + node.width - 17} y1={node.y + node.height / 2} x2={node.x + node.width - 11} y2={node.y + node.height / 2} stroke={node.accentColor} strokeWidth={1.8} strokeLinecap="round" />
                                <Line x1={node.x + node.width - 14} y1={node.y + node.height / 2 - 3} x2={node.x + node.width - 14} y2={node.y + node.height / 2 + 3} stroke={node.accentColor} strokeWidth={1.8} strokeLinecap="round" />
                            </G>
                        )}
                    </G>
                )}
            </G>
        );
    }, []);

    // ── Touch overlay helpers (coordinates in display space)
    const overlayNodes = useMemo(() => {
        if (fitScale === 0) return [];
        return nodes.map((node) => ({
            ...node,
            displayX: node.x * fitScale,
            displayY: node.y * fitScale,
            displayW: node.width * fitScale,
            displayH: node.height * fitScale,
        }));
    }, [nodes, fitScale]);

    return (
        <GestureHandlerRootView style={styles.root} onLayout={handleLayout}>
            {/* ══ Toolbar ══ */}
            <View style={styles.toolbar}>
                <TouchableOpacity activeOpacity={0.7} style={styles.toolbarBtn} onPress={handleExpandAll}>
                    <ChevronsUpDown size={18} color="#7C3AED" />
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.7} style={styles.toolbarBtn} onPress={handleCollapseAll}>
                    <ChevronsDownUp size={18} color="#7C3AED" />
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.7} style={styles.toolbarBtn} onPress={fitView}>
                    <Maximize2 size={18} color="#7C3AED" />
                </TouchableOpacity>
            </View>

            {/* ══ Mind map ══ */}
            {containerSize.width > 0 && containerSize.height > 0 && (
                <GestureDetector gesture={composedGesture}>
                    <Animated.View style={[styles.mapContainer, animatedStyle]}>
                        <Svg
                            width={svgDisplayWidth}
                            height={svgDisplayHeight}
                            viewBox={`0 0 ${bounds.width} ${bounds.height}`}
                        >
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
                            {nodes.map(renderSvgNode)}
                        </Svg>

                        {/* Touchable overlays (in display coordinates) */}
                        {overlayNodes.map((node) => {
                            if (node.depth === 0) return null;
                            return (
                                <TouchableOpacity
                                    key={`t-${node.id}`}
                                    activeOpacity={0.7}
                                    style={{
                                        position: "absolute",
                                        left: node.displayX,
                                        top: node.displayY,
                                        width: node.displayW,
                                        height: node.displayH,
                                        borderRadius: (NODE_CONFIGS[node.depth as keyof typeof NODE_CONFIGS]?.rx ?? 10) * fitScale,
                                    }}
                                    onPress={() => handleNodePress(node.id, node.depth)}
                                />
                            );
                        })}
                    </Animated.View>
                </GestureDetector>
            )}
        </GestureHandlerRootView>
    );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: "#FDFBFF",
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
    },
    mapContainer: {
        alignItems: "center",
        justifyContent: "center",
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
});
