# Dữ liệu và quyền truy cập

LP YouTube Downloader hoạt động với YouTube và helper cục bộ trên Windows.

- Quyền `cookies`: đọc cookie thuộc YouTube và gửi tới helper trên cùng máy để xử lý video theo phiên hiện tại. Cookie không được gửi tới GitHub hoặc máy chủ của Lapphan.
- Quyền `nativeMessaging`: trao đổi ID video, chất lượng, tiến trình và kết quả với `com.lp.youtube_downloader`.
- Quyền `storage`: giữ lịch sử lượt tải giới hạn trong phiên extension; tối đa 30 lượt hoàn tất/lỗi, ngoài các lượt đang chạy.
- Host permissions: chỉ `https://www.youtube.com/*` và `https://m.youtube.com/*`.

Helper tạo cookie file tạm trong thư mục riêng của ứng dụng, dùng nó cho yt-dlp và dọn sau thao tác. File tạm có thể còn lại nếu process hoặc máy bị tắt đột ngột; helper dọn thư mục tạm do nó sở hữu khi khởi động lại. Video được tải trực tiếp từ các dịch vụ mà yt-dlp truy cập, sau đó lưu vào Downloads của Windows.

Không có analytics hay backend của sản phẩm. Nút GitHub chỉ mở repository khi người dùng bấm. Khi nhà phát triển chạy `npm run setup:helper`, công cụ tải runtime đã khóa checksum từ GitHub Releases; gói offline cho người dùng đã chứa các runtime này.

Gỡ helper sẽ xóa native registration và bộ cài trong AppData. Video đã tải trong Downloads được giữ lại. Xóa extension khỏi Edge/Chrome là thao tác riêng trong trang Extensions của trình duyệt.
