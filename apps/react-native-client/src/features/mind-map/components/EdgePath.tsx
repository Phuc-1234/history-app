import React, { useEffect } from "react";
import { Path } from "react-native-svg";
import Animated, {
    Easing,
    interpolate,
    useAnimatedProps,
    useSharedValue,
    withDelay,
    withTiming,
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
    activeNodeId: string | null;
}

export const EdgePath = React.memo(function EdgePath({ connection, activeNodeId }: EdgePathProps) {
    const draw = useSharedValue(0);
    const focus = useSharedValue(0);
    const isRelated =
        activeNodeId === connection.parentId || activeNodeId === connection.childId;

    useEffect(() => {
        draw.value = 0;
        draw.value = withDelay(
            animationConfig.edgeBaseDelay +
                connection.depth * animationConfig.edgeDepthDelay,
            withTiming(1, {
                duration: animationConfig.edgeDuration,
                easing: Easing.out(Easing.cubic),
            }),
        );
    }, [connection.id, connection.depth, draw]);

    useEffect(() => {
        const target = !activeNodeId ? 0.45 : isRelated ? 1 : 0;
        focus.value = withTiming(target, {
            duration: 180,
            easing: Easing.out(Easing.cubic),
        });
    }, [activeNodeId, focus, isRelated]);

    const animatedProps = useAnimatedProps(() => {
        const idleOpacity = animationConfig.edgeIdleOpacity;
        const opacity = activeNodeId
            ? interpolate(
                  focus.value,
                  [0, 1],
                  [animationConfig.edgeDimOpacity, animationConfig.edgeActiveOpacity],
              )
            : idleOpacity;

        return {
            strokeDashoffset: connection.length * (1 - draw.value),
            opacity: opacity * draw.value,
            strokeWidth:
                connection.strokeWidth +
                interpolate(focus.value, [0, 1], [0, connection.depth === 1 ? 1 : 0.6]),
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
