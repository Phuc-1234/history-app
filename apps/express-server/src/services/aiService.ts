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
        return JSON.parse(cleanedStr);
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
