import React, { useEffect } from "react";
import { Path } from "react-native-svg";
import Animated, {
    Easing,
    interpolate,
    useAnimatedProps,
    useSharedValue,
    withDelay,
    withTiming,
    type SharedValue,
} from "react-native-reanimated";
import { animationConfig } from "../constants";

const AnimatedPath = Animated.createAnimatedComponent(Path);

export interface MindMapConnection {
    id: string;
    parentId: string;
    childId: string;
    path: string;
    color: string;
    strokeWidth: number;
    depth: number;
    length: number;
}

interface EdgePathProps {
    connection: MindMapConnection;
    // Shared value so dim/highlight runs on the UI thread without re-rendering JS.
    activeNodeId: SharedValue<string | null>;
    animate?: boolean;
}

// Custom memo comparator: the parent rebuilds every MindMapConnection as a new
// object on each expand/collapse, so default React.memo would re-render all
// edges every time. Deep-compare the fields this edge reads.
function areEdgePropsEqual(prev: EdgePathProps, next: EdgePathProps): boolean {
    if (
        prev.activeNodeId !== next.activeNodeId ||
        prev.animate !== next.animate
    ) {
        return false;
    }
    const a = prev.connection;
    const b = next.connection;
    if (a === b) return true;
    return (
        a.id === b.id &&
        a.parentId === b.parentId &&
        a.childId === b.childId &&
        a.depth === b.depth &&
        a.length === b.length &&
        a.strokeWidth === b.strokeWidth &&
        a.path === b.path &&
        a.color === b.color
    );
}

export const EdgePath = React.memo(function EdgePath({
    connection,
    activeNodeId,
    animate = true,
}: EdgePathProps) {
    const draw = useSharedValue(animate ? 0 : 1);

    useEffect(() => {
        // Skip the draw-in animation entirely on mobile — animating every edge on
        // load/expand is a jank burst on low-end devices. Render at full length.
        if (!animate) {
            draw.value = 1;
            return;
        }
        draw.value = 0;
        draw.value = withDelay(
            animationConfig.edgeBaseDelay +
                connection.depth * animationConfig.edgeDepthDelay,
            withTiming(1, {
                duration: animationConfig.edgeDuration,
                easing: Easing.out(Easing.cubic),
            }),
        );
    }, [animate, connection.id, connection.depth, draw]);

    const animatedProps = useAnimatedProps(() => {
        const opacity = animationConfig.edgeIdleOpacity;

        return {
            strokeDashoffset: connection.length * (1 - draw.value),
            opacity: opacity * draw.value,
            strokeWidth: connection.strokeWidth,
        };
    });

    return (
        <AnimatedPath
            d={connection.path}
            stroke={connection.color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={`${connection.length} ${connection.length}`}
            fill="none"
            animatedProps={animatedProps}
        />
    );
}, areEdgePropsEqual);
