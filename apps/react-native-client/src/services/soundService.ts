// src/services/soundService.ts — Sound service for Test V2 using custom MP3 assets
import { Platform } from "react-native";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { Asset } from "expo-asset";
import { store } from "../store/store";

// ── Require user MP3 assets ───────────────────────────────────────────
let PRACTICE_CORRECT_ASSET: any = null;
let PRACTICE_WRONG_ASSET: any = null;
let TEST_PASS_ASSET: any = null;
let TEST_FAIL_ASSET: any = null;

let playerCorrect: any = null;
let playerWrong: any = null;
let playerTestPass: any = null;
let playerTestFail: any = null;

try {
    PRACTICE_CORRECT_ASSET = require("../../assets/sounds/correct.mp3");
    playerCorrect = createAudioPlayer(PRACTICE_CORRECT_ASSET);
} catch (e) {
    console.warn("[SoundService] Could not load correct.mp3 asset:", e);
}

try {
    PRACTICE_WRONG_ASSET = require("../../assets/sounds/incorrect.mp3");
    playerWrong = createAudioPlayer(PRACTICE_WRONG_ASSET);
} catch (e) {
    console.warn("[SoundService] Could not load incorrect.mp3 asset:", e);
}

try {
    TEST_PASS_ASSET = require("../../assets/sounds/pass answer.mp3");
    playerTestPass = createAudioPlayer(TEST_PASS_ASSET);
} catch (e) {
    console.warn("[SoundService] Could not load pass answer.mp3 asset:", e);
}

try {
    TEST_FAIL_ASSET = require("../../assets/sounds/game over.mp3");
    playerTestFail = createAudioPlayer(TEST_FAIL_ASSET);
} catch (e) {
    console.warn("[SoundService] Could not load game over.mp3 asset:", e);
}

let isAudioConfigured = false;
async function configureAudioSession() {
    if (isAudioConfigured) return;
    try {
        await setAudioModeAsync({
            playsInSilentMode: true,
            interruptionMode: "mixWithOthers",
        });
        isAudioConfigured = true;
    } catch {
        // Ignore audio mode configuration failure if not supported on platform
    }
}

async function playAssetOrUri(
    assetSource: any,
    fallbackToneSequence: Array<{ freq: number; duration: number; type?: OscillatorType; volume?: number }>,
    preloadedPlayer?: any
) {
    if (!store.getState().settings?.soundEnabled) return;

    await configureAudioSession();

    // 1. Try preloaded expo-audio player
    if (preloadedPlayer && Platform.OS !== "web") {
        try {
            preloadedPlayer.volume = 1.0;
            preloadedPlayer.seekTo(0);
            preloadedPlayer.play();
            return;
        } catch (e) {
            console.warn("[SoundService] preloaded expo-audio failed:", e);
        }
    }

    // 1b. Try dynamic expo-audio player
    if (assetSource != null) {
        try {
            const player = createAudioPlayer(assetSource);
            player.volume = 1.0;
            player.play();

            const subscription = player.addListener("playbackStatusUpdate", (status) => {
                if (status.didJustFinish) {
                    subscription?.remove();
                    try {
                        player.remove();
                    } catch {
                        // ignore
                    }
                }
            });
            return;
        } catch (expoAudioError) {
            console.warn("[SoundService] expo-audio failed, trying fallbacks:", expoAudioError);
        }
    }

    // 2. Web HTML5 Audio fallback
    if (Platform.OS === "web") {
        try {
            let audioUri: string | null = null;
            if (typeof assetSource === "string") {
                audioUri = assetSource;
            } else if (typeof assetSource === "number") {
                const asset = Asset.fromModule(assetSource);
                audioUri = asset.uri || asset.localUri || null;
            } else if (assetSource?.uri) {
                audioUri = assetSource.uri;
            }

            if (audioUri) {
                const audio = new Audio(audioUri);
                audio.volume = 0.8;
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => {
                        playWebToneSequence(fallbackToneSequence);
                    });
                }
                return;
            }
        } catch {
            // fallback to synth
        }

        playWebToneSequence(fallbackToneSequence);
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
    ], playerCorrect);
}

/**
 * Play sound effect when answering incorrectly in PRACTICE mode (`vine boom.mp3`).
 */
export function playPracticeWrongSound() {
    void playAssetOrUri(PRACTICE_WRONG_ASSET, [
        { freq: 349.23, duration: 0.12, type: "triangle", volume: 0.35 },
        { freq: 220.00, duration: 0.28, type: "sawtooth", volume: 0.30 },
    ], playerWrong);
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
    ], playerTestPass);
}

/**
 * Play sound effect upon finishing a test with FAIL result (`meo`cuoi.mp3`).
 */
export function playTestFailSound() {
    void playAssetOrUri(TEST_FAIL_ASSET, [
        { freq: 440.00, duration: 0.16, type: "sawtooth", volume: 0.35 },
        { freq: 349.23, duration: 0.16, type: "sawtooth", volume: 0.35 },
        { freq: 293.66, duration: 0.45, type: "sawtooth", volume: 0.35 },
    ], playerTestFail);
}

export const soundService = {
    playPracticeCorrectSound,
    playPracticeWrongSound,
    playTestPassSound,
    playTestFailSound,
};

export default soundService;
