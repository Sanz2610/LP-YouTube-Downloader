# Validation record

The reproducible checks for this project are:

- `npm run build` — bundles the service worker and YouTube content script into `extension/`.
- `npm run check` — checks manifest scope/permissions, output references, worker bundling and forbidden platform/credential strings.
- `npm test` — format pairing, cookie filtering, native queue/disconnect/timeout behavior, strict IDs, sender boundary and error redaction.
- `npm run qa` — isolated Edge + Playwright fixture for one watch button, toolbar replacement recovery, one Shorts button, desktop screenshot and narrow screenshot.

The live helper download path still depends on YouTube availability, the user's own session and current yt-dlp support. The fixture QA deliberately does not contact YouTube or use a signed-in browser profile.
