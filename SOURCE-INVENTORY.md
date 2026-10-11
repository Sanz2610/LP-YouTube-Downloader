# Source inventory

## Adapted from retired backup

- `src/content/youtube.js`: active YouTube toolbar/Shorts control, shadow UI and SPA observer logic.
- `src/background/youtube.js`: native port, queue and job-state logic, with the host name changed to `com.lp.youtube_downloader`.
- `helper/formats.mjs`: YouTube format pairing, cookie-domain filter and sanitized helper errors.
- `helper/flow.mjs`: framed progress emission and the yt-dlp info template.
- `helper/youtube-host.mjs`: Native Messaging host, yt-dlp/FFmpeg orchestration and owned-temp cleanup.
- `helper/NativeBridge.cs` and `helper/native-bridge.exe`: Windows stdio bridge.
  The release bridge is now compiled from the included source, not committed as a binary.
- `helper/tools/yt-dlp.exe` and `helper/tools/ffmpeg/*`: required helper runtimes; provenance and hashes are in `helper/SOURCES.json`.
- `helper/runtime/node.exe`: bundled Node.js runtime so end users do not install Node separately; provenance and hash are in `helper/SOURCES.json`.

## Written for this project

`manifest.json`, `package.json`, `src/background/service-worker.js`, `src/shared/*`, `src/ui/popup.*`, `tools/*`, `tests/*`, `fixtures/*`, `installer/*`, `README.md`, `PROJECT_OVERVIEW.md`, `THIRD_PARTY.md`, `SOURCE-INVENTORY.md` and the LP icon are new files. No file is copied back into Media Sweep.

The manifest contains a newly generated public key for a stable extension ID. The matching private key is kept locally under `private/` (ignored and excluded from packages); it must be backed up securely before publishing to a browser store.

`assets/icons/lucide/download.svg` is the official Lucide download glyph. `tools/render-icons.mjs` applies a red background and renders the same glyph for popup SVG and manifest PNGs; it does not draw an independent arrow. `helper/licenses/` contains upstream notices. The Windows binary dependencies are excluded from Git and restored from the pinned runtime release in `helper/runtime.lock.json`.

`tests/youtube.test.mjs` was also selectively adapted from the retired backup. Other tests, GitHub workflows and release tooling are project additions.
