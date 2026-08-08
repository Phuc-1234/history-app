import { useState, useRef, useCallback } from "react";
import {
    ExpoSpeechRecognitionModule,
    useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { useEasterEgg } from "@/features/easter_egg";

interface UseVoiceInputOptions {
    onTranscriptComplete?: (text: string) => void;
    lang?: string;
}

export function useVoiceInput(options?: UseVoiceInputOptions) {
    const { isEngMode } = useEasterEgg();
    const [isListening, setIsListening] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcript, setTranscript] = useState("");
    const latestTranscriptRef = useRef("");
    const onTranscriptCompleteRef = useRef(options?.onTranscriptComplete);
    onTranscriptCompleteRef.current = options?.onTranscriptComplete;

    useSpeechRecognitionEvent("result", (event) => {
        const text = event.results?.[0]?.transcript || "";
        if (text) {
            setTranscript(text);
            latestTranscriptRef.current = text;
        }
    });

    const finishTranscribing = useCallback(() => {
        setIsListening(false);
        setIsTranscribing(false);
        const finalContent = latestTranscriptRef.current;
        if (onTranscriptCompleteRef.current) {
            onTranscriptCompleteRef.current(finalContent);
        }
    }, []);

    useSpeechRecognitionEvent("end", () => {
        if (isTranscribing || isListening) {
            finishTranscribing();
        }
    });

    useSpeechRecognitionEvent("error", () => {
        setIsListening(false);
        setIsTranscribing(false);
    });

    const startListening = useCallback(async () => {
        try {
            const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
            if (!perm.granted) return false;

            setTranscript("");
            latestTranscriptRef.current = "";
            setIsListening(true);
            setIsTranscribing(false);
            const lang = options?.lang || (isEngMode ? "en-US" : "vi-VN");
            ExpoSpeechRecognitionModule.start({ lang, interimResults: true });
            return true;
        } catch (error) {
            console.error("Failed to start voice recognition:", error);
            setIsListening(false);
            return false;
        }
    }, [isEngMode, options?.lang]);

    const stopListening = useCallback(() => {
        try {
            setIsTranscribing(true);
            ExpoSpeechRecognitionModule.stop();
            // Fallback safety timeout if 'end' event takes too long
            setTimeout(() => {
                finishTranscribing();
            }, 600);
        } catch (error) {
            console.error("Failed to stop voice recognition:", error);
            setIsListening(false);
            setIsTranscribing(false);
        }
    }, [finishTranscribing]);

    const forceStopImmediate = useCallback(() => {
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
