// src/services/soundService.ts — Sound service for Test V2 using custom MP3 assets
import { Platform } from "react-native";

// ── Require user MP3 assets ───────────────────────────────────────────
let PRACTICE_CORRECT_ASSET: any = null;
let PRACTICE_WRONG_ASSET: any = null;
let TEST_PASS_ASSET: any = null;
let TEST_FAIL_ASSET: any = null;

try {
    PRACTICE_CORRECT_ASSET = require("../../assets/sounds/coin_mario.mp3");
} catch (e) {
    console.warn("[SoundService] Could not load coin_mario.mp3 asset:", e);
}

try {
    PRACTICE_WRONG_ASSET = require("../../assets/sounds/vine boom.mp3");
} catch (e) {
    console.warn("[SoundService] Could not load vine boom.mp3 asset:", e);
}

try {
    TEST_PASS_ASSET = require("../../assets/sounds/yatta.mp3");
} catch (e) {
    console.warn("[SoundService] Could not load yatta.mp3 asset:", e);
}

try {
    TEST_FAIL_ASSET = require("../../assets/sounds/meo`cuoi.mp3");
} catch (e) {
    console.warn("[SoundService] Could not load meo`cuoi.mp3 asset:", e);
}

// ── Native Sound Player (expo-av / expo-audio) ────────────────────────
let expoAudioModule: any = null;

try {
    expoAudioModule = require("expo-av");
} catch {
    try {
        expoAudioModule = require("expo-audio");
    } catch {
        expoAudioModule = null;
    }
}

async function playAssetOrUri(assetSource: any, fallbackToneSequence: Array<{ freq: number; duration: number; type?: OscillatorType; volume?: number }>) {
    // 1. Web Execution
    if (Platform.OS === "web") {
        try {
            if (assetSource) {
                const src = typeof assetSource === "string"
                    ? assetSource
                    : assetSource?.default || assetSource?.uri || assetSource;
                
                if (typeof src === "string" || typeof assetSource === "number") {
                    const audio = new Audio(src);
                    audio.volume = 0.8;
                    const playPromise = audio.play();
                    if (playPromise !== undefined) {
                        playPromise.catch((err) => {
                            console.warn("[SoundService] HTML5 Audio play error, falling back to synth:", err);
                            playWebToneSequence(fallbackToneSequence);
                        });
                    }
                    return;
                }
            }
        } catch (e) {
            console.warn("[SoundService] Web audio asset failed, using synth:", e);
        }
        playWebToneSequence(fallbackToneSequence);
        return;
    }

    // 2. Native Execution (iOS / Android)
    if (expoAudioModule?.Audio && assetSource) {
        try {
            const sourceParam = typeof assetSource === "string" ? { uri: assetSource } : assetSource;
            const { sound } = await expoAudioModule.Audio.Sound.createAsync(
                sourceParam,
                { shouldPlay: true, volume: 1.0 }
            );
            sound.setOnPlaybackStatusUpdate((status: any) => {
                if (status.didJustFinish) {
                    sound.unloadAsync().catch(() => {});
                }
            });
            return;
        } catch (err) {
            console.warn("[SoundService] Native expo-av asset playback failed:", err);
        }
    }
}

// ── Web Audio Synth Fallback (Zero-latency synth) ─────────────────────
function playWebToneSequence(notes: Array<{ freq: number; duration: number; type?: OscillatorType; volume?: number }>) {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;

        const ctx = new AudioCtx();
        let currentTime = ctx.currentTime;

        for (const note of notes) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = note.type || "sine";
            osc.frequency.setValueAtTime(note.freq, currentTime);

            const vol = note.volume ?? 0.3;
            gain.gain.setValueAtTime(vol, currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, currentTime + note.duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(currentTime);
            osc.stop(currentTime + note.duration);

            currentTime += note.duration * 0.85;
        }
    } catch (e) {
        console.warn("[SoundService] Web Audio synth failed:", e);
    }
}

// ── Public Sound Service API ──────────────────────────────────────────

/**
 * Play sound effect when answering correctly in PRACTICE mode (`coin_mario.mp3`).
 */
export function playPracticeCorrectSound() {
    void playAssetOrUri(PRACTICE_CORRECT_ASSET, [
        { freq: 523.25, duration: 0.1, type: "sine", volume: 0.35 },
        { freq: 783.99, duration: 0.25, type: "sine", volume: 0.45 },
    ]);
}

/**
 * Play sound effect when answering incorrectly in PRACTICE mode (`vine boom.mp3`).
 */
export function playPracticeWrongSound() {
    void playAssetOrUri(PRACTICE_WRONG_ASSET, [
        { freq: 349.23, duration: 0.12, type: "triangle", volume: 0.35 },
        { freq: 220.00, duration: 0.28, type: "sawtooth", volume: 0.30 },
    ]);
}

/**
 * Play sound effect upon finishing a test with PASS result (`yatta.mp3`).
 */
export function playTestPassSound() {
    void playAssetOrUri(TEST_PASS_ASSET, [
        { freq: 523.25, duration: 0.12, type: "sine", volume: 0.4 },
        { freq: 659.25, duration: 0.12, type: "sine", volume: 0.4 },
        { freq: 783.99, duration: 0.15, type: "sine", volume: 0.45 },
        { freq: 1046.50, duration: 0.5, type: "triangle", volume: 0.5 },
    ]);
}

/**
 * Play sound effect upon finishing a test with FAIL result (`meo`cuoi.mp3`).
 */
export function playTestFailSound() {
    void playAssetOrUri(TEST_FAIL_ASSET, [
        { freq: 440.00, duration: 0.16, type: "sawtooth", volume: 0.35 },
        { freq: 349.23, duration: 0.16, type: "sawtooth", volume: 0.35 },
        { freq: 293.66, duration: 0.45, type: "sawtooth", volume: 0.35 },
    ]);
}

export const soundService = {
    playPracticeCorrectSound,
    playPracticeWrongSound,
    playTestPassSound,
    playTestFailSound,
};

export default soundService;
