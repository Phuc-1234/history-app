import { useRef, useCallback } from "react";

export function usePreventDoubleTap() {
    const isLockedRef = useRef(false);

    const preventDoubleTap = useCallback(
        <T extends (...args: any[]) => any>(cb: T, delay = 1000) => {
            return (...args: Parameters<T>) => {
                if (isLockedRef.current) return;
                isLockedRef.current = true;
                cb(...args);
                setTimeout(() => {
                    isLockedRef.current = false;
                }, delay);
            };
        },
        []
    );

    return preventDoubleTap;
}
