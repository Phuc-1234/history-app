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

export const EdgePath = React.memo(function EdgePath({ connection, activeNodeId, animate = true }: EdgePathProps) {
    const draw = useSharedValue(animate ? 0 : 1);
    const focus = useSharedValue(0);

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
        // Dim/highlight on the UI thread from the shared activeNodeId — no JS
        // re-render when a node is pressed/hovered (this was the jank cause).
        const active = activeNodeId.value;
        const isRelated =
            active === connection.parentId || active === connection.childId;
        const target = !active ? 0.45 : isRelated ? 1 : 0;

        const idleOpacity = animationConfig.edgeIdleOpacity;
        const opacity = active
            ? interpolate(
                  target,
                  [0, 1],
                  [animationConfig.edgeDimOpacity, animationConfig.edgeActiveOpacity],
              )
            : idleOpacity;

        return {
            strokeDashoffset: connection.length * (1 - draw.value),
            opacity: opacity * draw.value,
            strokeWidth:
                connection.strokeWidth +
                (isRelated ? (connection.depth === 1 ? 1 : 0.6) : 0),
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
});
