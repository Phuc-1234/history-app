import AsyncStorage from "@react-native-async-storage/async-storage";

const EASTER_EGG_ENG_MODE_KEY = "@easter_egg_eng_mode";

type Listener = (enabled: boolean) => void;

class EasterEggService {
    private engMode: boolean = false;
    private listeners: Set<Listener> = new Set();
    private initialized: boolean = false;

    constructor() {
        this.init();
    }

    private async init() {
        try {
            const stored = await AsyncStorage.getItem(EASTER_EGG_ENG_MODE_KEY);
            if (stored !== null) {
                this.engMode = stored === "true";
            }
        } catch (error) {
            console.error("Failed to load easter egg state:", error);
        } finally {
            this.initialized = true;
            this.notify();
        }
    }

    public isEngModeEnabled(): boolean {
        return this.engMode;
    }

    public async setEngMode(enabled: boolean): Promise<void> {
        this.engMode = enabled;
        try {
            await AsyncStorage.setItem(EASTER_EGG_ENG_MODE_KEY, String(enabled));
        } catch (error) {
            console.error("Failed to save easter egg state:", error);
        }
        this.notify();
    }

    public subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        // Fire immediately with current state
        listener(this.engMode);
        return () => {
            this.listeners.delete(listener);
        };
    }

    private notify() {
        this.listeners.forEach((listener) => listener(this.engMode));
    }
}

export const easterEggService = new EasterEggService();
