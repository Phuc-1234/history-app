import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Pressable,
    Platform,
    type LayoutChangeEvent,
    ActivityIndicator,
    Text,
} from "react-native";
import Svg, {
    Path,
    Rect,
    Defs,
    LinearGradient as SvgLinearGradient,
    Stop,
} from "react-native-svg";
import { Maximize2, ChevronsDownUp, ChevronsUpDown } from "lucide-react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from "react-native-gesture-handler";

import {
    NODE_CONFIGS,
    SPRING_CONFIG,
    getScaleLimits,
    MOBILE_BREAKPOINT,
} from "../constants";
import type { MindMapNode, LayoutNode } from "../types";
import { useGetMindMapQuery, type MindMapQuery } from "../mindMapApi";
import {
    layoutTree,
    applyHorizontalPositions,
    normalizeCoordinates,
    computeBounds,
    buildBezierPath,
    measureMaxWidthsPerDepth,
} from "../utils/layout";
import { EdgePath, type MindMapConnection } from "./EdgePath";
import { NodeCard } from "./NodeCard";

interface MindMapScreenProps {
    query?: MindMapQuery;
}

function computeLayout(tree: MindMapNode, collapsedSet: Set<string>) {
    const maxWidths = measureMaxWidthsPerDepth(tree);
    const { nodes: raw } = layoutTree(tree, 0, 0, null, collapsedSet, maxWidths);
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

function getInitialCollapsed(tree: MindMapNode): Set<string> {
    const ids = new Set<string>();
    collectParentIds(tree, ids);
    ids.delete(tree.id);
    return ids;
}

export default function MindMapScreen({ query }: MindMapScreenProps) {
    const {
        data: mindMap,
        isLoading,
        isFetching,
        error,
    } = useGetMindMapQuery(query as MindMapQuery, {
        skip: !query,
    });
    const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const userScale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const savedTx = useSharedValue(0);
    const savedTy = useSharedValue(0);
    const contentProgress = useSharedValue(1);

    useEffect(() => {
        if (mindMap) {
            setCollapsedNodes(getInitialCollapsed(mindMap));
        }
    }, [mindMap]);

    const { nodes, bounds } = useMemo(
        () =>
            mindMap
                ? computeLayout(mindMap, collapsedNodes)
                : { nodes: [] as LayoutNode[], bounds: { width: 400, height: 300 } },
        [mindMap, collapsedNodes],
    );

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

    const svgDisplayWidth = bounds.width * fitScale;
    const svgDisplayHeight = bounds.height * fitScale;
    const mapCenter = useMemo(
        () => ({ x: bounds.width / 2, y: bounds.height / 2 }),
        [bounds.height, bounds.width],
    );

    const handleLayout = useCallback((e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        setContainerSize({ width, height });
    }, []);

    useEffect(() => {
        translateX.value = 0;
        translateY.value = 0;
        userScale.value = 1;
        savedScale.value = 1;
        savedTx.value = 0;
        savedTy.value = 0;
        contentProgress.value = 0.92;
        contentProgress.value = withTiming(1, {
            duration: 260,
            easing: Easing.out(Easing.cubic),
        });
    }, [
        bounds,
        contentProgress,
        savedScale,
        savedTx,
        savedTy,
        translateX,
        translateY,
        userScale,
    ]);

    const fitView = useCallback(() => {
        translateX.value = withSpring(0, SPRING_CONFIG);
        translateY.value = withSpring(0, SPRING_CONFIG);
        userScale.value = withSpring(1, SPRING_CONFIG);
        savedScale.value = 1;
        savedTx.value = 0;
        savedTy.value = 0;
        contentProgress.value = withTiming(1, {
            duration: 180,
            easing: Easing.out(Easing.cubic),
        });
    }, [
        contentProgress,
        savedScale,
        savedTx,
        savedTy,
        translateX,
        translateY,
        userScale,
    ]);

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
        [savedTx, savedTy, translateX, translateY],
    );

    const pinchGesture = useMemo(
        () => Gesture.Pinch().enabled(false),
        [],
    );

    const composedGesture = useMemo(
        () => Gesture.Race(pinchGesture, panGesture),
        [pinchGesture, panGesture],
    );

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: contentProgress.value,
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: userScale.value * contentProgress.value },
        ],
    }));

    const toggleCollapse = useCallback((nodeId: string) => {
        setCollapsedNodes((prev) => {
            const next = new Set(prev);
            if (next.has(nodeId)) {
                next.delete(nodeId);
            } else {
                next.add(nodeId);
            }
            return next;
        });
    }, []);

    const handleExpandAll = useCallback(() => setCollapsedNodes(new Set()), []);

    const handleCollapseAll = useCallback(() => {
        if (!mindMap) return;
        const ids = new Set<string>();
        collectParentIds(mindMap, ids);
        ids.delete(mindMap.id);
        setCollapsedNodes(ids);
    }, [mindMap]);

    const connections = useMemo(() => {
        const nodeMap = new Map(nodes.map((n) => [n.id, n]));
        const conns: MindMapConnection[] = [];
        for (const node of nodes) {
            if (!node.parentId) continue;
            const parent = nodeMap.get(node.parentId);
            if (!parent || parent.collapsed) continue;
            const fromX = parent.x + parent.width;
            const fromY = parent.y + parent.height / 2;
            const toX = node.x;
            const toY = node.y + node.height / 2;
            const dx = toX - fromX;
            const dy = toY - fromY;
            conns.push({
                id: `${parent.id}-${node.id}`,
                parentId: parent.id,
                childId: node.id,
                path: buildBezierPath(fromX, fromY, toX, toY),
                color: node.accentColor,
                strokeWidth: node.depth === 1 ? 2.5 : 1.5,
                depth: node.depth,
                length: Math.max(80, Math.hypot(dx, dy) * 1.35),
            });
        }
        return conns;
    }, [nodes]);

    const handleNodePress = useCallback(
        (nodeId: string, depth: number) => {
            if (depth === 0) return;
            const node = nodes.find((n) => n.id === nodeId);
            if (node && node.childIds.length > 0) toggleCollapse(nodeId);
        },
        [nodes, toggleCollapse],
    );

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
            <LinearGradient
                colors={["#F8FAFC", "#FDFBFF", "#F0F9FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            {!query && (
                <View style={styles.stateBox}>
                    <Text style={styles.stateTitle}>Thieu du lieu mind map</Text>
                    <Text style={styles.stateText}>
                        Vui long mo mind map tu chu de hoac bai hoc.
                    </Text>
                </View>
            )}

            {query && (isLoading || isFetching) && !mindMap && (
                <View style={styles.stateBox}>
                    <ActivityIndicator size="large" color="#7C3AED" />
                    <Text style={styles.stateText}>Dang tai mind map...</Text>
                </View>
            )}

            {query && error && !mindMap && (
                <View style={styles.stateBox}>
                    <Text style={styles.stateTitle}>Khong tai duoc mind map</Text>
                    <Text style={styles.stateText}>
                        Kiem tra ket noi API hoac du lieu bai hoc.
                    </Text>
                </View>
            )}

            {mindMap && (
                <View style={styles.toolbar}>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.toolbarBtn}
                        onPress={handleExpandAll}
                    >
                        <ChevronsUpDown size={18} color="#7C3AED" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.toolbarBtn}
                        onPress={handleCollapseAll}
                    >
                        <ChevronsDownUp size={18} color="#7C3AED" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.toolbarBtn}
                        onPress={fitView}
                    >
                        <Maximize2 size={18} color="#7C3AED" />
                    </TouchableOpacity>
                </View>
            )}

            {mindMap && containerSize.width > 0 && containerSize.height > 0 && (
                <GestureDetector gesture={composedGesture}>
                    <Animated.View style={[styles.mapContainer, animatedStyle]}>
                        <Svg
                            width={svgDisplayWidth}
                            height={svgDisplayHeight}
                            viewBox={`0 0 ${bounds.width} ${bounds.height}`}
                        >
                            <Defs>
                                <SvgLinearGradient id="canvasGrad" x1="0" y1="0" x2="1" y2="1">
                                    <Stop offset="0" stopColor="#F8FAFC" />
                                    <Stop offset="0.48" stopColor="#FDFBFF" />
                                    <Stop offset="1" stopColor="#F0F9FF" />
                                </SvgLinearGradient>
                                <SvgLinearGradient id="rootGrad" x1="0" y1="0" x2="1" y2="1">
                                    <Stop offset="0" stopColor="#7C3AED" />
                                    <Stop offset="0.5" stopColor="#6D28D9" />
                                    <Stop offset="1" stopColor="#4F46E5" />
                                </SvgLinearGradient>
                            </Defs>

                            <Rect
                                x={0}
                                y={0}
                                width={bounds.width}
                                height={bounds.height}
                                fill="url(#canvasGrad)"
                            />
                            <Path
                                d={`M 0 ${bounds.height * 0.18} C ${bounds.width * 0.25} ${bounds.height * 0.08}, ${bounds.width * 0.48} ${bounds.height * 0.3}, ${bounds.width} ${bounds.height * 0.16}`}
                                stroke="#DDD6FE"
                                strokeWidth={2}
                                fill="none"
                                opacity={0.42}
                            />
                            <Path
                                d={`M 0 ${bounds.height * 0.82} C ${bounds.width * 0.28} ${bounds.height * 0.7}, ${bounds.width * 0.6} ${bounds.height * 0.92}, ${bounds.width} ${bounds.height * 0.76}`}
                                stroke="#BAE6FD"
                                strokeWidth={2}
                                fill="none"
                                opacity={0.36}
                            />

                            {connections.map((conn) => (
                                <EdgePath
                                    key={conn.id}
                                    connection={conn}
                                    activeNodeId={activeNodeId}
                                />
                            ))}

                            {nodes.map((node, index) => (
                                <NodeCard
                                    key={node.id}
                                    node={node}
                                    index={index}
                                    center={mapCenter}
                                    activeNodeId={activeNodeId}
                                />
                            ))}
                        </Svg>

                        {overlayNodes.map((node) => {
                            return (
                                <Pressable
                                    key={`t-${node.id}`}
                                    style={{
                                        position: "absolute",
                                        left: node.displayX,
                                        top: node.displayY,
                                        width: node.displayW,
                                        height: node.displayH,
                                        borderRadius:
                                            (NODE_CONFIGS[
                                                node.depth as keyof typeof NODE_CONFIGS
                                            ]?.rx ?? 10) * fitScale,
                                    }}
                                    onHoverIn={() => setActiveNodeId(node.id)}
                                    onHoverOut={() => setActiveNodeId(null)}
                                    onPressIn={() => setActiveNodeId(node.id)}
                                    onPressOut={() => setActiveNodeId(null)}
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

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: "#F8FAFC",
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
        backgroundColor: "rgba(255,255,255,0.94)",
        borderRadius: 18,
        padding: 7,
        borderWidth: 1,
        borderColor: "rgba(124,58,237,0.12)",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: { elevation: 4 },
            web: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
        }),
    },
    toolbarBtn: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: "#F4F0FF",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#E9D5FF",
    },
    stateBox: {
        maxWidth: 320,
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        padding: 22,
        paddingHorizontal: 24,
        alignItems: "center",
        gap: 10,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.08,
                shadowRadius: 18,
            },
            android: { elevation: 3 },
            web: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.08,
                shadowRadius: 18,
            },
        }),
    },
    stateTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1C1C1E",
        textAlign: "center",
    },
    stateText: {
        fontSize: 14,
        color: "#6B7280",
        textAlign: "center",
        lineHeight: 20,
    },
});
