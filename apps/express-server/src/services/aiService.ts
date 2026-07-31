interface AIFlashcard {
    frontText: string;
    backText: string;
}

export class AIService {
    private cleanJson(text: string): string {
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        if (start === -1 || end === -1 || start > end) {
            throw new Error("Could not extract JSON block from model response. Response was: " + text);
        }
        return text.substring(start, end + 1);
    }

    private async callGemini(prompt: string): Promise<string> {
        const keys = [
            process.env.GEMINI_API_KEY_1,
            process.env.GEMINI_API_KEY_2,
            process.env.GEMINI_API_KEY_3
        ].map(k => k?.trim().replace(/^"|"$/g, "")).filter(Boolean) as string[];

        if (keys.length === 0) {
            throw new Error("No Gemini API keys found in environment variables.");
        }

        const model = (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim().replace(/^"|"$/g, "");
        let lastError: Error | null = null;

        // Shuffle keys to load balance
        const shuffledKeys = [...keys].sort(() => Math.random() - 0.5);

        for (const apiKey of shuffledKeys) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: prompt
                            }]
                        }],
                        generationConfig: {
                            responseMimeType: "application/json",
                            temperature: 0.2
                        }
                    })
                });

                if (!response.ok) {
                    const errText = await response.text().catch(() => "");
                    throw new Error(`Status ${response.status}: ${errText}`);
                }

                const data: any = await response.json();
                const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!textResponse) {
                    throw new Error("Invalid response structure (missing candidates/text)");
                }
                return textResponse;
            } catch (error: any) {
                console.error(`Gemini call failed with key ending in ...${apiKey.slice(-5)}:`, error.message);
                lastError = error;
            }
        }

        throw new Error(`All Gemini API keys failed. Last error: ${lastError?.message}`);
    }

    async callGeminiChat(
        contents: { role: "user" | "model"; parts: { text: string }[] }[],
        options?: {
            mode?: "COURSE_ONLY" | "COURSE_FIRST" | "GENERAL";
            groundingContext?: string;
            screenContextText?: string;
        }
    ): Promise<string> {
        const keys = [
            process.env.GEMINI_API_KEY_1,
            process.env.GEMINI_API_KEY_2,
            process.env.GEMINI_API_KEY_3
        ].map(k => k?.trim().replace(/^"|"$/g, "")).filter(Boolean) as string[];

        if (keys.length === 0) {
            throw new Error("No Gemini API keys found in environment variables.");
        }

        const model = (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim().replace(/^"|"$/g, "");
        let lastError: Error | null = null;
        const shuffledKeys = [...keys].sort(() => Math.random() - 0.5);

        let systemPrompt = "Bạn là trợ lý AI học tập lịch sử Việt Nam và thế giới thân thiện, hữu ích. Hãy trả lời ngắn gọn, chính xác và sử dụng định dạng Markdown rõ ràng.\n\n";

        if (options?.screenContextText) {
            systemPrompt += `MÀN HÌNH NGƯỜI DÙNG ĐANG MỞ:\n${options.screenContextText}\n\n`;
        }

        if (options?.mode === "COURSE_ONLY") {
            systemPrompt += `CHẾ ĐỘ: CHỈ SỬ DỤNG DỮ LIỆU GIÁO TRÌNH (COURSE ONLY).
QUY TẮC BẮT BUỘC:
1. Bạn CHỈ ĐƯỢC PHÉP trả lời dựa trên thông tin có trong phần 'DỮ LIỆU GIÁO TRÌNH TRÍCH XUẤT' bên dưới. KHÔNG tự suy đoán hay lấy thông tin bên ngoài.
2. Nếu dữ liệu giáo trình không có câu trả lời cho thắc mắc, hãy trả lời lịch sự: "Rất tiếc, thông tin này chưa có trong bộ giáo trình của ứng dụng."
3. Khi nhắc tới Bài học hoặc Nút kiến thức trong dữ liệu giáo trình, BẮT BUỘC chèn liên kết Markdown theo đúng cú pháp:
   - Bài học: [Tên bài học](lesson:ID) (ví dụ: [Bài 3: Cách mạng tháng Tám](lesson:3))
   - Nút kiến thức: [Tiêu đề nút](node:ID) (ví dụ: [Chi tiết diễn biến](node:12))

DỮ LIỆU GIÁO TRÌNH TRÍCH XUẤT:
${options.groundingContext || "Không tìm thấy dữ liệu giáo trình liên quan."}`;
        } else if (options?.mode === "COURSE_FIRST") {
            systemPrompt += `CHẾ ĐỘ: ƯU TIÊN DỮ LIỆU GIÁO TRÌNH (COURSE FIRST).
QUY TẮC BẮT BUỘC:
1. Hãy ưu tiên sử dụng thông tin trong phần 'DỮ LIỆU GIÁO TRÌNH TRÍCH XUẤT' bên dưới để trả lời.
2. Nếu câu hỏi vượt quá dữ liệu giáo trình có sẵn, bạn CÓ THỂ bổ sung thêm kiến thức lịch sử bên ngoài, nhưng BẮT BUỘC kèm theo dòng ghi chú ở cuối câu trả lời:
   "\n\n*Lưu ý: Một số thông tin trên được tổng hợp thêm ngoài giáo trình chuẩn của ứng dụng.*"
3. Khi trích dẫn thông tin từ giáo trình, hãy chèn liên kết Markdown: [Tên bài](lesson:ID) hoặc [Tiêu đề nút](node:ID).

DỮ LIỆU GIÁO TRÌNH TRÍCH XUẤT:
${options.groundingContext || "Không tìm thấy dữ liệu giáo trình trực tiếp."}`;
        } else {
            systemPrompt += `CHẾ ĐỘ: TRỢ LÝ TỰ DO (GENERAL).
Hãy hỗ trợ học sinh giải đáp thắc mắc lịch sử tự do, chính xác và sinh động. Khi nhắc tới các nội dung trong ứng dụng, bạn có thể tạo liên kết Markdown [Tên bài](lesson:ID) hoặc [Chi tiết nút](node:ID) nếu phù hợp.`;
        }

        for (const apiKey of shuffledKeys) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        systemInstruction: {
                            parts: [{ text: systemPrompt }]
                        },
                        contents,
                        generationConfig: {
                            temperature: options?.mode === "COURSE_ONLY" ? 0.2 : 0.7
                        }
                    })
                });

                if (!response.ok) {
                    const errText = await response.text().catch(() => "");
                    throw new Error(`Status ${response.status}: ${errText}`);
                }

                const data: any = await response.json();
                const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!textResponse) {
                    throw new Error("Invalid response structure from Gemini.");
                }
                return textResponse;
            } catch (error: any) {
                console.error(`Gemini chat call failed with key ending in ...${apiKey.slice(-5)}:`, error.message);
                lastError = error;
            }
        }
        throw new Error(`All Gemini API keys failed. Last error: ${lastError?.message}`);
    }


    async generateChatTitle(firstMessage: string): Promise<string> {
        try {
            const prompt = `Tạo tiêu đề cuộc trò chuyện cực kỳ ngắn gọn (3-6 từ, không dấu ngoặc kép, không dùng markdown) dựa trên câu hỏi đầu tiên này: "${firstMessage}"`;
            const title = await this.callGemini(prompt);
            return title.trim().replace(/^"|"$/g, "") || firstMessage.slice(0, 30);
        } catch {
            return firstMessage.length > 30 ? firstMessage.slice(0, 30) + "..." : firstMessage;
        }
    }

    async generateMindMap(text: string): Promise<{ sections: any[] }> {
        const prompt = `Bạn là một trợ lý AI phân tích lịch sử. Hãy tóm tắt đoạn văn bản lịch sử sau đây thành một cấu trúc sơ đồ tư duy (mindmap) dưới dạng JSON.
Định dạng JSON trả về phải tuân thủ CHÍNH XÁC cấu trúc sau:
{
  "sections": [
    {
      "name": "Tên nhánh (ví dụ: 1. Hoàn cảnh lịch sử)",
      "position": 1,
      "nodes": [
        {
          "header": "Tiêu đề nút (ví dụ: Nguyên nhân trực tiếp)",
          "body": "Nội dung tóm tắt chi tiết của nút kiến thức này",
          "position": 1
        }
      ],
      "children": []
    }
  ]
}
Lưu ý:
- "children" là danh sách các nhánh con (cấu trúc đệ quy giống như "sections").
- Hãy chia nhỏ thông tin hợp lý để sơ đồ tư duy có cấu trúc phân cấp rõ ràng.
- Chỉ trả về duy nhất chuỗi JSON hợp lệ, không có thêm bất kỳ văn bản giải thích nào khác ngoài JSON, không bọc trong markdown codeblock \`\`\`json.

Đoạn văn bản cần tóm tắt:
${text}`;

        const jsonStr = await this.callGemini(prompt);
        const cleanedStr = this.cleanJson(jsonStr);
        const data = JSON.parse(cleanedStr);

        let idCounter = Date.now();
        const addIds = (sections: any[]) => {
            for (const s of sections) {
                if (!s.id) {
                    s.id = idCounter++;
                }
                if (s.nodes && Array.isArray(s.nodes)) {
                    for (const n of s.nodes) {
                        if (!n.id) {
                            n.id = idCounter++;
                        }
                    }
                }
                if (s.children && Array.isArray(s.children)) {
                    addIds(s.children);
                }
            }
        };

        if (data && Array.isArray(data.sections)) {
            addIds(data.sections);
        }

        return data;
    }

    async generateFlashcards(text: string): Promise<{ flashcards: AIFlashcard[] }> {
        const prompt = `Bạn là một trợ lý AI tạo tài liệu học tập. Hãy tạo các thẻ ghi nhớ (flashcards) từ đoạn văn bản lịch sử sau đây dưới dạng JSON.
Định dạng JSON trả về phải tuân thủ CHÍNH XÁC cấu trúc sau:
{
  "flashcards": [
    {
      "frontText": "Câu hỏi hoặc thuật ngữ mặt trước",
      "backText": "Câu trả lời hoặc định nghĩa chi tiết ở mặt sau"
    }
  ]
}
Lưu ý:
- Chỉ trả về duy nhất chuỗi JSON hợp lệ, không có thêm bất kỳ văn bản giải thích nào khác ngoài JSON, không bọc trong markdown codeblock \`\`\`json.

Đoạn văn bản cần trích xuất:
${text}`;

        const jsonStr = await this.callGemini(prompt);
        const cleanedStr = this.cleanJson(jsonStr);
        return JSON.parse(cleanedStr);
    }
}

export const aiService = new AIService();
