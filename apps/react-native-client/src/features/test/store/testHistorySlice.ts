import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Question } from "../types";

export interface TestAttempt {
    id: string;
    testId: string;
    testTitle: string;
    timestamp: string; // Date string format: "DD/MM/YYYY HH:mm"
    score: number; // Scale out of 100
    correctAnswersCount: number;
    totalQuestions: number;
    answers: Record<string, any>;
    gradedAnswers: Record<string, boolean>;
    questions: Question[];
}

interface TestHistoryState {
    attempts: TestAttempt[];
}

const mockQuestions: Question[] = [
    {
        id: "q1",
        type: "single-choice",
        text: "Đối tượng nghiên cứu của Sử học là gì?",
        options: [
            "Toàn bộ hoạt động của con người trong quá khứ.",
            "Quá trình hình thành và phát triển của trái đất.",
            "Những hiện tượng tự nhiên xảy ra trong quá khứ.",
            "Các quy luật vận động của xã hội hiện đại."
        ],
        correctOptionIndex: 0
    },
    {
        id: "q2",
        type: "multiple-choice",
        text: "Đâu là các nguồn sử liệu cơ bản của Sử học?",
        options: [
            "Sử liệu truyền miệng.",
            "Sử liệu hiện vật.",
            "Sử liệu chữ viết.",
            "Sử liệu tin đồn mạng xã hội chưa được xác thực."
        ],
        correctOptionIndexes: [0, 1, 2]
    },
    {
        id: "q3",
        type: "fill-in-blank",
        text: "Lịch sử là những gì đã xảy ra trong...",
        placeholder: "Nhập câu trả lời của bạn...",
        correctText: "quá khứ"
    },
    {
        id: "q4",
        type: "matching",
        text: "Hãy nối các sự kiện lịch sử ở cột bên trái với năm diễn ra tương ứng ở cột bên phải:",
        leftOptions: [
            { id: "L1", text: "Cách mạng tháng Tám thành công" },
            { id: "L2", text: "Chiến dịch Điện Biên Phủ" },
            { id: "L3", text: "Giải phóng miền Nam" }
        ],
        rightOptions: [
            { id: "R1", text: "Năm 1954" },
            { id: "R2", text: "Năm 1975" },
            { id: "R3", text: "Năm 1945" }
        ],
        correctPairs: {
            "L1": "R3",
            "L2": "R1",
            "L3": "R2"
        }
    }
];

const initialState: TestHistoryState = {
    attempts: [
        {
            id: "mock-attempt-1",
            testId: "test-theme-1",
            testTitle: "Kiểm tra Chủ đề 1",
            timestamp: "02/06/2026 14:30",
            score: 75,
            correctAnswersCount: 3,
            totalQuestions: 4,
            answers: {
                "q1": 0,
                "q2": [0, 1, 2],
                "q3": "quá khứ",
                "q4": { "L1": "R1" } // Incorrect matches
            },
            gradedAnswers: {
                "q1": true,
                "q2": true,
                "q3": true,
                "q4": false
            },
            questions: mockQuestions
        },
        {
            id: "mock-attempt-2",
            testId: "test-theme-1",
            testTitle: "Kiểm tra Chủ đề 1",
            timestamp: "01/06/2026 09:15",
            score: 50,
            correctAnswersCount: 2,
            totalQuestions: 4,
            answers: {
                "q1": 1, // Incorrect
                "q2": [0, 2], // Incorrect
                "q3": "quá khứ", // Correct
                "q4": { "L1": "R3", "L2": "R1", "L3": "R2" } // Correct
            },
            gradedAnswers: {
                "q1": false,
                "q2": false,
                "q3": true,
                "q4": true
            },
            questions: mockQuestions
        }
    ]
};

const testHistorySlice = createSlice({
    name: "testHistory",
    initialState,
    reducers: {
        addAttempt: (state, action: PayloadAction<TestAttempt>) => {
            state.attempts.unshift(action.payload); // Add new attempt to the top of the history list
        },
        clearHistory: (state) => {
            state.attempts = [];
        }
    }
});

export const { addAttempt, clearHistory } = testHistorySlice.actions;
export default testHistorySlice.reducer;
