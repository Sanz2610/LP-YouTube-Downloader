# Validation record

The reproducible checks for this project are:

- `npm run build` — bundles the service worker and YouTube content script into `extension/`.
- `npm run check` — checks manifest scope/permissions, output references, worker bundling and forbidden platform/credential strings.
- `npm test` — format pairing, cookie filtering, native queue/disconnect/timeout behavior, strict IDs, sender boundary and error redaction.
- `npm run qa` — isolated Edge + Playwright fixture for one watch button, toolbar replacement recovery, one Shorts button, desktop screenshot and narrow screenshot.
- Download-flow fixture uses the real extension/router with a mocked native transport: completion hides Cancel, folder success/failure, retry, closed/reopened menu, reload with completed history, cancellation and narrow/desktop screenshots.
- Helper regression tests cover visible shell invocation, safe folder errors, repeat filenames and downloading after deleting an existing file.
- `node tools/native-folder-qa.mjs` — Windows-only manual QA sends 3 folder requests through the hidden native bridge, measures response time, verifies the fresh folder window with read-only Win32 enumeration and closes that test window. It never creates Shell.Application automation objects. Kept separate from unattended CI.

The live helper download path still depends on YouTube availability, the user's own session and current yt-dlp support. The fixture QA deliberately does not contact YouTube or use a signed-in browser profile.
