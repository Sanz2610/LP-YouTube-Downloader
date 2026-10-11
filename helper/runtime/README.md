# Bundled Node.js runtime

The installer uses `node.exe` from this folder when present, so end users do not need to install Node.js. The binary is used only to run the project-owned `youtube-host.mjs` native host and its built-in Node modules. The exact Node version and SHA-256 are recorded in `helper/SOURCES.json`; update the provenance record and license notices when replacing it.
