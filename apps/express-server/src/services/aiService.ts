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
            isSupportedScreen?: boolean;
            summary?: string;
        }
    ): Promise<{ text: string; usageTokens: number }> {
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

        const currentDateStr = new Date().toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "numeric", day: "numeric" });
        let systemPrompt = `Thời gian thực tế hôm nay: ${currentDateStr} (Múi giờ Việt Nam).\n` +
            "Bạn là trợ lý AI học tập lịch sử Việt Nam thân thiện, hữu ích. Hãy trả lời ngắn gọn, chính xác và sử dụng định dạng Markdown rõ ràng.\n\n" +
            "QUY TẮC NGÔN NGỮ TRẢ LỜI (BẮT BUỘC):\n" +
            "- Nếu tin nhắn mới nhất của người dùng được viết bằng tiếng Anh (hoặc người dùng hỏi bằng tiếng Anh), bạn BẮT BUỘC phải trả lời hoàn toàn bằng tiếng Anh.\n" +
            "- Nếu tin nhắn của người dùng bằng tiếng Việt, bạn trả lời bằng tiếng Việt.\n\n" +
            "QUY TẮC HIỂN THỊ LIÊN KẾT BÀI HỌC, NÚT KIẾN THỨC VÀ KHỐI LỚP (QUAN TRỌNG):\n" +
            "- LIÊN KẾT KHỐI LỚP: Khi gợi ý hoặc nhắc tới chương trình học của các khối lớp (Lớp 10, Lớp 11, Lớp 12), BẮT BUỘC sử dụng cú pháp: [Lịch sử lớp 10](grade:10), [Lịch sử lớp 11](grade:11), [Lịch sử lớp 12](grade:12). TUYỆT ĐỐI KHÔNG DÙNG lesson:ID cho khối lớp!\n" +
            "- LIÊN KẾT BÀI HỌC: Chỉ sử dụng [Tên bài học](lesson:ID) khi ID đó thực sự tồn tại trong phần 'DỮ LIỆU GIÁO TRÌNH TRÍCH XUẤT' bên dưới. KHÔNG tự suy đoán hay bịa mã ID bài học.\n" +
            "- LIÊN KẾT NÚT KIẾN THỨC: Chỉ sử dụng [Tiêu đề nút](node:ID) khi ID đó thực sự xuất hiện trong dữ liệu giáo trình bên dưới. TUYỆT ĐỐI KHÔNG DÙNG \"Nút id ___\", \"Nút ___\", \"Nút ID ___\" hay bất kỳ mã ID nào làm tên hiển thị của liên kết (CẤM CỤT THỂ: [Nút id 12](node:12) hoặc [Nút 12](node:12)). Luôn dùng Tiêu đề nút hoặc một cụm từ tóm tắt nội dung ngắn gọn (3-6 từ) làm tên hiển thị.\n" +
            "- KHÔNG đặt ngoặc vuông [] quanh các từ văn bản thuần túy, trừ khi tạo liên kết Markdown đúng định dạng (lesson:ID, node:ID, grade:ID).\n\n";

        if (options?.summary) {
            systemPrompt += `TÓM TẮT BỐI CẢNH CÁC TIN NHẮN TRƯỚC ĐÓ TRONG CUỘC TRÒ CHUYỆN:\n${options.summary}\n\n`;
        }

        if (options?.screenContextText) {
            if (options.isSupportedScreen === false) {
                systemPrompt += `MÀN HÌNH NGƯỜI DÙNG ĐANG MỞ:
${options.screenContextText}
- LƯU Ý QUAN TRỌNG VỀ BỐI CẢNH MÀN HÌNH CHƯA HỖ TRỢ:
  + Màn hình hiện tại của người dùng KHÔNG HỖ TRỢ tính năng nhận biết bối cảnh nội dung tự động.
  + Nếu người dùng hỏi về bối cảnh của màn hình này hoặc dùng các từ mập mờ chỉ màn hình này (ví dụ: "bài thi này", "bảng xếp hạng này", "màn hình này", "phần này", "kết quả này"), bạn BẮT BUỘC phải thông báo lịch sự rằng tính năng nhận biết bối cảnh cho màn hình này chưa được hỗ trợ, nhưng gợi ý họ vẫn có thể đặt câu hỏi chung về Lịch sử Việt Nam hoặc hỏi về các bài học (ví dụ: "Tính năng nhận biết bối cảnh cho màn hình này chưa được hỗ trợ, nhưng bạn vẫn có thể đặt câu hỏi chung về Lịch sử Việt Nam hoặc hỏi về các bài học!").
  + Nếu người dùng hỏi câu hỏi lịch sử chung không phụ thuộc vào bối cảnh màn hình, bạn vẫn trả lời câu hỏi lịch sử đó bình thường.\n\n`;
            } else {
                systemPrompt += `MÀN HÌNH NGƯỜI DÙNG ĐANG MỞ (GỢI Ý BỐI CẢNH):
${options.screenContextText}
- LƯU Ý QUAN TRỌNG VỀ BỐI CẢNH MÀN HÌNH:
  + Màn hình này là GỢI Ý NGUYÊN THỂ khi người dùng dùng từ mập mờ (ví dụ: "bài này", "nút này", "màn hình này", "ở đây", "nội dung này").
  + Màn hình này KHÔNG PHẢI là giới hạn duy nhất cho phạm vi câu hỏi. Người dùng có thể hỏi về bất kỳ bài học hoặc chủ đề nào khác trong bộ giáo trình. Bạn cần sử dụng toàn bộ 'DỮ LIỆU GIÁO TRÌNH TRÍCH XUẤT' để trả lời.\n\n`;
            }
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
2. Nếu câu hỏi vượt quá dữ liệu giáo trình và bạn bổ sung thêm kiến thức lịch sử bên ngoài, BẮT BUỘC phải viết dòng ghi chú ĐẦU TIÊN ngay trước phần kiến thức ngoài đó để phân tách rõ ràng với thông tin giáo trình:
   "\n\n> ⚠️ *Lưu ý: Phần thông tin dưới đây được tổng hợp thêm từ nguồn ngoài giáo trình chuẩn của ứng dụng:*\n\n"
3. Khi trích dẫn thông tin từ giáo trình, hãy chèn liên kết Markdown: [Tên bài](lesson:ID) hoặc [Tiêu đề nút](node:ID).

DỮ LIỆU GIÁO TRÌNH TRÍCH XUẤT:
${options.groundingContext || "Không tìm thấy dữ liệu giáo trình trực tiếp."}`;
        } else {
            systemPrompt += `CHẾ ĐỘ: TRỢ LÝ TỰ DO (GENERAL).
Hãy hỗ trợ học sinh giải đáp thắc mắc lịch sử tự do, chính xác và sinh động. Khi nhắc tới các nội dung trong ứng dụng, bạn có thể tạo liên kết Markdown [Tên bài](lesson:ID) hoặc [Chi tiết nút](node:ID) nếu phù hợp.`;

            if (options?.groundingContext) {
                systemPrompt += `\n\nDỮ LIỆU BỐI CẢNH MÀN HÌNH BÀI HỌC HIỆN TẠI NGƯỜI DÙNG ĐANG XEM:\n${options.groundingContext}`;
            }
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

                const usageTokens = data.usageMetadata?.totalTokenCount ||
                    Math.ceil((systemPrompt.length + JSON.stringify(contents).length + textResponse.length) / 4);

                return { text: textResponse, usageTokens };
            } catch (error: any) {
                console.error(`Gemini chat call failed with key ending in ...${apiKey.slice(-5)}:`, error.message);
                lastError = error;
            }
        }
        throw new Error(`All Gemini API keys failed. Last error: ${lastError?.message}`);
    }


    async generateChatTitle(firstMessage: string): Promise<string> {
        try {
            const prompt = `Tạo tiêu đề cuộc trò chuyện cực kỳ ngắn gọn (3-6 từ, không dùng dấu ngoặc kép, không dùng markdown, không dùng JSON). Chỉ trả về tiêu đề dưới dạng chuỗi chữ thuần túy cho câu hỏi này: "${firstMessage}"`;
            let title = await this.callGemini(prompt);
            title = title.trim();

            // Handle cases where model returns JSON object (e.g. { "title": "..." })
            if (title.startsWith("{")) {
                try {
                    const parsed = JSON.parse(title);
                    title = parsed.title || parsed.text || parsed.result || Object.values(parsed)[0] || title;
                } catch {}
            }

            title = String(title)
                .replace(/^"|"$/g, "")
                .replace(/^\{\s*"title"\s*:\s*"/i, "")
                .replace(/"\s*\}$/, "")
                .trim();

            return title || (firstMessage.length > 30 ? firstMessage.slice(0, 30) + "..." : firstMessage);
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

    async summarizeContext(
        messages: { sender: string; content: string }[],
        previousSummary?: string
    ): Promise<string> {
        try {
            const formatted = messages.map(m => `${m.sender === "user" ? "Học sinh" : "AI"}: ${m.content}`).join("\n");
            let prompt = `Bạn là một trợ lý AI tóm tắt hội thoại học tập. Hãy tóm tắt ngắn gọn bối cảnh và các ý chính của cuộc trò chuyện dưới đây (tối đa 150-200 từ).\n`;
            if (previousSummary) {
                prompt += `Tóm tắt bối cảnh các tin nhắn trước:\n${previousSummary}\n\n`;
            }
            prompt += `Nội dung cuộc trò chuyện gần đây cần hợp nhất vào tóm tắt:\n${formatted}\n\nChỉ trả về đoạn văn tóm tắt bối cảnh thuần túy, không định dạng JSON hay thêm lời chào filler.`;
            return await this.callGemini(prompt);
        } catch (error) {
            console.error("Failed to generate context summary:", error);
            return previousSummary || "";
        }
    }
}

export const aiService = new AIService();
