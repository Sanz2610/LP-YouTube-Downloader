# LP YouTube Downloader

Manifest V3 YouTube-only extension plus a Windows x64 Native Messaging helper. Default UI language: Vietnamese. Product version is read from the manifest for the toolbar popup.

```text
src/content/youtube.js       one control attached to the active Watch/Shorts player
src/background/             sender validation, native requests, queue and bounded job history
src/shared/                 IDs, error redaction, state and language
src/ui/popup.*              Lapphan credit, current version, GitHub link
helper/*.mjs                native framing, yt-dlp, FFmpeg and temporary workspace cleanup
helper/NativeBridge.cs      source for the Windows stdio bridge
installer/                 install/update/remove current-user AppData payload and registration
tools/                     build/check/package, runtime restoration and isolated Edge QA
```

The download control is an absolute child of the active player, not a toolbar flex item. It follows the player during scrolling, uses an icon only and leaves native action layout intact. YouTube navigation/mutations trigger re-detection and recovery.

Downloads run sequentially, with up to five waiting jobs and thirty completed/error history entries. A service-worker restart marks interrupted jobs as failed. Info lookups use strict IDs and temporary YouTube-only cookie files; signed media URLs are not sent into UI errors.

`installer/setup.ps1` copies the full offline payload to AppData, then registers `com.lp.youtube_downloader` with exact origins. Installer logs are ASCII to support Windows PowerShell and CMD. It does not open a browser by default. Users perform Load unpacked once.

Large third-party runtime binaries stay out of Git. `npm run setup:helper` restores a hash-pinned runtime release and compiles the bridge. `npm run build` only needs npm development dependencies. `npm run package:offline` requires verified runtime binaries and a valid extension build.

Private keys, credentials, personal browser data and generated native-host configuration are excluded from source and release packages. Media Sweep is outside the project boundary and remains read-only.
