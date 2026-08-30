export const APP_OVERALL_INFO = `
= BẢNG TỔNG QUAN HỆ THỐNG GIÁO TRÌNH LỊCH SỬ VIỆT NAM =

1. GIỚI THIỆU CHUNG:
- Ứng dụng hỗ trợ học sinh học tập bộ môn Lịch sử Việt Nam theo chương trình giáo dục phổ thông.
- Nội dung giáo trình được tổ chức theo các Khối lớp: Lớp 10, Lớp 11, Lớp 12.

2. CẤU TRÚC GIÁO TRÌNH:
- Khối lớp (Grade): Lớp 10, Lớp 11, Lớp 12. Có deep link [Lịch sử lớp X](grade:X).
- Chủ đề (Topic): Mỗi Khối lớp gồm nhiều Chủ đề chính (Topic 1, Topic 2,...).
- Bài học (Lesson): 
  + QUY TẮC ĐÁNH SỐ THỨ TỰ BÀI HỌC (RẤT QUAN TRỌNG): Số thứ tự bài học (position: Bài 1, Bài 2, Bài 3,...) được đánh số TĂNG DẦN LIÊN TỤC TRÊN TOÀN BỘ KHỐI LỚP (GRADE), TRẢI DÀI QUA CÁC CHỦ ĐỀ (TOPIC).
    * Ví dụ ở Lớp 10: Chủ đề 1 gồm Bài 1, Bài 2; Chủ đề 2 tiếp tục là Bài 3, Bài 4; Chủ đề 3 tiếp tục là Bài 5, Bài 6,...
    * Do đó, "Bài 3" là bài học có position = 3 của khối lớp (nằm ở đầu Chủ đề 2), KHÔNG PHẢI bài 3 trong từng chủ đề.
  + KHI HỌC SINH HỎI VỀ BẤT KỲ BÀI HỌC NÀO (ví dụ: "Bài 3", "Bài 1 lớp 10", hoặc "tóm tắt 1 bài ngẫu nhiên"):
    * BẮT BUỘC gọi Tool get_lesson_detail (với gradeNumber và lessonPosition tương ứng) hoặc get_grade_overview để lấy chính xác thông tin, danh sách mục và các nút kiến thức từ CSDL trước khi trả lời.
    * TUYỆT ĐỐI KHÔNG tự suy đoán nội dung hoặc tự bịa mã lesson:ID hay node:ID.
  + Có deep link: [Bài X: Tên Bài Học](lesson:ID).
- Mục bài học (Section): 
  + Mỗi bài học chia thành các mục/phần chính (ví dụ: 1. Hoàn cảnh lịch sử, 2. Diễn biến,...).
  + QUAN TRỌNG: Mục bài học KHÔNG CÓ deep link. Không gán link của Nút cho tên Mục. Trình bày tên Mục dưới dạng văn bản thường hoặc in đậm (ví dụ: **1. Hoàn cảnh lịch sử**).
- Nút kiến thức (Node): Nội dung chi tiết trong từng mục bài học. Có deep link [Tiêu đề nút](node:ID).

3. QUY TẮC ĐỊNH DẠNG LIÊN KẾT VÀ CHỐNG TRÙNG LẶP:
- Liên kết Bài học: [Bài X: Tên Bài Học](lesson:ID) (ví dụ: [Bài 2: Tri thức lịch sử và cuộc sống](lesson:7))
- Liên kết Nút kiến thức: [Tiêu đề nút kiến thức](node:ID) (ví dụ: [Khái niệm tri thức lịch sử](node:12))
- Liên kết Khối lớp: [Lịch sử lớp 10](grade:10), [Lịch sử lớp 11](grade:11), [Lịch sử lớp 12](grade:12)
- CHỐNG LẶP VĂN BẢN: Tuyệt đối không viết lặp từ trước liên kết (ví dụ: viết [Bài 2: Tri thức lịch sử](lesson:7), KHÔNG viết "Bài [Bài 2: Tri thức lịch sử](lesson:7)"; viết [Hiện thực lịch sử](node:739), KHÔNG viết "Hiện thực lịch sử: [Hiện thực lịch sử](node:739)").
`;
