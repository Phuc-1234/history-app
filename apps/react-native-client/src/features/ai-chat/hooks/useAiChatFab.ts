import { useRef, useState } from "react";
import { Animated, Dimensions, PanResponder } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { hapticLight, hapticMedium } from "@/services/hapticsService";

interface UseAiChatFabOptions {
    onPress: () => void;
    onDismiss?: () => void;
}

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

export function useAiChatFab({ onPress, onDismiss }: UseAiChatFabOptions) {
    const insets = useSafeAreaInsets();
    const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

    const pan = useRef(new Animated.ValueXY()).current;
    const fabScale = useRef(new Animated.Value(1)).current;
    const fabOpacity = useRef(new Animated.Value(1)).current;
    const targetAnim = useRef(new Animated.Value(0)).current;
    const targetHoverScale = useRef(new Animated.Value(1)).current;

    const [isDragging, setIsDragging] = useState(false);
    const [isCaptured, setIsCaptured] = useState(false);

    const isDraggingRef = useRef(false);
    const capturedRef = useRef(false);
    const lastOffset = useRef({ x: 0, y: 0 });

    const FAB_SIZE = 56;
    const TARGET_SIZE = 60;
    const MARGIN = 8;
    const BOTTOM_OFFSET = 120;
    const TARGET_BOTTOM_SPACING = 32;
    const CAPTURE_RADIUS = 95;

    const fabInitLeft = screenWidth - FAB_SIZE - 20;
    const fabInitTop = screenHeight - FAB_SIZE - (BOTTOM_OFFSET + insets.bottom);

    const targetCenterX = screenWidth / 2;
    const targetCenterY = screenHeight - (TARGET_BOTTOM_SPACING + insets.bottom) - TARGET_SIZE / 2;

    const targetPanX = targetCenterX - (fabInitLeft + FAB_SIZE / 2);
    const targetPanY = targetCenterY - (fabInitTop + FAB_SIZE / 2);

    const minX = MARGIN - fabInitLeft;
    const maxX = screenWidth - FAB_SIZE - MARGIN - fabInitLeft;
    const minY = insets.top + MARGIN - fabInitTop;
    const maxY = screenHeight - FAB_SIZE - insets.bottom - MARGIN - fabInitTop;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
            },
            onPanResponderGrant: () => {
                isDraggingRef.current = false;
                capturedRef.current = false;
                setIsCaptured(false);
                fabScale.setValue(1);
                fabOpacity.setValue(1);
                targetHoverScale.setValue(1);
            },
            onPanResponderMove: (_, gestureState) => {
                if (Math.abs(gestureState.dx) > 6 || Math.abs(gestureState.dy) > 6) {
                    if (!isDraggingRef.current) {
                        isDraggingRef.current = true;
                        setIsDragging(true);
                        Animated.spring(targetAnim, {
                            toValue: 1,
                            friction: 7,
                            tension: 45,
                            useNativeDriver: false,
                        }).start();
                    }
                }

                const rawX = lastOffset.current.x + gestureState.dx;
                const rawY = lastOffset.current.y + gestureState.dy;

                const distX = rawX - targetPanX;
                const distY = rawY - targetPanY;
                const dist = Math.hypot(distX, distY);

                if (dist < CAPTURE_RADIUS) {
                    if (!capturedRef.current) {
                        capturedRef.current = true;
                        setIsCaptured(true);
                        hapticMedium();
                        Animated.spring(targetHoverScale, {
                            toValue: 1.25,
                            friction: 6,
                            tension: 50,
                            useNativeDriver: false,
                        }).start();
                        Animated.spring(fabScale, {
                            toValue: 0.75,
                            friction: 6,
                            tension: 50,
                            useNativeDriver: false,
                        }).start();
                    }

                    const pullProgress = dist / CAPTURE_RADIUS;
                    const pullFactor = Math.pow(pullProgress, 2) * 0.25;
                    const pulledX = targetPanX + distX * pullFactor;
                    const pulledY = targetPanY + distY * pullFactor;
                    pan.x.setValue(pulledX);
                    pan.y.setValue(pulledY);
                } else {
                    if (capturedRef.current) {
                        capturedRef.current = false;
                        setIsCaptured(false);
                        Animated.timing(targetHoverScale, {
                            toValue: 1,
                            duration: 150,
                            useNativeDriver: false,
                        }).start();
                        Animated.timing(fabScale, {
                            toValue: 1,
                            duration: 150,
                            useNativeDriver: false,
                        }).start();
                    }

                    const clampedX = clamp(rawX, minX, maxX);
                    const clampedY = clamp(rawY, minY, maxY);
                    pan.x.setValue(clampedX);
                    pan.y.setValue(clampedY);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (capturedRef.current) {
                    hapticLight();
                    Animated.parallel([
                        Animated.timing(pan, {
                            toValue: { x: targetPanX, y: targetPanY },
                            duration: 120,
                            useNativeDriver: false,
                        }),
                        Animated.timing(fabScale, {
                            toValue: 0,
                            duration: 150,
                            useNativeDriver: false,
                        }),
                        Animated.timing(fabOpacity, {
                            toValue: 0,
                            duration: 150,
                            useNativeDriver: false,
                        }),
                        Animated.timing(targetAnim, {
                            toValue: 0,
                            duration: 180,
                            useNativeDriver: false,
                        }),
                    ]).start(() => {
                        isDraggingRef.current = false;
                        capturedRef.current = false;
                        setIsDragging(false);
                        setIsCaptured(false);
                        lastOffset.current = { x: 0, y: 0 };
                        pan.setValue({ x: 0, y: 0 });
                        fabScale.setValue(1);
                        fabOpacity.setValue(1);
                        onDismiss?.();
                    });
                } else {
                    Animated.timing(targetAnim, {
                        toValue: 0,
                        duration: 180,
                        useNativeDriver: false,
                    }).start(() => {
                        setIsDragging(false);
                    });

                    if (isDraggingRef.current) {
                        const curX = clamp(lastOffset.current.x + gestureState.dx, minX, maxX);
                        const curY = clamp(lastOffset.current.y + gestureState.dy, minY, maxY);
                        const curCenterX = fabInitLeft + FAB_SIZE / 2 + curX;
                        const snapX = curCenterX < screenWidth / 2 ? minX : maxX;
                        const snapY = curY;
                        lastOffset.current = { x: snapX, y: snapY };

                        Animated.parallel([
                            Animated.spring(pan.x, {
                                toValue: snapX,
                                friction: 6,
                                tension: 45,
                                useNativeDriver: false,
                            }),
                            Animated.spring(pan.y, {
                                toValue: snapY,
                                friction: 7,
                                tension: 50,
                                useNativeDriver: false,
                            }),
                        ]).start();
                    } else {
                        pan.x.setValue(lastOffset.current.x);
                        pan.y.setValue(lastOffset.current.y);
                        onPress();
                    }

                    isDraggingRef.current = false;
                }
            },
            onPanResponderTerminate: () => {
                Animated.timing(targetAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: false,
                }).start(() => {
                    setIsDragging(false);
                });
                isDraggingRef.current = false;
                capturedRef.current = false;
                setIsCaptured(false);
                Animated.spring(fabScale, {
                    toValue: 1,
                    useNativeDriver: false,
                }).start();
            },
        })
    ).current;

    return {
        pan,
        fabScale,
        fabOpacity,
        targetAnim,
        targetHoverScale,
        isDragging,
        isCaptured,
        panResponder,
        insets,
        FAB_SIZE,
        TARGET_SIZE,
        BOTTOM_OFFSET,
        TARGET_BOTTOM_SPACING,
    };
}
