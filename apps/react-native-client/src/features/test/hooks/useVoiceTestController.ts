import { useEffect, useRef, useCallback, useState } from "react";
import * as Speech from "expo-speech";
import {
    ExpoSpeechRecognitionModule,
    useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { useRouter } from "expo-router";

// ---------------------------------------------------------------------------
// Text normalization helpers
// ---------------------------------------------------------------------------
function removeVietnameseAccents(str: string): string {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "d")
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .replace(/\s+/g, " ");
}

function normalizeSpokenText(str: string): string {
    if (!str) return "";
    return removeVietnameseAccents(str.toLowerCase().trim());
}

// ---------------------------------------------------------------------------
// Vocabulary maps (all normalized / no diacritics)
// ---------------------------------------------------------------------------
const VN_NUMBER_MAP: Record<string, number> = {
    "mot": 0, "1": 0,
    "hai": 1, "2": 1,
    "ba": 2,  "3": 2,
    "bon": 3, "4": 3,
    "nam": 4, "5": 4,
    "sau": 5, "6": 5,
    "bay": 6, "7": 6,
};

const VN_LETTER_MAP: Record<string, number> = {
    "a": 0,
    "be": 1, "b": 1,
    "xe": 2, "c": 2,
    "de": 3, "d": 3,
    "e": 4,
};

// ---------------------------------------------------------------------------
// Parse helpers
// ---------------------------------------------------------------------------

/** Parse a SINGLE option letter from normalized transcript. Returns -1 if not found. */
function parseSingleOptionIndex(norm: string): number {
    const kws = [
        { i: 0, kw: ["lua chon a", "dap an a", "chon a", "cau a"] },
        { i: 1, kw: ["lua chon b", "dap an b", "chon b", "cau b", "be"] },
        { i: 2, kw: ["lua chon c", "dap an c", "chon c", "cau c", "xe"] },
        { i: 3, kw: ["lua chon d", "dap an d", "chon d", "cau d", "de"] },
    ];
    for (const { i, kw } of kws) {
        if (kw.some((k) => norm.includes(k))) return i;
    }
    // Exact word-boundary bare letter check (e.g. user just says "a", "b")
    if (/\ba\b/.test(norm)) return 0;
    if (/\bb\b/.test(norm)) return 1;
    if (/\bc\b/.test(norm)) return 2;
    if (/\bd\b/.test(norm)) return 3;
    // Exact token (e.g. "be" alone)
    const tok = norm.trim();
    if (VN_LETTER_MAP[tok] !== undefined) return VN_LETTER_MAP[tok];
    return -1;
}

/** Parse MULTIPLE option letters from a single utterance, e.g. "A và C", "chọn A B". */
function parseMultipleOptionIndexes(norm: string): number[] {
    const selected = new Set<number>();
    const kws = [
        { i: 0, kw: ["lua chon a", "chon a", "dap an a"] },
        { i: 1, kw: ["lua chon b", "chon b", "dap an b", "be"] },
        { i: 2, kw: ["lua chon c", "chon c", "dap an c", "xe"] },
        { i: 3, kw: ["lua chon d", "chon d", "dap an d", "de"] },
    ];
    for (const { i, kw } of kws) {
        if (kw.some((k) => norm.includes(k))) selected.add(i);
    }
    if (/\ba\b/.test(norm)) selected.add(0);
    if (/\bb\b/.test(norm)) selected.add(1);
    if (/\bc\b/.test(norm)) selected.add(2);
    if (/\bd\b/.test(norm)) selected.add(3);
    return Array.from(selected).sort();
}

