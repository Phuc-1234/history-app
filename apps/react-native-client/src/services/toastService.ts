export type ToastType = "success" | "error" | "info";

export type ToastListener = (message: string, type: ToastType, duration?: number) => void;

let listener: ToastListener | null = null;

export const toastService = {
    /**
     * Subscribe to toast events (used by the Global Toast component in root layout)
     */
    subscribe(fn: ToastListener) {
        listener = fn;
        return () => {
            listener = null;
        };
    },

    /**
     * Show a beautiful floating toast banner
     */
    show(message: string, type: ToastType = "success", duration?: number) {
        if (listener) {
            listener(message, type, duration);
        }
    }
};
