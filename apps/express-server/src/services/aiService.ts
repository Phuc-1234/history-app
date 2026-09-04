import { APP_OVERALL_INFO } from "./ai-tools/appInfo";
import { aiToolRegistry } from "./ai-tools/registry";

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

    async callGeminiWithTools(
        contents: any[],
        options?: {
            mode?: "COURSE_ONLY" | "COURSE_FIRST" | "GENERAL";
            screenContextText?: string;
            isSupportedScreen?: boolean;
            summary?: string;
            maxRoundtrips?: number;
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
            "Bạn là trợ lý AI học tập lịch sử Việt Nam thông minh, thân thiện và đáng tin cậy.\n" +
            "Bạn có khả năng gọi các Công cụ (Tools) để tra cứu nội dung giáo trình chính xác trước khi trả lời.\n\n" +
            APP_OVERALL_INFO + "\n\n" +
            "QUY TẮC PHẢN HỒI & BẢO MẬT HỆ THỐNG (BẮT BUỘC TUÂN THỦ):\n" +
            "1. BẢO MẬT & TRẢI NGHIỆM TỰ NHIÊN: TUYỆT ĐỐI KHÔNG đề cập đến các thuật ngữ kỹ thuật, chi tiết cơ sở dữ liệu hay mã hệ thống như: 'ID', 'lessonId', 'nodeId', 'position', 'trường position', 'CSDL', 'cơ sở dữ liệu', 'database', 'bảng', 'schema', 'tool', 'function call', 'API' trong câu trả lời cho học sinh. Hãy xưng hô và giải thích tự nhiên như một giáo viên/gia sư Lịch sử.\n" +
            "2. GỌI TÊN BÀI HỌC CHUẨN XÁC: Khi nhắc đến bài học, hãy gọi rõ ràng theo số thứ tự và tên bài (ví dụ: 'Bài 2: Tri thức lịch sử và cuộc sống (Lớp 10)'). Không bao giờ nói với học sinh rằng bài học mang ID nào hay nằm ở trường dữ liệu nào.\n" +
            "3. QUY TẮC ĐỊNH DẠNG LIÊN KẾT MARKDOWN VÀ CHỐNG TRÙNG LẶP:\n" +
            "   - CHỈ ĐƯỢC PHÉP sử dụng 3 loại liên kết sau:\n" +
            "     + [Bài X: Tên bài học](lesson:ID)\n" +
            "     + [Tiêu đề nút kiến thức](node:ID)\n" +
            "     + [Lịch sử lớp X](grade:X) (ví dụ: [Lịch sử lớp 10](grade:10))\n" +
            "   - MỤC BÀI HỌC (SECTION) KHÔNG CÓ LIÊN KẾT: Ứng dụng không có link cho Mục bài học. TUYỆT ĐỐI KHÔNG gán link của Nút (node:ID) cho Mục bài học. Hãy viết tên Mục bài học dưới dạng chữ in đậm hoặc tiêu đề thuần túy (ví dụ: '**Mục 1: Hoàn cảnh lịch sử**' hoặc '### 1. Hoàn cảnh lịch sử'), sau đó liệt kê các nút kiến thức con bên dưới (ví dụ: '- [Tiêu đề nút](node:ID)').\n" +
            "   - CHỐNG LẶP TỪ NGỮ: TUYỆT ĐỐI KHÔNG viết lặp từ ngữ hoặc tiêu đề 2 lần trước và trong liên kết.\n" +
            "     + CẤM: 'Bài [Bài 2: Tri thức lịch sử](lesson:7)' hoặc 'Bài học [Bài 2: Tri thức lịch sử](lesson:7)' -> ĐÚNG: '[Bài 2: Tri thức lịch sử](lesson:7)'.\n" +
            "     + CẤM: 'Hiện thực lịch sử: [Hiện thực lịch sử](node:739)' -> ĐÚNG: '[Hiện thực lịch sử](node:739)' hoặc '- [Hiện thực lịch sử](node:739)'.\n" +
            "   - TUYỆT ĐỐI KHÔNG tự tạo các liên kết giả lập hoặc cú pháp không được hỗ trợ như (search:...), (query:...), (find:...), (topic:...), (section:...), v.v.\n" +
            "   - KHÔNG viết mã ID số ra phần hiển thị của văn bản (ví dụ: viết [Bài 2: Tri thức lịch sử](lesson:7), CẤM VIẾT [Bài học ID 7](lesson:7)).\n" +
            "4. QUY TẮC BẮT BUỘC KHI TÓM TẮT BÀI HỌC HOẶC CHỌN BÀI NGẪU NHIÊN:\n" +
            "   - Khi người dùng hỏi về bất kỳ bài học nào (ví dụ: 'Bài 3', 'Bài 1 lớp 10') hoặc yêu cầu 'tóm tắt 1 bài ngẫu nhiên', bạn BẮT BUỘC PHẢI GỌI TOOL (như get_grade_overview hoặc get_lesson_detail) để lấy chính xác thông tin bài học và danh sách mục/nút từ cơ sở dữ liệu trước khi trả lời.\n" +
            "   - CHỈ ĐƯỢC PHÉP tạo liên kết [Tiêu đề nút](node:ID) cho các nút THỰC SỰ THUỘC VỀ BÀI HỌC ĐÓ (lấy từ kết quả tool get_lesson_detail). TUYỆT ĐỐI KHÔNG dùng nodeId của bài khác hoặc tự bịa đặt ID.\n" +
            "   - Số thứ tự bài học (Bài 1, Bài 2, Bài 3,...) là số thứ tự tăng dần liên tục trong toàn bộ khối lớp (trải qua các chủ đề). Ví dụ: Lớp 10 có Topic 1 gồm Bài 1, Bài 2; Topic 2 là Bài 3, Bài 4. Khi tìm 'Bài 3', hãy tra cứu với lessonPosition = 3.\n\n" +
            "QUY TẮC NGÔN NGỮ TRẢ LỜI (BẮT BUỘC):\n" +
            "- Nếu tin nhắn mới nhất của người dùng được viết bằng tiếng Anh (hoặc người dùng hỏi bằng tiếng Anh), bạn BẮT BUỘC phải trả lời hoàn toàn bằng tiếng Anh.\n" +
            "- Nếu tin nhắn của người dùng bằng tiếng Việt, bạn trả lời bằng tiếng Việt.\n\n";

        if (options?.summary) {
            systemPrompt += `TÓM TẮT BỐI CẢNH CÁC TIN NHẮN TRƯỚC ĐÓ TRONG CUỘC TRÒ CHUYỆN:\n${options.summary}\n\n`;
        }

        if (options?.screenContextText) {
            if (options.isSupportedScreen === false) {
                systemPrompt += `MÀN HÌNH NGƯỜI DÙNG ĐANG MỞ:\n${options.screenContextText}\n- Màn hình này không tự động gửi bối cảnh nội dung. Nếu người dùng hỏi câu hỏi tổng quát, hãy chủ động dùng Tool tra cứu dữ liệu.\n\n`;
            } else {
                systemPrompt += `MÀN HÌNH NGƯỜI DÙNG ĐANG MỞ (GỢI Ý BỐI CẢNH):\n${options.screenContextText}\n\n`;
            }
        }

        if (options?.mode === "COURSE_ONLY") {
            systemPrompt += `CHẾ ĐỘ NỘI DUNG: CHỈ SỬ DỤNG DỮ LIỆU GIÁO TRÌNH (COURSE ONLY).
QUY TẮC BẮT BUỘC:
1. Bạn CHỈ ĐƯỢC PHÉP trả lời dựa trên thông tin lấy được từ việc gọi các Tools tra cứu cơ sở dữ liệu giáo trình bên dưới. KHÔNG tự suy đoán hay lấy thông tin ngoài giáo trình.
2. Nếu gọi các Tools mà không tìm thấy dữ liệu giáo trình liên quan, hãy trả lời lịch sự: "Rất tiếc, thông tin này chưa có trong bộ giáo trình của ứng dụng."
3. Khi nhắc tới Bài học hoặc Nút kiến thức, BẮT BUỘC chèn liên kết Markdown: [Bài X: Tên bài học](lesson:ID) hoặc [Tiêu đề nút](node:ID).\n\n`;
        } else if (options?.mode === "COURSE_FIRST") {
            systemPrompt += `CHẾ ĐỘ NỘI DUNG: ƯU TIÊN DỮ LIỆU GIÁO TRÌNH (COURSE FIRST).
QUY TẮC BẮT BUỘC:
1. Hãy chủ động dùng Tools tra cứu dữ liệu giáo trình để trả lời.
2. Nếu câu hỏi vượt quá dữ liệu giáo trình và bạn bổ sung thêm kiến thức lịch sử bên ngoài, BẮT BUỘC phải viết dòng ghi chú ĐẦU TIÊN ngay trước phần kiến thức ngoài đó:
   "\n\n> ⚠️ *Lưu ý: Phần thông tin dưới đây được tổng hợp thêm từ nguồn ngoài giáo trình chuẩn của ứng dụng:*\n\n"
3. Khi trích dẫn thông tin từ giáo trình, hãy chèn liên kết Markdown: [Bài X: Tên bài](lesson:ID) hoặc [Tiêu đề nút](node:ID).\n\n`;
        } else {
            systemPrompt += `CHẾ ĐỘ NỘI DUNG: TRỢ LÝ TỰ DO (GENERAL).
Chủ động sử dụng Tools tra cứu dữ liệu ứng dụng khi cần thiết, và hỗ trợ giải đáp thắc mắc lịch sử tự do, chính xác. Khi trích dẫn bài học hay nút kiến thức, tạo liên kết Markdown [Bài X: Tên bài](lesson:ID) hoặc [Tiêu đề nút](node:ID).\n\n`;
        }

        const toolsPayload = [{
            functionDeclarations: aiToolRegistry.getFunctionDeclarations()
        }];

        const currentContents = JSON.parse(JSON.stringify(contents));
        let totalUsageTokens = 0;
        const maxToolCalls = options?.maxRoundtrips ?? 3;

        for (const apiKey of shuffledKeys) {
            try {
                let toolCallsExecuted = 0;
                const MAX_TOOL_CALLS = maxToolCalls;

                // Loop up to MAX_TOOL_CALLS + 1 (last turn generates final text)
                for (let turn = 0; turn < MAX_TOOL_CALLS + 1; turn++) {
                    const shouldIncludeTools = toolCallsExecuted < MAX_TOOL_CALLS;
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
                            contents: currentContents,
                            tools: toolsPayload,
                            generationConfig: {
                                temperature: options?.mode === "COURSE_ONLY" ? 0.2 : 0.7
                            }
                        })
                    });

                    if (!response.ok) {
                        const errText = await response.text().catch(() => "");
                        if (response.status === 503) {
                            // Brief backoff on temporary model overload
                            await new Promise(r => setTimeout(r, 400));
                        }
                        throw new Error(`Status ${response.status}: ${errText}`);
                    }

                    const data: any = await response.json();
                    const candidate = data.candidates?.[0];
                    if (!candidate) {
                        throw new Error("Invalid response structure from Gemini.");
                    }

                    totalUsageTokens += data.usageMetadata?.totalTokenCount || 500;
                    const parts = candidate.content?.parts || [];

                    // Check if model returned function call requests (supports single and parallel tool calls)
                    const functionCallParts = parts.filter((p: any) => p.functionCall);
                    if (functionCallParts.length > 0) {
                        if (shouldIncludeTools) {
                            toolCallsExecuted++;
                            console.log(`[AI Chat] Gemini requested ${functionCallParts.length} tool call(s) (Round #${toolCallsExecuted}/${MAX_TOOL_CALLS}):`);
                            const functionResponseParts: any[] = [];

                            for (const fcp of functionCallParts) {
                                const { name: toolName, args: toolArgs } = fcp.functionCall;
                                console.log(`  -> Executing '${toolName}' with args:`, toolArgs);
                                const toolResult = await aiToolRegistry.executeToolCall(toolName, toolArgs);
                                functionResponseParts.push({
                                    functionResponse: {
                                        name: toolName,
                                        response: { name: toolName, content: toolResult }
                                    }
                                });
                            }

                            // Push all model function calls
                            currentContents.push({
                                role: "model",
                                parts: functionCallParts
                            });

                            // Push all matching function responses
                            currentContents.push({
                                role: "function",
                                parts: functionResponseParts
                            });

                            // Continue loop to send tool response back to Gemini
                            continue;
                        } else {
                            // Model wanted more tools but reached max tool limit: satisfy Gemini's turn contract and prompt for final text
                            currentContents.push({
                                role: "model",
                                parts: functionCallParts
                            });
                            currentContents.push({
                                role: "function",
                                parts: functionCallParts.map((fcp: any) => ({
                                    functionResponse: {
                                        name: fcp.functionCall.name,
                                        response: { name: fcp.functionCall.name, content: "Đã hoàn thành tra cứu. Hãy tổng hợp câu trả lời chi tiết và rõ ràng cho học sinh dựa trên tất cả thông tin đã có." }
                                    }
                                }))
                            });
                            continue;
                        }
                    }

                    // Otherwise return the final text response
                    const textResponse = parts.map((p: any) => p.text || "").join("").trim();
                    if (!textResponse) {
                        throw new Error("Empty text response from Gemini after tool execution.");
                    }

                    return { text: textResponse, usageTokens: totalUsageTokens };
                }

                throw new Error("Max tool call iterations reached without final text response.");
            } catch (error: any) {
                console.error(`Gemini tool chat call failed with key ending in ...${apiKey.slice(-5)}:`, error.message);
                lastError = error;
            }
        }

        throw new Error(`All Gemini API keys failed in Tool Calling mode. Last error: ${lastError?.message}`);
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
        const prompt = `Bạn là một chuyên gia phân tích và trực quan hóa sơ đồ tư duy (mindmap) lịch sử. Hãy phân tích đoạn văn bản lịch sử sau đây và tổ chức thành một cấu trúc sơ đồ tư duy phân cấp dạng cây dưới dạng JSON.
TẤT CẢ các thành phần trong sơ đồ tư duy (từ nhánh gốc, nhánh con, đến nhánh lá cuối cùng) đều bắt buộc phải là NHÁNH (sections/children), TUYỆT ĐỐI KHÔNG sử dụng hay trả về bất kỳ trường "nodes" hoặc khái niệm "nút" nào.

Định dạng JSON trả về phải tuân thủ CHÍNH XÁC cấu trúc sau:
{
  "sections": [
    {
      "name": "Tên nhánh chính (ví dụ: 1. Hoàn cảnh lịch sử)",
      "position": 1,
      "children": [
        {
          "name": "Tên nhánh phụ (ví dụ: Nguyên nhân sâu xa)",
          "position": 1,
          "children": [
            {
              "name": "Nội dung nhánh chi tiết / nhánh lá (ví dụ: Mâu thuẫn giai cấp sâu sắc)",
              "position": 1,
              "children": []
            }
          ]
        }
      ]
    }
  ]
}

Lưu ý quan trọng:
- Mỗi nhánh phải có "name" ngắn gọn, súc tích (dưới 15 từ), phù hợp để hiển thị trực quan trên sơ đồ tư duy.
- Phân cấp cây logic, rõ ràng từ khái niệm tổng quát đến chi tiết (khoảng 2 đến 4 cấp phân nhánh).
- TẤT CẢ các nhánh lá cuối cùng đều là nhánh có "children": [], KHÔNG tạo mảng "nodes".
- "children" là danh sách các nhánh con (cấu trúc đệ quy giống hệt như "sections").
- "position" là thứ tự số nguyên từ 1 trở đi.
- Chỉ trả về duy nhất chuỗi JSON hợp lệ, không có thêm bất kỳ văn bản giải thích nào khác ngoài JSON, không bọc trong markdown codeblock \`\`\`json.

Đoạn văn bản cần tóm tắt thành sơ đồ tư duy:
${text}`;

        const jsonStr = await this.callGemini(prompt);
        const cleanedStr = this.cleanJson(jsonStr);
        const data = JSON.parse(cleanedStr);

        let idCounter = Date.now();
        const normalizeSections = (sections: any[]) => {
            for (const s of sections) {
                if (!s.id) {
                    s.id = idCounter++;
                }
                if (!s.children || !Array.isArray(s.children)) {
                    s.children = [];
                }
                // Convert any accidental "nodes" into child branches ("nhánh")
                if (s.nodes && Array.isArray(s.nodes) && s.nodes.length > 0) {
                    for (const n of s.nodes) {
                        s.children.push({
                            id: n.id || idCounter++,
                            name: n.header || n.body || "Chi tiết",
                            position: n.position || s.children.length + 1,
                            children: [],
                        });
                    }
                }
                delete s.nodes;

                if (s.children.length > 0) {
                    normalizeSections(s.children);
                }
            }
        };

        if (data && Array.isArray(data.sections)) {
            normalizeSections(data.sections);
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
