# LP YouTube Downloader

**Developed by Lapphan · Version 0.1.1**

Extension YouTube cho **Windows x64**, hỗ trợ **Microsoft Edge và Google Chrome**. Một nút download nhỏ ở góc phải video đang xem; bấm để chọn chất lượng, xem tiến trình hoặc hủy tải. Helper dùng yt-dlp và FFmpeg để tải và ghép hình/tiếng khi cần.

## Tải bản cài đầy đủ

[**Tải bản mới nhất tại GitHub Releases**](https://github.com/Sanz2610/LP-YouTube-Downloader/releases/latest)

Trong **Assets**, tải **`LP-YouTube-Downloader-0.1.1-offline.zip`**. Gói này chứa extension, helper, Node.js portable, yt-dlp và FFmpeg. Người dùng không cần cài npm hay các dependency riêng.

**Không dùng Code → Download ZIP hoặc Source code (zip) để cài.** Đó là source cho nhà phát triển, không chứa các runtime lớn.

## Cài đặt

1. Giải nén ZIP offline vào một folder riêng.
2. Bấm đúp **`Install-LP-YouTube-Downloader.cmd`**. Installer copy ứng dụng vào `%LOCALAPPDATA%\LP YouTube Downloader` và đăng ký helper cho tài khoản Windows hiện tại.
3. Mở **`edge://extensions`** hoặc **`chrome://extensions`**.
4. Bật **Developer mode**, chọn **Load unpacked**.
5. Dán đường dẫn **`%LOCALAPPDATA%\LP YouTube Downloader\extension`** vào hộp chọn folder. Nếu hộp chọn không mở rộng biến môi trường, nhập đường dẫn AppData mà installer đã in.
6. Mở hoặc refresh YouTube.

Browser yêu cầu Load unpacked một lần. Installer không tự chỉnh profile hoặc đóng trình duyệt. Sau khi installer copy xong, bản chạy nằm trong AppData; folder ZIP đã giải nén không cần giữ để extension tiếp tục chạy.

## Sử dụng

- Mở video Watch hoặc Shorts đang active. Thumbnail/recommendation không có nút tải.
- Bấm icon download ở góc phải player rồi chọn chất lượng.
- Trong lúc tải có phase, tiến trình và nút **Dừng**.
- Khi hoàn tất có **Mở thư mục**; video lưu trực tiếp vào **Downloads** của Windows. FFmpeg ghép các stream nếu cần.
- Bấm **Tải lại** hoặc đóng/mở lại nút download để chọn chất lượng mới. Video đã tải không khóa menu; lượt tải trùng tạo file `(2)`, `(3)`… và giữ file cũ.
- Bấm icon trên thanh extension để xem tác giả, version và mở GitHub.

Chỉ tải nội dung bạn có quyền tải. Bản đầu chưa hỗ trợ livestream/DRM. Khả năng tải phụ thuộc YouTube và yt-dlp; việc extension chạy được không đảm bảo mọi video đều tải được.

## Cập nhật và gỡ

**Cập nhật:** tải ZIP offline mới từ Releases, giải nén và chạy installer. Trong trang Extensions bấm **Reload**, rồi refresh YouTube. Giữ cùng extension ID `hlokfmjpeehmmimkggeoppoliknkpacb`.

**Gỡ:** chạy **`Uninstall-LP-YouTube-Downloader.cmd`**, sau đó Remove extension trong Edge/Chrome. Uninstaller gỡ host registry và lên lịch dọn `%LOCALAPPDATA%\LP YouTube Downloader`. Video trong Downloads được giữ. Nếu Windows còn giữ file do helper đang chạy, đóng thao tác tải/extension rồi chạy lại uninstaller.

## Xử lý lỗi

| Thông báo | Cách xử lý |
| --- | --- |
| Edge chưa nhận công cụ YouTube | Chạy lại installer từ ZIP offline, Reload extension rồi refresh YouTube. |
| ID extension không được cho phép | Dùng đúng folder AppData đã cài. Nếu bạn tự thay `manifest.key`, cần đăng ký lại helper với đúng ID. |
| Thiếu Node/FFmpeg/helper | Bạn có thể đã tải source ZIP hoặc extension-only ZIP. Tải ZIP offline đầy đủ. |
| Video không khả dụng/chất lượng thay đổi | Mở lại danh sách chất lượng; kiểm tra video có private/live/DRM không. |
| File AppData chưa xóa hết khi gỡ | Dừng lượt tải và Remove extension, sau đó chạy uninstaller lại. |

Installer chưa có chữ ký Authenticode. Có thể kiểm tra checksum file tải về bằng `SHA256SUMS.txt` trong cùng Release.

## Phát triển từ source

Node.js 24.15.0 hoặc mới hơn; Windows x64. Git không lưu runtime binary, private key, config theo máy, cookie, browser profile hoặc evidence QA.

```powershell
git clone https://github.com/Sanz2610/LP-YouTube-Downloader.git
cd LP-YouTube-Downloader
npm ci
npm run setup:helper
npm run build
npm run check
npm test
npm run qa
npm run package
npm run package:offline
```

`setup:helper` tải runtime khóa checksum từ release phụ, kiểm tra các file rồi compile bridge C#; không cài ứng dụng vào AppData và không sửa registry. `qa` chạy fixture cục bộ bằng Edge và Playwright với profile riêng, không dùng profile đăng nhập của người dùng.

`extension/` là build output. `dist/` chứa ZIP. `assets/icon.svg` và các PNG manifest được tạo từ cùng asset download chính thức của Lucide; chạy `node tools/render-icons.mjs` để render lại bằng Edge.

## Tài liệu

- [Dữ liệu và quyền truy cập](PRIVACY.md)
- [Third-party licenses và nguồn](THIRD_PARTY.md)
- [Source inventory](SOURCE-INVENTORY.md)
- [Kiến trúc](PROJECT_OVERVIEW.md)
- [Kiểm chứng](VALIDATION.md)
- [Release workflow](GITHUB-DISTRIBUTION.md)

Project này độc lập với Media Sweep. Không build từ, copy ngược vào hoặc sửa Media Sweep.
