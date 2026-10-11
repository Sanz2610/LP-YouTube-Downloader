# One-click installer payload

`setup.ps1` copies the helper and extension to `%LOCALAPPDATA%\LP YouTube Downloader` and registers the Native Messaging host. It does not open a browser by default because the helper runs in the background. Pass `-OpenBrowser` when you want it to open the Extensions page for the one-time Load unpacked step.

The installer can make the helper portable because `helper/runtime/node.exe` is bundled. The browser extension itself still follows Edge/Chrome installation rules: a local unpacked extension requires one user Load unpacked action unless the extension is published in a store or force-installed by an enterprise policy.

The root uninstaller removes the Native Messaging registration and schedules deletion of the installed AppData payload. It leaves downloaded videos untouched.
