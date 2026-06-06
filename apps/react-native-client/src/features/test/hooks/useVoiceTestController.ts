import { useEffect, useRef, useCallback } from "react";
import * as Speech from "expo-speech";
import {
    ExpoSpeechRecognitionModule,
    useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { useRouter } from "expo-router";

// ---------------------------------------------------------------------------
// Vietnamese number words → 0-based left-option index
// ---------------------------------------------------------------------------
const VN_NUMBER_MAP: Record<string, number> = {
    "một": 0, "1": 0,
    "hai": 1, "2": 1,
    "ba": 2, "3": 2,
    "bốn": 3, "4": 3,
    "năm": 4, "5": 4,
    "sáu": 5, "6": 5,
    "bảy": 6, "7": 6,
};

// Vietnamese / phonetic letter words → 0-based right-option index
const VN_LETTER_MAP: Record<string, number> = {
    "a": 0,
    "bê": 1, "b": 1,
    "xê": 2, "c": 2,
    "dê": 3, "d": 3,
    "e": 4,
    "ê": 5,
};

export function useVoiceTestController(testRunner: any, isVoiceMode: boolean) {
    const { currentQuestion, actions, status, result, totalQuestionCount } = testRunner;
    const router = useRouter();

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
                return;
            }
            ExpoSpeechRecognitionModule.start({ lang: "vi-VN", interimResults: false });
        } catch (e) {
            console.error("Mic start failed:", e);
        }
    }, []);

    const stopListening = useCallback(async () => {
        try { ExpoSpeechRecognitionModule.stop(); }
        catch (e) { /* noop */ }
    }, []);

    const ttsSpeak = useCallback((text: string, onDone?: () => void) => {
        isTtsSpeaking.current = true;
        Speech.speak(text, {
            language: "vi-VN",
            onDone:  () => { isTtsSpeaking.current = false; onDone?.(); },
            onError: () => { isTtsSpeaking.current = false; onDone?.(); },
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
        await Speech.stop();
        await stopListening();

        Speech.speak(q.text, {
            language: "vi-VN",
            onDone:  () => speakOptionsSequence(),
            onError: () => { isTtsSpeaking.current = false; },
        });
    }, [stopListening, speakOptionsSequence]);

    // ---------------------------------------------------------------------------
    // Speech recognition event handlers (hooks — always registered)
    // ---------------------------------------------------------------------------
    useSpeechRecognitionEvent("result", (event) => {
        if (!isVoiceMode) return;
        const transcript = event.results?.[0]?.transcript;
        if (isVoiceProcessing.current || !transcript) return;

        const spoken = transcript.toLowerCase().trim();
        const q      = currentQuestionRef.current;
        const acts   = actionsRef.current;
        const st     = statusRef.current;

        console.log("[Voice]", spoken);

        // ------ Global commands (work in any state) ------
        if (["nghe lại", "đọc lại", "repeat"].includes(spoken)) {
            speakQuestionSequence(); return;
        }
        if (["nộp bài", "hoàn thành", "submit"].includes(spoken)) {
            acts.submit(); return;
        }
        if (["quay lại", "câu trước", "back"].includes(spoken)) {
            if (st === "completed") { stopListening(); router.back(); }
            else acts.goPrev();
            return;
        }
        if (["tiếp tục"].includes(spoken) && st === "completed") {
            stopListening(); router.back(); return;
        }

        if (st !== "running" || !q) return;

        // ------ Fill confirmation sub-state ------
        if (awaitingFillConfirm.current) {
            const YES = ["xác nhận", "đúng", "có", "ok", "ừ", "yes"];
            const NO  = ["sai", "không", "lại", "nhập lại", "no"];
            if (YES.some(w => spoken.includes(w))) {
                isVoiceProcessing.current  = true;
                awaitingFillConfirm.current = false;
                stopListening();
                acts.goNext(pendingFillAnswer.current);
                pendingFillAnswer.current = null;
            } else if (NO.some(w => spoken.includes(w))) {
                awaitingFillConfirm.current = false;
                pendingFillAnswer.current = null;
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
                    { i: 0, kw: ["lựa chọn a", "đáp án a", "chọn a", "câu a"] },
                    { i: 1, kw: ["lựa chọn b", "đáp án b", "chọn b", "câu b", "bê"] },
                    { i: 2, kw: ["lựa chọn c", "đáp án c", "chọn c", "câu c", "xê"] },
                    { i: 3, kw: ["lựa chọn d", "đáp án d", "chọn d", "câu d", "dê"] },
                ];
                for (const { i, kw } of kws) {
                    if (kw.some(k => spoken.includes(k))) { idx = i; break; }
                }
                if (idx === -1 && VN_LETTER_MAP[spoken] !== undefined) idx = VN_LETTER_MAP[spoken];
                if (idx === -1) {
                    idx = (q.options as string[]).findIndex((o: string) => spoken.includes(o.toLowerCase()));
                }
                if (idx !== -1) {
                    isVoiceProcessing.current = true;
                    stopListening();
                    ttsSpeak(`Đã chọn ${String.fromCharCode(65 + idx)}.`, () => acts.goNext(idx));
                } else {
                    startListening();
                }
                break;
            }

            // ---- Multiple choice ----
            case "multiple-choice": {
                const COMMIT = ["xong", "tiếp theo", "tiếp", "xác nhận", "next"];
                if (COMMIT.some(w => spoken.includes(w))) {
                    isVoiceProcessing.current = true;
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
                    ttsSpeak(`Đã chọn ${labels}.`, () => acts.goNext(sorted));
                    return;
                }
                // Toggle letter selections
                const kws = [
                    { i: 0, kw: ["lựa chọn a", "chọn a", "đáp án a"] },
                    { i: 1, kw: ["lựa chọn b", "chọn b", "đáp án b", "bê"] },
                    { i: 2, kw: ["lựa chọn c", "chọn c", "đáp án c", "xê"] },
                    { i: 3, kw: ["lựa chọn d", "chọn d", "đáp án d", "dê"] },
                ];
                let toggled: number[] = [];
                for (const { i, kw } of kws) {
                    if (kw.some(k => spoken.includes(k))) toggled.push(i);
                }
                if (toggled.length === 0 && VN_LETTER_MAP[spoken] !== undefined) {
                    toggled.push(VN_LETTER_MAP[spoken]);
                }
                if (toggled.length > 0) {
                    const cur = new Set(pendingMultiSelections.current);
                    toggled.forEach(i => cur.has(i) ? cur.delete(i) : cur.add(i));
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
                pendingFillAnswer.current   = spoken;
                awaitingFillConfirm.current = true;
                ttsSpeak(`Bạn vừa nói: ${spoken}. Nói xác nhận để tiếp tục, hoặc nói lại để nhập lại.`, () => startListening());
                break;
            }

            // ---- Matching ----
            case "matching": {
                const COMMIT = ["xong", "hoàn tất", "kết thúc", "tiếp theo"];
                if (COMMIT.some(w => spoken.includes(w))) {
                    isVoiceProcessing.current = true;
                    stopListening();
                    if (Object.keys(pendingMatchingPairs.current).length === 0) {
                        ttsSpeak("Bạn chưa ghép cặp nào. Hãy nói số ghép chữ cái.", () => {
                            isVoiceProcessing.current = false;
                            startListening();
                        });
                        return;
                    }
                    ttsSpeak("Đã ghi nhận các cặp ghép.", () => acts.goNext({ ...pendingMatchingPairs.current }));
                    return;
                }
                // Parse "N ghép/là/với L"
                let leftIdx = -1, rightIdx = -1;
                for (const sep of ["ghép", "là", "với"]) {
                    const parts = spoken.split(sep);
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
        if (!isVoiceMode) return;

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
        // Reset per-question accumulation state
        pendingMultiSelections.current = [];
        pendingMatchingPairs.current   = {};
        pendingFillAnswer.current      = null;
        awaitingFillConfirm.current    = false;

        speakQuestionSequence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentQuestion, status, isVoiceMode]);
}