/** Parse a matching pair like "mot ghep a", "1 voi b", "hai la c". */
function parseMatchingPair(norm: string): { leftIdx: number; rightIdx: number } | null {
    for (const sep of ["ghep", "voi", "la"]) {
        const sepIdx = norm.indexOf(sep);
        if (sepIdx === -1) continue;
        const lw = norm.slice(0, sepIdx).trim().split(" ").pop() ?? "";
        const rw = norm.slice(sepIdx + sep.length).trim().split(" ")[0] ?? "";
        if (VN_NUMBER_MAP[lw] !== undefined && VN_LETTER_MAP[rw] !== undefined) {
            return { leftIdx: VN_NUMBER_MAP[lw], rightIdx: VN_LETTER_MAP[rw] };
        }
    }
    return null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SILENCE_DELAY_MS = 1500;
const CMD_COMMIT  = ["xong", "tiep theo", "tiep", "next", "xac nhan"];
const CMD_REPEAT  = ["nghe lai", "doc lai", "repeat", "nhe lai"];
const CMD_PREV    = ["quay lai", "cau truoc", "back", "tro lai"];
const CMD_SUBMIT  = ["nop bai", "hoan thanh", "submit"];
const CMD_NAV_BACK = ["tiep tuc"];

// ===========================================================================
// Hook
// ===========================================================================
export type VoiceStatus = "idle" | "listening" | "speaking" | "processing" | "submitted" | "error";

export function useVoiceTestController(testRunner: any, isVoiceMode: boolean) {
    const { currentQuestion, actions, status, result, totalQuestionCount } = testRunner;
    const router = useRouter();

    const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("idle");
    const [spokenText, setSpokenText]   = useState("");
    const [ttsText, setTtsText]         = useState("");

    // ---- Stable refs ----
    const isVoiceModeRef       = useRef(isVoiceMode);
    const currentQuestionRef   = useRef(currentQuestion);
    const actionsRef           = useRef(actions);
    const statusRef            = useRef(status);

    useEffect(() => { isVoiceModeRef.current = isVoiceMode; }, [isVoiceMode]);
    useEffect(() => {
        currentQuestionRef.current = currentQuestion;
        actionsRef.current         = actions;
        statusRef.current          = status;
    }, [currentQuestion, actions, status]);

    // ---- TTS / mic state refs ----
    const isTtsSpeaking         = useRef(false);
    const isVoiceProcessing     = useRef(false);
    const lastSpokenQuestionId  = useRef<string | null>(null);

    // ---- Realtime transcript + silence debounce ----
    const silenceTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
    const latestTranscriptRef   = useRef<string>("");

    // ---- Per-question accumulation (multiple-choice, matching) ----
    const pendingMultiSelections = useRef<number[]>([]);
    const pendingMatchingPairs   = useRef<Record<string, string>>({});

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------
    const clearSilenceTimer = useCallback(() => {
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
    }, []);

    const startListening = useCallback(async () => {
        if (!isVoiceModeRef.current) return;
        try {
            const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
            if (!perm.granted) { setVoiceStatus("error"); return; }
            setVoiceStatus("listening");
            latestTranscriptRef.current = "";
            setSpokenText("");
            ExpoSpeechRecognitionModule.start({ lang: "vi-VN", interimResults: true });
        } catch {
            setVoiceStatus("error");
        }
    }, []);

    const stopListening = useCallback(() => {
        try { ExpoSpeechRecognitionModule.stop(); } catch { /* noop */ }
    }, []);

    const ttsSpeak = useCallback((text: string, onDone?: () => void) => {
        isTtsSpeaking.current = true;
        setVoiceStatus("speaking");
        setTtsText(text);
        Speech.speak(text, {
            language: "vi-VN",
            onDone: () => {
                isTtsSpeaking.current = false;
                onDone ? onDone() : setVoiceStatus("idle");
            },
            onError: () => {
                isTtsSpeaking.current = false;
                onDone ? onDone() : setVoiceStatus("idle");
            },
        });
    }, []);

    const speakOptionsSequence = useCallback(() => {
        const q = currentQuestionRef.current;
        if (!q) { isTtsSpeaking.current = false; return; }

        switch (q.type) {
            case "single-choice": {
                const opts = (q.options as string[])
                    .map((o: string, i: number) => `${String.fromCharCode(65 + i)}: ${o}.`)
                    .join(" ");
                ttsSpeak(opts, () => startListening());
                break;
            }
            case "multiple-choice": {
                const opts = (q.options as string[])
                    .map((o: string, i: number) => `${String.fromCharCode(65 + i)}: ${o}.`)
                    .join(" ");
                ttsSpeak(`${opts} Nói chữ cái để chọn. Nói xong để xác nhận.`, () => startListening());
                break;
            }
            case "fill-in-blank":
                ttsSpeak("Điền vào chỗ trống. Nói câu trả lời của bạn.", () => startListening());
                break;
            case "matching": {
                const lefts  = (q.leftOptions  as any[]).map((o: any, i: number) => `${i + 1}: ${o.text}`).join(". ");
                const rights = (q.rightOptions as any[]).map((o: any, i: number) => `${String.fromCharCode(65 + i)}: ${o.text}`).join(". ");
                ttsSpeak(`Bên trái: ${lefts}. Bên phải: ${rights}. Nói số ghép chữ cái.`, () => startListening());
                break;
            }
            default:
                isTtsSpeaking.current = false;
                startListening();
        }
    }, [ttsSpeak, startListening]);

    const speakQuestionSequence = useCallback(async () => {
        const q = currentQuestionRef.current;
        if (!q) return;
        clearSilenceTimer();
        isVoiceProcessing.current = false;
        isTtsSpeaking.current     = true;
        setVoiceStatus("speaking");
        setTtsText(q.text);
        await Speech.stop();
        stopListening();

        Speech.speak(q.text, {
            language: "vi-VN",
            onDone:  () => speakOptionsSequence(),
            onError: () => { isTtsSpeaking.current = false; setVoiceStatus("idle"); },
        });
    }, [stopListening, speakOptionsSequence, clearSilenceTimer]);

    // ---------------------------------------------------------------------------
    // handleFinalTranscript — called after 1.5 s of silence
    // ---------------------------------------------------------------------------
    const handleFinalTranscript = useCallback((transcript: string) => {
        if (!isVoiceModeRef.current)     return;
        if (isVoiceProcessing.current)   return;

        const q    = currentQuestionRef.current;
        const acts = actionsRef.current;
        const st   = statusRef.current;
        const norm = normalizeSpokenText(transcript);

        console.log("[Voice] final →", norm);

        // --- Global commands ---
        if (CMD_REPEAT.some((w) => norm.includes(w))) { speakQuestionSequence(); return; }

        if (CMD_PREV.some((w) => norm.includes(w))) {
            setVoiceStatus("processing");
            if (st === "completed") { stopListening(); router.back(); }
            else acts.goPrev();
            return;
        }
        if (CMD_NAV_BACK.some((w) => norm.includes(w)) && st === "completed") {
            setVoiceStatus("processing");
            stopListening(); router.back(); return;
        }
        if (CMD_SUBMIT.some((w) => norm.includes(w))) {
            setVoiceStatus("processing"); acts.submit(); return;
        }

        if (st !== "running" || !q) { startListening(); return; }

        // --- per question type ---
        isVoiceProcessing.current = true;
        setVoiceStatus("processing");
        stopListening();

        switch (q.type) {

            // ---- Single choice ----
            case "single-choice": {
                let idx = parseSingleOptionIndex(norm);
                // Fallback: spoken text matches option content
                if (idx === -1) {
                    idx = (q.options as string[]).findIndex((o: string) => {
                        const normO = normalizeSpokenText(o);
                        if (!normO) return false;
                        return norm === normO
                            || norm.includes(normO)
                            || (normO.includes(norm) && norm.length >= 4);
                    });
                }
                if (idx !== -1) {
                    acts.answerSingle(q.id, idx);             // update UI instantly
                    acts.answerSingleAndGoNext(q.id, idx);    // submit + go next
                } else {
                    isVoiceProcessing.current = false;
                    ttsSpeak("Không nhận ra đáp án. Hãy nói lại.", () => startListening());
                }
                break;
            }

            // ---- Multiple choice ----
            case "multiple-choice": {
                const isCommit = CMD_COMMIT.some((w) => norm.includes(w));
                if (isCommit) {
                    if (pendingMultiSelections.current.length === 0) {
                        isVoiceProcessing.current = false;
                        ttsSpeak("Bạn chưa chọn đáp án. Hãy nói chữ cái để chọn.", () => startListening());
                        return;
                    }
                    const sorted = [...pendingMultiSelections.current].sort();
                    acts.answerMultipleAndGoNext(q.id, sorted);
                } else {
                    const parsed = parseMultipleOptionIndexes(norm);
                    if (parsed.length > 0) {
                        const cur = new Set(pendingMultiSelections.current);
                        parsed.forEach((i) => {
                            cur.has(i) ? cur.delete(i) : cur.add(i);
                            acts.answerMultiple(q.id, i); // realtime UI toggle
                        });
                        pendingMultiSelections.current = Array.from(cur);
                        const labels = pendingMultiSelections.current.map((i) => String.fromCharCode(65 + i)).join(", ") || "chưa có";
                        isVoiceProcessing.current = false;
                        ttsSpeak(`Đang chọn: ${labels}. Nói thêm hoặc nói xong.`, () => startListening());
                    } else {
                        isVoiceProcessing.current = false;
                        startListening();
                    }
                }
                break;
            }

            // ---- Fill in blank ----
            case "fill-in-blank": {
                // Use original transcript (preserves capitalisation / proper nouns)
                acts.answerFill(q.id, transcript);            // update UI input box
                acts.answerFillAndGoNext(q.id, transcript);   // submit + go next
                break;
            }

            // ---- Matching ----
            case "matching": {
                const isCommit = CMD_COMMIT.some((w) => norm.includes(w));
                if (isCommit) {
                    if (Object.keys(pendingMatchingPairs.current).length === 0) {
                        isVoiceProcessing.current = false;
                        ttsSpeak("Bạn chưa ghép cặp nào. Nói số ghép chữ cái.", () => startListening());
                        return;
                    }
                    acts.answerMatchingAndGoNext(q.id, { ...pendingMatchingPairs.current });
                } else {
                    const pair = parseMatchingPair(norm);
                    if (pair && q.leftOptions[pair.leftIdx] && q.rightOptions[pair.rightIdx]) {
                        const leftId  = String(q.leftOptions[pair.leftIdx].id);
                        const rightId = String(q.rightOptions[pair.rightIdx].id);
                        pendingMatchingPairs.current = { ...pendingMatchingPairs.current, [leftId]: rightId };
                        acts.answerMatching(q.id, leftId, rightId); // realtime UI line
                        const done  = Object.keys(pendingMatchingPairs.current).length;
                        const total = (q.leftOptions as any[]).length;
                        isVoiceProcessing.current = false;
                        ttsSpeak(
                            `Đã ghép ${q.leftOptions[pair.leftIdx].text} với ${q.rightOptions[pair.rightIdx].text}. ${done} trên ${total}. Nói xong khi hoàn tất.`,
                            () => startListening(),
                        );
                    } else {
                        isVoiceProcessing.current = false;
                        startListening();
                    }
                }
                break;
            }

            default:
                isVoiceProcessing.current = false;
                startListening();
        }
    }, [speakQuestionSequence, stopListening, startListening, ttsSpeak, router]);

    // ---------------------------------------------------------------------------
    // Speech recognition events
    // ---------------------------------------------------------------------------
    useSpeechRecognitionEvent("result", (event) => {
        if (!isVoiceModeRef.current)   return;
        if (isVoiceProcessing.current) return;
        if (isTtsSpeaking.current)     return;

        const transcript = event.results?.[0]?.transcript;
        if (!transcript) return;

        // ① Realtime display — update immediately regardless of interim/final
        setSpokenText(transcript);
        latestTranscriptRef.current = transcript;

        // ② Reset silence countdown
        clearSilenceTimer();

        // ③ Arm new silence timer — fires handleFinalTranscript after 1.5 s of silence
        silenceTimerRef.current = setTimeout(() => {
            handleFinalTranscript(latestTranscriptRef.current);
        }, SILENCE_DELAY_MS);
    });

    useSpeechRecognitionEvent("error", () => {
        if (!isVoiceModeRef.current) return;
        clearSilenceTimer();
        if (!isTtsSpeaking.current && !isVoiceProcessing.current && statusRef.current === "running") {
            setTimeout(() => startListening(), 400);
        }
    });

    // ---------------------------------------------------------------------------
    // Voice mode bootstrap / teardown
    // ---------------------------------------------------------------------------
    useEffect(() => {
        if (!isVoiceMode) {
            clearSilenceTimer();
            setVoiceStatus("idle");
            setSpokenText("");
            setTtsText("");
            return;
        }
        return () => {
            clearSilenceTimer();
            ExpoSpeechRecognitionModule.stop();
            Speech.stop();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isVoiceMode]);

    // Loading cue
    useEffect(() => {
        if (!isVoiceMode || status !== "loading") return;
        Speech.speak("Đang tải câu hỏi, vui lòng chờ.", { language: "vi-VN" });
    }, [status, isVoiceMode]);

    // Completed — announce result then listen for navigation
    useEffect(() => {
        if (!isVoiceMode || status !== "completed" || !result) return;
        clearSilenceTimer();
        isTtsSpeaking.current = true;
        const total = totalQuestionCount || result.totalQuestions || 0;
        const msg = `Bạn đã hoàn thành bài kiểm tra. Điểm của bạn là ${result.score} trên 100. Đúng ${result.correctAnswersCount} trên ${total} câu. Nói quay lại để về màn trước.`;
        Speech.speak(msg, {
            language: "vi-VN",
            onDone:  () => { isTtsSpeaking.current = false; startListening(); },
            onError: () => { isTtsSpeaking.current = false; startListening(); },
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, result, isVoiceMode]);

    // New question → read it aloud
    useEffect(() => {
        if (!isVoiceMode || status !== "running" || !currentQuestion) return;
        if (lastSpokenQuestionId.current === currentQuestion.id) return;

        lastSpokenQuestionId.current = currentQuestion.id;
        clearSilenceTimer();
        latestTranscriptRef.current = "";

        // Restore accumulation from previously saved answers
        const saved = testRunner.answers[currentQuestion.id];
        pendingMultiSelections.current = Array.isArray(saved) ? [...saved] : [];
        pendingMatchingPairs.current   = (saved && typeof saved === "object" && !Array.isArray(saved)) ? { ...saved } : {};

        setSpokenText("");
        setTtsText("");
        speakQuestionSequence();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentQuestion, status, isVoiceMode]);

    return { voiceStatus, spokenText, ttsText };
}
