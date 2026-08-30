import { useState, useRef, useCallback } from "react";
import {
    ExpoSpeechRecognitionModule,
    useSpeechRecognitionEvent,
} from "expo-speech-recognition";

interface UseVoiceInputOptions {
    onTranscriptComplete?: (text: string) => void;
    lang?: string;
}

export function useVoiceInput(options?: UseVoiceInputOptions) {
    const [isListening, setIsListening] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcript, setTranscript] = useState("");
    const latestTranscriptRef = useRef("");
    const onTranscriptCompleteRef = useRef(options?.onTranscriptComplete);
    onTranscriptCompleteRef.current = options?.onTranscriptComplete;
    const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isFinishedRef = useRef(false);

    useSpeechRecognitionEvent("result", (event) => {
        const text = event.results?.[0]?.transcript || "";
        if (text) {
            setTranscript(text);
            latestTranscriptRef.current = text;
        }
    });

    const finishTranscribing = useCallback(() => {
        if (fallbackTimeoutRef.current) {
            clearTimeout(fallbackTimeoutRef.current);
            fallbackTimeoutRef.current = null;
        }
        if (isFinishedRef.current) return;
        isFinishedRef.current = true;

        setIsListening(false);
        setIsTranscribing(false);
        const finalContent = latestTranscriptRef.current;
        if (finalContent && onTranscriptCompleteRef.current) {
            onTranscriptCompleteRef.current(finalContent);
        }
    }, []);

    useSpeechRecognitionEvent("end", () => {
        finishTranscribing();
    });

    useSpeechRecognitionEvent("error", () => {
        if (fallbackTimeoutRef.current) {
            clearTimeout(fallbackTimeoutRef.current);
            fallbackTimeoutRef.current = null;
        }
        isFinishedRef.current = true;
        setIsListening(false);
        setIsTranscribing(false);
    });

    const startListening = useCallback(async () => {
        try {
            if (fallbackTimeoutRef.current) {
                clearTimeout(fallbackTimeoutRef.current);
                fallbackTimeoutRef.current = null;
            }
            const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
            if (!perm.granted) return false;

            setTranscript("");
            latestTranscriptRef.current = "";
            isFinishedRef.current = false;
            setIsListening(true);
            setIsTranscribing(false);
            const lang = options?.lang || "vi-VN";
            ExpoSpeechRecognitionModule.start({ lang, interimResults: true });
            return true;
        } catch (error) {
            console.error("Failed to start voice recognition:", error);
            setIsListening(false);
            return false;
        }
    }, [options?.lang]);

    const stopListening = useCallback(() => {
        try {
            setIsTranscribing(true);
            ExpoSpeechRecognitionModule.stop();
            if (fallbackTimeoutRef.current) {
                clearTimeout(fallbackTimeoutRef.current);
            }
            // Fallback safety timeout if 'end' event takes too long
            fallbackTimeoutRef.current = setTimeout(() => {
                finishTranscribing();
            }, 600);
        } catch (error) {
            console.error("Failed to stop voice recognition:", error);
            setIsListening(false);
            setIsTranscribing(false);
        }
    }, [finishTranscribing]);

    const forceStopImmediate = useCallback(() => {
        if (fallbackTimeoutRef.current) {
            clearTimeout(fallbackTimeoutRef.current);
            fallbackTimeoutRef.current = null;
        }
        isFinishedRef.current = true;
        try {
            ExpoSpeechRecognitionModule.stop();
        } catch {
            /* ignore */
        }
        const text = latestTranscriptRef.current;
        setIsListening(false);
        setIsTranscribing(false);
        return text;
    }, []);

    return {
        isListening,
        isTranscribing,
        transcript,
        startListening,
        stopListening,
        forceStopImmediate,
    };
}
