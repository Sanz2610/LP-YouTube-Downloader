# Third-party notices

Project-owned extension/helper code is kept separately from the third-party programs below. These programs are invoked as separate processes; they retain their own licenses. No license for the project's own source has been selected yet.

| Component | Version/source | License and notices |
| --- | --- | --- |
| Node.js | 24.15.0, unmodified official Windows x64 `node.exe` | Node.js MIT plus bundled dependency notices: `helper/licenses/NODE-LICENSE.txt`. Hash matches the upstream SHASUMS256 entry. |
| yt-dlp Windows executable | 2026.08.19, official `yt-dlp.exe` | Source is Unlicense, but the bundled executable is GPLv3+ because it includes dependencies. See `YT-DLP-UNLICENSE.txt`, `YT-DLP-THIRD-PARTY.txt`, `GPL-3.0.txt` in `helper/licenses/`. |
| FFmpeg/FFprobe shared build | BtbN `n8.1.3-14-g330caae0c1-20261004`, LGPL shared build | LGPLv3 and bundled library terms; `helper/tools/ffmpeg/LICENSE.txt`, `helper/licenses/LGPL-3.0.txt`, `helper/licenses/GPL-3.0.txt`. Executables/shared libraries are unmodified. |
| Lucide icons | Official download glyph plus the content UI's download/loader/close/folder glyphs | ISC/MIT notices in `helper/licenses/LUCIDE-LICENSE.txt`. PNG brand variants use the same SVG download source on a red circle. |
| esbuild, Playwright | Exact versions in `package-lock.json` | Build/test dependencies only; their packages include their own notices. Not bundled into the user's native runtime. |

Upstream source and build instructions:

- Node.js: https://github.com/nodejs/node/tree/v24.15.0
- yt-dlp: https://github.com/yt-dlp/yt-dlp/tree/2026.08.19 ; bundled dependency notices link to their sources.
- FFmpeg: https://github.com/FFmpeg/FFmpeg/tree/330caae0c1 ; LGPL build scripts and component sources: https://github.com/BtbN/FFmpeg-Builds
- Lucide: https://github.com/lucide-icons/lucide

`helper/SOURCES.json` records the selected artifacts and `helper/runtime.lock.json` pins every packaged runtime binary. The native bridge is compiled from the included project C# source; no precompiled bridge is committed to Git.

Do not relabel third-party binaries as wholly authored by this project or remove their license notices when redistributing.
