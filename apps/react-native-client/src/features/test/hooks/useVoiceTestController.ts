import { useEffect, useRef, useCallback, useState } from "react";
import * as Speech from "expo-speech";
import {
    ExpoSpeechRecognitionModule,
    useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { useRouter } from "expo-router";

// ---------------------------------------------------------------------------
// Helpers to remove accents and normalize text for comparison
// ---------------------------------------------------------------------------
function removeVietnameseAccents(str: string): string {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "d")
        .replace(/[^a-zA-Z0-9\s]/g, ""); // Keep only alphanumeric and spaces
}

function normalizeSpokenText(str: string): string {
    if (!str) return "";
    return removeVietnameseAccents(str.toLowerCase().trim());
}

// Vietnamese number words (normalized) → 0-based left-option index
const VN_NUMBER_MAP: Record<string, number> = {
    "mot": 0, "1": 0,
    "hai": 1, "2": 1,
    "ba": 2, "3": 2,
    "bon": 3, "4": 3,
    "nam": 4, "5": 4,
    "sau": 5, "6": 5,
    "bay": 6, "7": 6,
};

// Vietnamese / phonetic letter words (normalized) → 0-based right-option index
const VN_LETTER_MAP: Record<string, number> = {
    "a": 0,
    "be": 1, "b": 1,
    "xe": 2, "c": 2,
    "de": 3, "d": 3,
    "e": 4,
};

