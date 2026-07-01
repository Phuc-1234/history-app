import React, {
    useState,
    useCallback,
    useMemo,
    useEffect,
    useRef,
} from "react";
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Pressable,
    Platform,
    InteractionManager,
    type LayoutChangeEvent,
    ActivityIndicator,
    Text,
} from "react-native";
import Svg, {
    Path,
    Defs,
    LinearGradient as SvgLinearGradient,
    Stop,
} from "react-native-svg";
import { Maximize2, ChevronsDownUp, ChevronsUpDown } from "lucide-react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from "react-native-gesture-handler";

import { getScaleLimits, MOBILE_BREAKPOINT } from "../constants";
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

function clamp(value: number, min: number, max: number) {
    "worklet";
    return Math.max(min, Math.min(max, value));
}

function getNodesBounds(nodes: LayoutNode[]) {
    if (nodes.length === 0) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const node of nodes) {
        minX = Math.min(minX, node.x);
        minY = Math.min(minY, node.y);
        maxX = Math.max(maxX, node.x + node.width);
        maxY = Math.max(maxY, node.y + node.height);
    }

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function getFitScaleForBounds(
    bounds: { width: number; height: number },
    containerSize: { width: number; height: number },
) {
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

    // Limit maximum layout size to prevent "Canvas too large" crashes on Android
    const maxDim = Math.max(bounds.width, bounds.height);
    const SAFE_MAX_DP = 1000;
    if (maxDim * fs > SAFE_MAX_DP) {
        fs = SAFE_MAX_DP / maxDim;
    }

    return fs;
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
    const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(
        new Set(),
    );
    const [lastInitializedId, setLastInitializedId] = useState<string | null>(null);

    if (mindMap && lastInitializedId !== mindMap.id) {
        setCollapsedNodes(getInitialCollapsed(mindMap));
        setLastInitializedId(mindMap.id);
    }

    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    // Shared value: dim/highlight runs on the UI thread, so pressing a node no
    // longer re-renders the whole node+edge tree (the main jank cause).
    const activeNodeId = useSharedValue<string | null>(null);

    const containerSizeRef = useRef(containerSize);
    containerSizeRef.current = containerSize;
    const isMobile =
        containerSize.width > 0 && containerSize.width < MOBILE_BREAKPOINT;

    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const userScale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const savedTx = useSharedValue(0);
    const savedTy = useSharedValue(0);
    const pinchStartScale = useSharedValue(1);
    const minScale = useSharedValue(0.35);
    const maxScale = useSharedValue(2.5);
    const contentProgress = useSharedValue(1);

    useEffect(() => {
        const limits = getScaleLimits(isMobile);
        minScale.value = limits.min;
        maxScale.value = limits.max;
    }, [isMobile, maxScale, minScale]);

    // Width-per-depth depends ONLY on the tree shape, not on what's collapsed, so
    // memoize it on `mindMap` alone — otherwise Expand/Collapse all re-walks the
    // entire tree every time for no reason.
    const maxWidths = useMemo(
        () => (mindMap ? measureMaxWidthsPerDepth(mindMap) : null),
        [mindMap],
    );

    const { nodes, bounds } = useMemo(() => {
        if (!mindMap || !maxWidths) {
            return {
                nodes: [] as LayoutNode[],
                bounds: { width: 400, height: 300 },
            };
        }
        const { nodes: raw } = layoutTree(
            mindMap,
            0,
            0,
            null,
            collapsedNodes,
            maxWidths,
        );
        const positioned = applyHorizontalPositions(raw);
        const normalized = normalizeCoordinates(positioned);
        return { nodes: normalized, bounds: computeBounds(normalized) };
    }, [mindMap, maxWidths, collapsedNodes]);

    const fitScale = useMemo(
        () => getFitScaleForBounds(bounds, containerSize),
        [bounds, containerSize],
    );

    const svgDisplayWidth = bounds.width * fitScale;
    const svgDisplayHeight = bounds.height * fitScale;
    // Map center as a SharedValue so updating it (on expand/collapse, when bounds
    // change) does NOT re-render every NodeCard. Previously `center` was a plain
    // object recreated each layout, which broke React.memo(NodeCard) and re-rendered
    // the whole tree on every expand — a real perf regression on "Expand all".
    const mapCenter = useSharedValue({
        x: bounds.width / 2,
        y: bounds.height / 2,
    });
    useEffect(() => {
        mapCenter.value = { x: bounds.width / 2, y: bounds.height / 2 };
    }, [bounds.width, bounds.height, mapCenter]);

    const handleLayout = useCallback((e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        setContainerSize({ width, height });
    }, []);

    useEffect(() => {
        translateX.value = 0;
        translateY.value = 0;
        userScale.value = 1;
        savedScale.value = 1;
        pinchStartScale.value = 1;
        savedTx.value = 0;
        savedTy.value = 0;
        contentProgress.value = 0.92;
        contentProgress.value = withTiming(1, {
            duration: 260,
            easing: Easing.out(Easing.cubic),
        });
    }, [
        containerSize.height,
        containerSize.width,
        contentProgress,
        mindMap?.id,
        pinchStartScale,
        savedScale,
        savedTx,
        savedTy,
        translateX,
        translateY,
        userScale,
    ]);

    const fitView = useCallback(() => {
        // Timing (not spring) so the camera settles without overshooting/bouncing.
        const TIMING = {
            duration: 300,
            easing: Easing.out(Easing.cubic),
        } as const;
        translateX.value = withTiming(0, TIMING);
        translateY.value = withTiming(0, TIMING);
        userScale.value = withTiming(1, TIMING);
        savedScale.value = 1;
        pinchStartScale.value = 1;
        savedTx.value = 0;
        savedTy.value = 0;
        contentProgress.value = withTiming(1, {
            duration: 180,
            easing: Easing.out(Easing.cubic),
        });
    }, [
        contentProgress,
        pinchStartScale,
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
                // Single-finger pan only, so two-finger pinch doesn't drag the map.
                .maxPointers(1)
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
        () =>
            Gesture.Pinch()
                .onStart(() => {
                    pinchStartScale.value = savedScale.value;
                })
                .onUpdate((e) => {
                    userScale.value = clamp(
                        pinchStartScale.value * e.scale,
                        minScale.value,
                        maxScale.value,
                    );
                })
                .onEnd(() => {
                    savedScale.value = userScale.value;
                }),
        [maxScale, minScale, pinchStartScale, savedScale, userScale],
    );

    const composedGesture = useMemo(
        () => Gesture.Race(panGesture, pinchGesture),
        [panGesture, pinchGesture],
    );

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: contentProgress.value,
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: userScale.value * contentProgress.value },
        ],
    }));

    const focusOnContentBox = useCallback(
        (
            box: { x: number; y: number; width: number; height: number },
            contentBounds: { width: number; height: number },
        ) => {
            const cs = containerSizeRef.current;
            if (cs.width === 0 || cs.height === 0) return;
            const fs = getFitScaleForBounds(contentBounds, cs);
            const svgW = contentBounds.width * fs;
            const svgH = contentBounds.height * fs;
            const limits = getScaleLimits(cs.width < MOBILE_BREAKPOINT);

            const boxCenterX = box.x + box.width / 2;
            const boxCenterY = box.y + box.height / 2;
            // Offset of the box center from the SVG center, in display px, pre-scale.
            const fromCenterX = -svgW / 2 + boxCenterX * fs;
            const fromCenterY = -svgH / 2 + boxCenterY * fs;

            const boxDisplayW = box.width * fs;
            const boxDisplayH = box.height * fs;
            const fit = Math.min(
                cs.width / Math.max(boxDisplayW, 1),
                cs.height / Math.max(boxDisplayH, 1),
            );
            const targetScale = clamp(fit * 0.82, limits.min, limits.max);

            const tx = -fromCenterX * targetScale;
            const ty = -fromCenterY * targetScale;

            // Timing (not spring) so the camera glides to the target without the
            // overshoot/bounce that read as the "khùng nổi / nhảy" jolt on expand.
            const TIMING = {
                duration: 300,
                easing: Easing.out(Easing.cubic),
            } as const;
            translateX.value = withTiming(tx, TIMING);
            translateY.value = withTiming(ty, TIMING);
            userScale.value = withTiming(targetScale, TIMING);
            savedTx.value = tx;
            savedTy.value = ty;
            savedScale.value = targetScale;
            pinchStartScale.value = targetScale;
            contentProgress.value = withTiming(1, {
                duration: 180,
                easing: Easing.out(Easing.cubic),
            });
        },
        [
            contentProgress,
            pinchStartScale,
            savedScale,
            savedTx,
            savedTy,
            translateX,
            translateY,
            userScale,
        ],
    );

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

    const handleExpandAll = useCallback(() => {
        // Defer the heavy layout so the tap is acknowledged first and the rebuild
        // runs as a single batched frame instead of janking the UI thread (mobile).
        const run = () => setCollapsedNodes(new Set());
        if (Platform.OS === "web") {
            run();
        } else {
            InteractionManager.runAfterInteractions(run);
        }
    }, []);

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

    // Display-space rects for the transparent hit layer. We do NOT render one
    // Pressable per node — that creates N native views and is the main cause of
    // jank when "Expand all" mounts dozens of nodes at once on mobile. Instead we
    // keep a single overlay Pressable and hit-test by coordinates (see below).
    // The rects are stored in a ref so the tap handler can read the latest set
    // without re-binding on every layout change.
    const hitRects = useMemo(() => {
        if (fitScale === 0) return [];
        return nodes.map((node) => {
            const hasChildren = node.childIds.length > 0;
            const iconOffset = node.depth === 1 ? 16 : 14;
            const iconX = (node.x + node.width - iconOffset) * fitScale;
            const iconY = (node.y + node.height / 2) * fitScale;
            return {
                id: node.id,
                depth: node.depth,
                x: node.x * fitScale,
                y: node.y * fitScale,
                w: node.width * fitScale,
                h: node.height * fitScale,
                hasChildren,
                iconX,
                iconY,
            };
        });
    }, [nodes, fitScale]);
    const hitRectsRef = useRef(hitRects);
    hitRectsRef.current = hitRects;

    const lastExpandRef = useRef<string | null>(null);
    // Refs mirror the memoized values so handleNodePress has a STABLE identity
    // (empty deps). That keeps React.memo(NodeCard) effective: tapping one node
    // no longer forces every other node to re-render (jank on tap).
    const collapsedNodesRef = useRef(collapsedNodes);
    collapsedNodesRef.current = collapsedNodes;
    const nodesRef = useRef(nodes);
    nodesRef.current = nodes;

    const handleNodePress = useCallback(
        (nodeId: string, depth: number) => {
            if (depth === 0) return;
            const node = nodesRef.current.find((n) => n.id === nodeId);
            if (!node || node.childIds.length === 0) return;

            // If this tap expands the node, remember it so we can focus its direct
            // children AFTER the memoized layout recomputes. This avoids running a
            // second synchronous computeLayout() here on the JS thread (jank on tap).
            if (collapsedNodesRef.current.has(nodeId)) {
                lastExpandRef.current = nodeId;
            }
            toggleCollapse(nodeId);
        },
        [toggleCollapse],
    );

    // Single-overlay hit testing: find the topmost node whose rect contains the
    // tap point (in display space). Returns the node id/depth or null. This lets
    // us replace N native Pressables with ONE overlay Pressable — the main win
    // for "Expand all" jank on mobile (native view creation is expensive).
    const hitTest = useCallback((px: number, py: number) => {
        const rects = hitRectsRef.current;
        for (let i = rects.length - 1; i >= 0; i -= 1) {
            const r = rects[i];
            if (!r.hasChildren || r.depth === 0) continue;

            // Check if the touch point is close to the collapse/expand icon (24 dp touch target radius)
            const dist = Math.hypot(px - r.iconX, py - r.iconY);
            if (dist <= 24) {
                return r;
            }
        }
        return null;
    }, []);

    // A minimal event shape covering what we read from both press and hover
    // handlers (GestureResponderEvent / MouseEvent). locationX/locationY are
    // present on responder/touch events; we only hit-test on those.
    type ResponderEvent = {
        nativeEvent: { locationX?: number; locationY?: number };
    };

    const handleOverlayPressIn = useCallback(
        (e: ResponderEvent) => {
            const { locationX, locationY } = e.nativeEvent;
            if (locationX == null || locationY == null) return;
            const hit = hitTest(locationX, locationY);
            if (hit) activeNodeId.value = hit.id;
        },
        [hitTest],
    );

    const handleOverlayPressOut = useCallback(() => {
        activeNodeId.value = null;
    }, []);

    const handleOverlayPress = useCallback(
        (e: ResponderEvent) => {
            const { locationX, locationY } = e.nativeEvent;
            if (locationX == null || locationY == null) return;
            const hit = hitTest(locationX, locationY);
            if (hit) handleNodePress(hit.id, hit.depth);
        },
        [handleNodePress, hitTest],
    );

    // Focus the just-expanded node's children using the already-computed layout
    // (nodes/bounds are memoized on collapsedNodes) instead of a 2nd layout pass.
    useEffect(() => {
        const expandedId = lastExpandRef.current;
        if (!expandedId) return;
        lastExpandRef.current = null;
        const targetNodes = nodes.filter(
            (n) => n.parentId === expandedId || n.id === expandedId,
        );
        const box = getNodesBounds(targetNodes);
        if (box) focusOnContentBox(box, bounds);
    }, [nodes, bounds, focusOnContentBox]);

    return (
        <GestureHandlerRootView style={styles.root} onLayout={handleLayout}>
            <LinearGradient
                colors={["#F8FAFC", "#FDFBFF", "#F0F9FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            <Svg
                style={StyleSheet.absoluteFill}
                width="100%"
                height="100%"
                pointerEvents="none"
            >
                <Path
                    d="M 0 140 C 120 80, 280 210, 420 130 C 540 70, 700 150, 900 110"
                    stroke="#DDD6FE"
                    strokeWidth={2}
                    fill="none"
                    opacity={0.42}
                />
                <Path
                    d="M -40 680 C 140 580, 320 760, 520 700 C 700 650, 860 760, 1040 690"
                    stroke="#BAE6FD"
                    strokeWidth={2}
                    fill="none"
                    opacity={0.36}
                />
            </Svg>
            <View style={styles.bgGlowTop} pointerEvents="none" />
            <View style={styles.bgGlowBottom} pointerEvents="none" />

            {!query && (
                <View style={styles.stateBox}>
                    <Text style={styles.stateTitle}>
                        Thieu du lieu mind map
                    </Text>
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
                    <Text style={styles.stateTitle}>
                        Khong tai duoc mind map
                    </Text>
                    <Text style={styles.stateText}>
                        Kiem tra ket noi API hoac du lieu bai hoc.
                    </Text>
                </View>
            )}

            {mindMap && (
                <View style={styles.toolbar}>
                    {/* <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.toolbarBtn}
                        onPress={handleExpandAll}
                    >
                        <ChevronsUpDown size={18} color="#7C3AED" />
                    </TouchableOpacity> */}
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
                    <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
                        <Animated.View style={[styles.mapContainer, animatedStyle]}>
                            <Svg
                                width={svgDisplayWidth}
                                height={svgDisplayHeight}
                                viewBox={`0 0 ${bounds.width} ${bounds.height}`}
                            >
                                <Defs>
                                    <SvgLinearGradient
                                        id="rootGrad"
                                        x1="0"
                                        y1="0"
                                        x2="1"
                                        y2="1"
                                    >
                                        <Stop offset="0" stopColor="#7C3AED" />
                                        <Stop offset="0.5" stopColor="#6D28D9" />
                                        <Stop offset="1" stopColor="#4F46E5" />
                                    </SvgLinearGradient>
                                </Defs>

                                {connections.map((conn) => (
                                    <EdgePath
                                        key={conn.id}
                                        connection={conn}
                                        activeNodeId={activeNodeId}
                                        animate={!isMobile}
                                    />
                                ))}

                                {nodes.map((node) => (
                                    <NodeCard
                                        key={node.id}
                                        node={node}
                                        center={mapCenter}
                                        activeNodeId={activeNodeId}
                                        animateEntry={!isMobile}
                                    />
                                ))}
                            </Svg>

                            {/* SINGLE transparent hit layer over the SVG. Previously this
                                was one Pressable per node — N native views that caused heavy
                                jank when "Expand all" mounted dozens of nodes at once. Now
                                it's one overlay that hit-tests by tap coordinates. Dim still
                                runs on the UI thread (shared value), so no re-render on tap. */}
                            <Pressable
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    top: 0,
                                    width: svgDisplayWidth,
                                    height: svgDisplayHeight,
                                }}
                                onPressIn={handleOverlayPressIn}
                                onPressOut={handleOverlayPressOut}
                                onPress={handleOverlayPress}
                            />
                        </Animated.View>
                    </View>
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
    bgGlowTop: {
        position: "absolute",
        top: -80,
        right: -60,
        width: 280,
        height: 280,
        borderRadius: 140,
        backgroundColor: "#DDD6FE",
        opacity: 0.18,
        pointerEvents: "none",
    },
    bgGlowBottom: {
        position: "absolute",
        bottom: -60,
        left: -40,
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: "#BAE6FD",
        opacity: 0.15,
        pointerEvents: "none",
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
