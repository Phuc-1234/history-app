import { useRef } from "react";
import { Animated, Dimensions, PanResponder } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface UseAiChatFabOptions {
    onPress: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

export function useAiChatFab({ onPress }: UseAiChatFabOptions) {
    const insets = useSafeAreaInsets();
    const pan = useRef(new Animated.ValueXY()).current;
    const isDragging = useRef(false);
    const lastOffset = useRef({ x: 0, y: 0 });

    const FAB_SIZE = 56;
    const MARGIN = 8;

    const defaultLeft = SCREEN_WIDTH - FAB_SIZE - 20;
    const defaultTop = SCREEN_HEIGHT - FAB_SIZE - (120 + insets.bottom);

    const minX = MARGIN - defaultLeft;
    const maxX = (SCREEN_WIDTH - FAB_SIZE - MARGIN) - defaultLeft;
    const minY = (insets.top + MARGIN) - defaultTop;
    const maxY = (SCREEN_HEIGHT - FAB_SIZE - insets.bottom - MARGIN) - defaultTop;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
            },
            onPanResponderGrant: () => {
                isDragging.current = false;
            },
            onPanResponderMove: (_, gestureState) => {
                if (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5) {
                    isDragging.current = true;
                }
                const newX = clamp(lastOffset.current.x + gestureState.dx, minX, maxX);
                const newY = clamp(lastOffset.current.y + gestureState.dy, minY, maxY);
                pan.x.setValue(newX);
                pan.y.setValue(newY);
            },
            onPanResponderRelease: (_, gestureState) => {
                const newX = clamp(lastOffset.current.x + gestureState.dx, minX, maxX);
                const newY = clamp(lastOffset.current.y + gestureState.dy, minY, maxY);
                lastOffset.current = { x: newX, y: newY };

                if (!isDragging.current && Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5) {
                    onPress();
                }
            },
            onPanResponderTerminate: () => {},
        })
    ).current;

    return {
        pan,
        panResponder,
        insets,
    };
}
