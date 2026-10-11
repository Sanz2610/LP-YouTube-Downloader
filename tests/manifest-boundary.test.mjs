import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
test('manifest has a YouTube-only host boundary',async()=>{
  const manifest=JSON.parse(await fs.readFile(path.join(import.meta.dirname,'..','manifest.json'),'utf8'));
  assert.deepEqual(manifest.host_permissions,['https://www.youtube.com/*','https://m.youtube.com/*']);
  assert.deepEqual(manifest.content_scripts[0].matches,['https://www.youtube.com/*','https://m.youtube.com/*']);
  assert.equal(manifest.action.default_popup,'ui/popup.html');assert.equal(manifest.permissions.includes('nativeMessaging'),true);
});