export function useVoiceTestController(testRunner: any, isVoiceMode: boolean) {
    const { currentQuestion, actions, status, result, totalQuestionCount } = testRunner;
    const router = useRouter();

    const [voiceStatus, setVoiceStatus] = useState<"idle" | "listening" | "speaking" | "processing" | "error">("idle");
    const [spokenText, setSpokenText] = useState("");
    const [ttsText, setTtsText] = useState("");

    // Stable refs to avoid stale closure issues in callbacks
    const currentQuestionRef = useRef(currentQuestion);
    const actionsRef         = useRef(actions);
    const statusRef          = useRef(status);

    // TTS / mic state
    const isTtsSpeaking          = useRef(false);
    const isVoiceProcessing      = useRef(false);
    const lastSpokenQuestionId   = useRef<string | null>(null);

    // Per-question pending state
    const pendingMultiSelections  = useRef<number[]>([]);
    const pendingMatchingPairs    = useRef<Record<string, string>>({});
    const pendingFillAnswer       = useRef<string | null>(null);
    const awaitingFillConfirm     = useRef(false);

    // Keep refs in sync with latest render values
    useEffect(() => {
        currentQuestionRef.current = currentQuestion;
        actionsRef.current = actions;
        statusRef.current  = status;
    }, [currentQuestion, actions, status]);

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------
    const startListening = useCallback(async () => {
        try {
            const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
            if (!result.granted) {
                console.warn("Speech recognition permission not granted");
                setVoiceStatus("error");
                return;
            }
            setVoiceStatus("listening");
            ExpoSpeechRecognitionModule.start({ lang: "vi-VN", interimResults: false });
        } catch (e) {
            console.error("Mic start failed:", e);
            setVoiceStatus("error");
        }
    }, []);

    const stopListening = useCallback(async () => {
        try { ExpoSpeechRecognitionModule.stop(); }
        catch (e) { /* noop */ }
    }, []);

    const ttsSpeak = useCallback((text: string, onDone?: () => void) => {
        isTtsSpeaking.current = true;
        setVoiceStatus("speaking");
        setTtsText(text);
        Speech.speak(text, {
            language: "vi-VN",
            onDone:  () => {
                isTtsSpeaking.current = false;
                if (onDone) {
                    onDone();
                } else {
                    setVoiceStatus("idle");
                }
            },
            onError: () => {
                isTtsSpeaking.current = false;
                if (onDone) {
                    onDone();
                } else {
                    setVoiceStatus("idle");
                }
            },
        });
    }, []);

    const speakOptionsSequence = useCallback(() => {
        const q = currentQuestionRef.current;
        if (!q) { isTtsSpeaking.current = false; return; }

        switch (q.type) {
            case "single-choice": {
                const opts = (q.options as string[])
                    .map((o: string, i: number) => `Lựa chọn ${String.fromCharCode(65 + i)}. ${o}.`)
                    .join(" ");
                ttsSpeak(opts, () => startListening());
                break;
            }
            case "multiple-choice": {
                const intro = "Câu hỏi nhiều lựa chọn. Nói chữ cái để chọn hoặc bỏ chọn. Nói xong để xác nhận.";
                const opts = (q.options as string[])
                    .map((o: string, i: number) => `${String.fromCharCode(65 + i)}. ${o}.`)
                    .join(" ");
                ttsSpeak(`${intro} ${opts}`, () => startListening());
                break;
            }
            case "fill-in-blank":
                ttsSpeak("Điền vào chỗ trống. Mời bạn nói câu trả lời.", () => startListening());
                break;
            case "matching": {
                const lefts  = (q.leftOptions  as any[]).map((o: any, i: number) => `${i + 1}. ${o.text}`).join(", ");
                const rights = (q.rightOptions as any[]).map((o: any, i: number) => `${String.fromCharCode(65 + i)}. ${o.text}`).join(", ");
                ttsSpeak(
                    `Câu hỏi ghép đôi. Bên trái: ${lefts}. Bên phải: ${rights}. Nói số ghép chữ cái, ví dụ một ghép a. Nói xong khi hoàn tất.`,
                    () => startListening(),
                );
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
        isVoiceProcessing.current = false;
        isTtsSpeaking.current     = true;
        setVoiceStatus("speaking");
        setTtsText(q.text);
        await Speech.stop();
        await stopListening();

        Speech.speak(q.text, {
            language: "vi-VN",
            onDone:  () => speakOptionsSequence(),
            onError: () => {
                isTtsSpeaking.current = false;
                setVoiceStatus("idle");
            },
        });
    }, [stopListening, speakOptionsSequence]);

    // ---------------------------------------------------------------------------
    // Speech recognition event handlers (hooks — always registered)
    // ---------------------------------------------------------------------------
    useSpeechRecognitionEvent("result", (event) => {
        if (!isVoiceMode) return;
        const transcript = event.results?.[0]?.transcript;
        if (isVoiceProcessing.current || !transcript) return;

        setSpokenText(transcript);
        const spoken = transcript.toLowerCase().trim();
        const normSpoken = normalizeSpokenText(transcript);
        const q      = currentQuestionRef.current;
        const acts   = actionsRef.current;
        const st     = statusRef.current;

        console.log("[Voice Original]", spoken);
        console.log("[Voice Normalized]", normSpoken);

        // ------ Global commands (work in any state) ------
        if (["nghe lai", "doc lai", "repeat"].includes(normSpoken)) {
            speakQuestionSequence(); return;
        }
        if (["nop bai", "hoan thanh", "submit"].includes(normSpoken)) {
            setVoiceStatus("processing");
            acts.submit(); return;
        }
        if (["quay lai", "cau truoc", "back"].includes(normSpoken)) {
            setVoiceStatus("processing");
            if (st === "completed") { stopListening(); router.back(); }
            else acts.goPrev();
            return;
        }
        if (["tiep tuc"].includes(normSpoken) && st === "completed") {
            setVoiceStatus("processing");
            stopListening(); router.back(); return;
        }

        if (st !== "running" || !q) return;

        // ------ Fill confirmation sub-state ------
        if (awaitingFillConfirm.current) {
            const YES = ["xac nhan", "dung", "co", "ok", "u", "yes"];
            const NO  = ["sai", "khong", "lai", "nhap lai", "no"];
            if (YES.some(w => normSpoken.includes(w))) {
                isVoiceProcessing.current  = true;
                setVoiceStatus("processing");
                awaitingFillConfirm.current = false;
                stopListening();
                acts.answerFillAndGoNext(q.id, pendingFillAnswer.current || "");
                pendingFillAnswer.current = null;
            } else if (NO.some(w => normSpoken.includes(w))) {
                awaitingFillConfirm.current = false;
                pendingFillAnswer.current = null;
                // Clear UI input
                acts.answerFill(q.id, "");
                ttsSpeak("Hãy nói lại câu trả lời.", () => startListening());
            } else {
                startListening();
            }
            return;
        }

        // ------ Per-question-type handlers ------
        switch (q.type) {

            // ---- Single choice ----
            case "single-choice": {
                let idx = -1;
                const kws = [
                    { i: 0, kw: ["lua chon a", "dap an a", "chon a", "cau a"] },
                    { i: 1, kw: ["lua chon b", "dap an b", "chon b", "cau b", "be"] },
                    { i: 2, kw: ["lua chon c", "dap an c", "chon c", "cau c", "xe"] },
                    { i: 3, kw: ["lua chon d", "dap an d", "chon d", "cau d", "de"] },
                ];
                for (const { i, kw } of kws) {
                    if (kw.some(k => normSpoken.includes(k))) { idx = i; break; }
                }
                if (idx === -1 && VN_LETTER_MAP[normSpoken] !== undefined) {
                    idx = VN_LETTER_MAP[normSpoken];
                }
                if (idx === -1) {
                    idx = (q.options as string[]).findIndex((o: string) => {
                        const normO = normalizeSpokenText(o);
                        return normO && normSpoken.includes(normO);
                    });
                }
                if (idx !== -1) {
                    isVoiceProcessing.current = true;
                    setVoiceStatus("processing");
                    stopListening();
                    // Set answer locally immediately so UI shows selected state
                    acts.answerSingle(q.id, idx);
                    ttsSpeak(`Đã chọn ${String.fromCharCode(65 + idx)}.`, () => {
                        acts.answerSingleAndGoNext(q.id, idx);
                    });
                } else {
                    startListening();
                }
                break;
            }

            // ---- Multiple choice ----
            case "multiple-choice": {
                const COMMIT = ["xong", "tiep theo", "tiep", "xac nhan", "next"];
                if (COMMIT.some(w => normSpoken.includes(w))) {
                    isVoiceProcessing.current = true;
                    setVoiceStatus("processing");
                    stopListening();
                    if (pendingMultiSelections.current.length === 0) {
                        ttsSpeak("Bạn chưa chọn đáp án nào. Hãy chọn ít nhất một đáp án.", () => {
                            isVoiceProcessing.current = false;
                            startListening();
                        });
                        return;
                    }
                    const sorted = pendingMultiSelections.current.slice().sort();
                    const labels = sorted.map(i => String.fromCharCode(65 + i)).join(", ");
                    ttsSpeak(`Đã chọn ${labels}.`, () => {
                        acts.answerMultipleAndGoNext(q.id, sorted);
                    });
                    return;
                }
                // Toggle letter selections
                const kws = [
                    { i: 0, kw: ["lua chon a", "chon a", "dap an a"] },
                    { i: 1, kw: ["lua chon b", "chon b", "dap an b", "be"] },
                    { i: 2, kw: ["lua chon c", "chon c", "dap an c", "xe"] },
                    { i: 3, kw: ["lua chon d", "chon d", "dap an d", "de"] },
                ];
                let toggled: number[] = [];
                for (const { i, kw } of kws) {
                    if (kw.some(k => normSpoken.includes(k))) toggled.push(i);
                }
                if (toggled.length === 0 && VN_LETTER_MAP[normSpoken] !== undefined) {
                    toggled.push(VN_LETTER_MAP[normSpoken]);
                }
                if (toggled.length > 0) {
                    const cur = new Set(pendingMultiSelections.current);
                    toggled.forEach(i => {
                        if (cur.has(i)) {
                            cur.delete(i);
                        } else {
                            cur.add(i);
                        }
                        // Update UI checkbox in real-time
                        acts.answerMultiple(q.id, i);
                    });
                    pendingMultiSelections.current = Array.from(cur);
                    const labels = pendingMultiSelections.current.map(i => String.fromCharCode(65 + i)).join(", ") || "chưa có";
                    ttsSpeak(`Đang chọn: ${labels}. Nói thêm hoặc nói xong.`, () => startListening());
                } else {
                    startListening();
                }
                break;
            }

            // ---- Fill in blank ----
            case "fill-in-blank": {
                stopListening();
                pendingFillAnswer.current   = transcript; // use capitalized transcript
                awaitingFillConfirm.current = true;
                // Preview the text in the input box immediately
                acts.answerFill(q.id, transcript);
                ttsSpeak(`Bạn vừa nói: ${transcript}. Nói xác nhận để tiếp tục, hoặc nói lại để nhập lại.`, () => startListening());
                break;
            }

            // ---- Matching ----
            case "matching": {
                const COMMIT = ["xong", "hoan tat", "ket thuc", "tiep theo"];
                if (COMMIT.some(w => normSpoken.includes(w))) {
                    isVoiceProcessing.current = true;
                    setVoiceStatus("processing");
                    stopListening();
                    if (Object.keys(pendingMatchingPairs.current).length === 0) {
                        ttsSpeak("Bạn chưa ghép cặp nào. Hãy nói số ghép chữ cái.", () => {
                            isVoiceProcessing.current = false;
                            startListening();
                        });
                        return;
                    }
                    ttsSpeak("Đã ghi nhận các cặp ghép.", () => {
                        acts.answerMatchingAndGoNext(q.id, { ...pendingMatchingPairs.current });
                    });
                    return;
                }
                // Parse "N ghép/là/với L"
                let leftIdx = -1, rightIdx = -1;
                for (const sep of ["ghep", "la", "voi"]) {
                    const parts = normSpoken.split(sep);
                    if (parts.length >= 2) {
                        const lw = parts[0].trim();
                        const rw = parts[1].trim();
                        if (VN_NUMBER_MAP[lw] !== undefined && VN_LETTER_MAP[rw] !== undefined) {
                            leftIdx  = VN_NUMBER_MAP[lw];
                            rightIdx = VN_LETTER_MAP[rw];
                            break;
                        }
                    }
                }
                if (leftIdx !== -1 && q.leftOptions[leftIdx] && q.rightOptions[rightIdx]) {
                    const leftId  = String(q.leftOptions[leftIdx].id);
                    const rightId = String(q.rightOptions[rightIdx].id);
                    pendingMatchingPairs.current = { ...pendingMatchingPairs.current, [leftId]: rightId };
                    
                    // Update UI matching connection in real-time
                    acts.answerMatching(q.id, leftId, rightId);

                    const done  = Object.keys(pendingMatchingPairs.current).length;
                    const total = (q.leftOptions as any[]).length;
                    ttsSpeak(
                        `Đã ghép ${q.leftOptions[leftIdx].text} với ${q.rightOptions[rightIdx].text}. ${done} trên ${total} cặp. Nói xong khi hoàn tất.`,
                        () => startListening(),
                    );
                } else {
                    startListening();
                }
                break;
            }
        }
    });

    useSpeechRecognitionEvent("error", () => {
        if (!isVoiceMode) return;
        if (!isTtsSpeaking.current && !isVoiceProcessing.current && statusRef.current === "running") {
            startListening();
        }
    });

    // ---------------------------------------------------------------------------
    // Voice listener bootstrap — only active in voice mode
    // ---------------------------------------------------------------------------
    useEffect(() => {
        if (!isVoiceMode) {
            setVoiceStatus("idle");
            setSpokenText("");
            setTtsText("");
            return;
        }

        return () => {
            ExpoSpeechRecognitionModule.stop();
            Speech.stop();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isVoiceMode]);

    // ---------------------------------------------------------------------------
    // Loading audio cue
    // ---------------------------------------------------------------------------
    useEffect(() => {
        if (!isVoiceMode || status !== "loading") return;
        Speech.speak("Đang tải câu hỏi, vui lòng chờ.", { language: "vi-VN" });
    }, [status, isVoiceMode]);

    // ---------------------------------------------------------------------------
    // Completed: announce score then re-listen for navigation
    // ---------------------------------------------------------------------------
    useEffect(() => {
        if (!isVoiceMode || status !== "completed" || !result) return;
        isTtsSpeaking.current = true;
        const total = totalQuestionCount || result.totalQuestions || 0;
        const msg = `Bạn đã hoàn thành bài kiểm tra. Điểm số của bạn là ${result.score} trên 100. Bạn trả lời đúng ${result.correctAnswersCount} trên ${total} câu hỏi. Nói quay lại để về màn hình trước.`;
        Speech.speak(msg, {
            language: "vi-VN",
            onDone:  () => { isTtsSpeaking.current = false; startListening(); },
            onError: () => { isTtsSpeaking.current = false; startListening(); },
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, result, isVoiceMode]);

    // ---------------------------------------------------------------------------
    // New question arrived → speak it
    // ---------------------------------------------------------------------------
    useEffect(() => {
        if (!isVoiceMode || status !== "running" || !currentQuestion) return;
        if (lastSpokenQuestionId.current === currentQuestion.id) return;

        lastSpokenQuestionId.current = currentQuestion.id;
        // Seed per-question accumulation state from saved answers if present
        const savedAns = testRunner.answers[currentQuestion.id];
        pendingMultiSelections.current = Array.isArray(savedAns) ? [...savedAns] : [];
        pendingMatchingPairs.current   = (savedAns && typeof savedAns === "object" && !Array.isArray(savedAns)) ? { ...savedAns } : {};
        pendingFillAnswer.current      = typeof savedAns === "string" ? savedAns : null;
        awaitingFillConfirm.current    = false;
        setSpokenText("");
        setTtsText("");

        speakQuestionSequence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentQuestion, status, isVoiceMode]);
    return {
        voiceStatus,
        spokenText,
        ttsText,
    };
}
