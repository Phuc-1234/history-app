# Đặc tả Use Case (React Native Client)

## 1. Use case: Mua gói PRO
- **Dữ liệu đầu vào:** Lựa chọn gói PRO (tháng/năm), phương thức thanh toán, thông tin xác thực thanh toán.
- **Dòng sự kiện:** Người dùng chọn mua gói PRO -> hệ thống hiển thị danh sách gói và phương thức thanh toán -> người dùng chọn gói và xác nhận thanh toán -> hệ thống xử lý giao dịch qua cổng thanh toán -> hệ thống kích hoạt quyền PRO và gửi thông báo thành công.
- **Ngoại lệ:** Thanh toán thất bại hoặc bị hủy, số dư không đủ, lỗi kết nối cổng thanh toán, tài khoản đã sở hữu gói PRO còn hạn.
- **Trạng thái trước:** Đã đăng nhập, tài khoản hiện tại là tài khoản thường (hoặc gói sắp hết hạn).
- **Trạng thái sau:** Tài khoản được nâng cấp lên PRO và mở khóa các tính năng cao cấp.

## 2. Use case: Kết bạn
- **Dữ liệu đầu vào:** Tên người dùng, email hoặc ID/mã giới thiệu của bạn bè.
- **Dòng sự kiện:** Người dùng tìm kiếm bạn bè -> chọn "Thêm bạn" -> hệ thống gửi lời mời kết bạn -> đối phương chấp nhận lời mời -> hệ thống ghi nhận mối quan hệ bạn bè.
- **Ngoại lệ:** Không tìm thấy người dùng, đã gửi lời mời trước đó, đã là bạn bè, người dùng đích chặn nhận lời mời kết bạn, lỗi hệ thống.
- **Trạng thái trước:** Đã đăng nhập, chưa kết bạn với người dùng mục tiêu.
- **Trạng thái sau:** Trở thành bạn bè của nhau trong ứng dụng và hiển thị trong danh sách bạn bè.

## 3. Use case: Theo dõi
- **Dữ liệu đầu vào:** ID hoặc trang cá nhân của người dùng khác.
- **Dòng sự kiện:** Người dùng truy cập trang cá nhân của người khác -> nhấn nút "Theo dõi" -> hệ thống cập nhật trạng thái theo dõi và tăng số lượng người theo dõi của đối phương.
- **Ngoại lệ:** Tự theo dõi chính mình, đối phương đã khóa/xóa tài khoản, lỗi kết nối mạng.
- **Trạng thái trước:** Đã đăng nhập, chưa theo dõi người dùng mục tiêu.
- **Trạng thái sau:** Đã theo dõi người dùng mục tiêu.

## 4. Use case: Tham gia phòng thi đấu
- **Dữ liệu đầu vào:** Mã phòng thi đấu (PIN/Code) hoặc chọn phòng từ danh sách công khai.
- **Dòng sự kiện:** Người dùng truy cập mục thi đấu -> nhập mã phòng hoặc chọn phòng -> chọn "Tham gia" -> hệ thống kiểm tra điều kiện và đưa người dùng vào phòng chờ thi đấu.
- **Ngoại lệ:** Mã phòng không đúng, phòng đã đầy người tham gia, trận đấu đã bắt đầu/kết thúc, bị chủ phòng cấm/đuổi khỏi phòng.
- **Trạng thái trước:** Đã đăng nhập, chưa tham gia phòng thi đấu khác.
- **Trạng thái sau:** Có mặt trong phòng chờ thi đấu và sẵn sàng tham gia trận đấu.

## 5. Use case: Nhận thông báo
- **Dữ liệu đầu vào:** Quyền truy cập thông báo trên thiết bị, tùy chọn loại thông báo.
- **Dòng sự kiện:** Hệ thống phát sinh sự kiện (lời mời kết bạn, kết quả trận đấu, nhắc nhở học tập, tin tức) -> hệ thống gửi thông báo push/in-app -> ứng dụng hiển thị thông báo -> người dùng nhấn xem thông báo.
- **Ngoại lệ:** Người dùng tắt quyền nhận thông báo trên thiết bị, mất kết nối mạng, thông báo không còn tồn tại.
- **Trạng thái trước:** Ứng dụng đã được cài đặt trên thiết bị.
- **Trạng thái sau:** Thông báo được hiển thị và cập nhật trạng thái đã đọc khi tương tác.

## 6. Use case: Góp ý cho nhà phát triển
- **Dữ liệu đầu vào:** Tiêu đề, loại góp ý (báo lỗi, đề xuất tính năng, ý kiến khác), nội dung góp ý, hình ảnh/tệp đính kèm (nếu có).
- **Dòng sự kiện:** Người dùng mở màn hình Góp ý/Báo lỗi -> điền thông tin và tải lên tệp đính kèm -> nhấn "Gửi" -> hệ thống tiếp nhận, lưu dữ liệu và phản hồi thông báo thành công.
- **Ngoại lệ:** Để trống thông tin bắt buộc, dung lượng tệp đính kèm vượt quá giới hạn, lỗi kết nối máy chủ.
- **Trạng thái trước:** Đã đăng nhập vào ứng dụng.
- **Trạng thái sau:** Góp ý được lưu vào hệ thống để quản trị viên phản hồi.

## 7. Use case: Quản lý vật phẩm
- **Dữ liệu đầu vào:** Danh sách vật phẩm cá nhân, lựa chọn vật phẩm, thao tác thực hiện (trang bị, sử dụng, tháo bỏ).
- **Dòng sự kiện:** Người dùng truy cập Túi đồ/Kho vật phẩm -> xem danh sách vật phẩm -> chọn vật phẩm và bấm trang bị/sử dụng -> hệ thống kiểm tra và áp dụng hiệu ứng/trạng thái vật phẩm.
- **Ngoại lệ:** Vật phẩm đã hết hạn hoặc hết số lượng, không đủ điều kiện sử dụng (cấp độ, vị trí), lỗi cập nhật dữ liệu.
- **Trạng thái trước:** Đã đăng nhập, có vật phẩm trong kho.
- **Trạng thái sau:** Vật phẩm được trang bị hoặc cập nhật số lượng/trạng thái mới.

## 8. Use case: Sử dụng AI chat
- **Dữ liệu đầu vào:** Câu hỏi hoặc nội dung trò chuyện (văn bản, hình ảnh, giọng nói).
- **Dòng sự kiện:** Người dùng truy cập màn hình AI chat -> nhập câu hỏi và gửi -> hệ thống chuyển yêu cầu tới dịch vụ AI -> AI xử lý và trả về kết quả trên màn hình trò chuyện.
- **Ngoại lệ:** Hết lượt/lượng token sử dụng AI, nội dung vi phạm chính sách, dịch vụ AI quá tải/gặp lỗi, mất kết nối mạng.
- **Trạng thái trước:** Đã đăng nhập, mở màn hình AI chat.
- **Trạng thái sau:** Nhận được câu trả lời từ AI và lịch sử trò chuyện được lưu.
