# GitHub Releases

Repository: https://github.com/Sanz2610/LP-YouTube-Downloader

Source Git chứa code, tests, installer, icon và license notices. Runtime Windows lớn nằm trong release phụ `runtime-2026-10-11`; `helper/runtime.lock.json` khóa URL, checksum archive và checksum từng binary. Private key và config theo máy không được đưa lên repository hay ZIP.

Release dành cho người dùng chứa:

- `LP-YouTube-Downloader-VERSION-offline.zip`: bộ cài đầy đủ.
- `LP-YouTube-Downloader-VERSION-extension.zip`: chỉ extension, cần helper đã cài.
- `SHA256SUMS.txt`: checksum ZIP.

Source code ZIP mặc định của GitHub không phải bộ cài. README hướng người dùng tới Releases.

`.github/workflows/check.yml` chạy build/check/tests/fixture Edge mỗi lần push main hoặc có pull request. `.github/workflows/release.yml` chạy khi push tag `vVERSION`, kiểm tra tag khớp package/manifest, tải runtime với checksum, compile bridge, chạy kiểm tra rồi tạo và đính kèm các ZIP vào Release. Mỗi lệnh thất bại sẽ dừng bước phát hành.

Để phát hành bản tiếp theo:

1. Sửa version đồng bộ trong `manifest.json` và `package.json`; cập nhật lockfile/changelog.
2. Chạy build/check/tests và QA phù hợp.
3. Commit, push main rồi push tag `vVERSION`.
4. Kiểm tra Actions và ZIP ở Releases trước khi thông báo cho người dùng.

Các tag cũ giữ nguyên. Runtime dependencies được cập nhật riêng với một release phụ và checksum mới. Quyền workflow `contents: write` chỉ dùng cho tạo/upload Release; workflow kiểm tra source chỉ có quyền đọc.
