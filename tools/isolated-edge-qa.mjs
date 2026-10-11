import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const extension=path.join(root,'extension');
const evidence=path.join(root,'evidence','isolated-edge');
await fs.rm(evidence,{recursive:true,force:true});await fs.mkdir(evidence,{recursive:true});
const edge=process.env.EDGE_PATH||'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const fixture=await fs.readFile(path.join(root,'fixtures/youtube-shaped.html'),'utf8');
const shortsFixture=fixture.replace(/<ytd-watch-metadata>[\s\S]*?<\/ytd-watch-metadata>/,'<ytd-reel-video-renderer is-active><div id="actions"><button class="native">Like</button><button class="native">Share</button></div></ytd-reel-video-renderer>');
const context=await chromium.launchPersistentContext(path.join(evidence,'profile'),{headless:true,executablePath:edge,args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`]});
try{
  const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker');
  // Keep this fixture offline even when a real native helper is registered on the machine.
  await worker.evaluate(()=>{chrome.runtime.connectNative=()=>{throw Error('Kết nối công cụ YouTube bị ngắt. Thử tải lại.');};});
  const page=await context.newPage();
  await page.route('https://www.youtube.com/**',route=>route.fulfill({status:200,contentType:'text/html',body:new URL(route.request().url()).pathname.startsWith('/shorts/')?shortsFixture:fixture}));
  await page.goto('https://www.youtube.com/watch?v=jNQXAC9IVRw');
  await page.waitForTimeout(800);
  const selector='[data-md-youtube]:not([data-md-youtube="popup"])';
  const first=await page.locator(selector).count();
  if(first!==1)throw Error(`expected one watch control, got ${first}`);
  await page.evaluate(()=>{const toolbar=document.querySelector('#top-level-buttons-computed');toolbar.innerHTML='<button class="native">Like</button><button class="native">Share</button>';document.dispatchEvent(new Event('yt-navigate-finish'));});
  await page.waitForTimeout(400);
  const rerendered=await page.locator(selector).count();if(rerendered!==1)throw Error(`toolbar recovery failed: ${rerendered}`);
  await page.screenshot({path:path.join(evidence,'desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(evidence,'narrow.png'),fullPage:true});
  await page.locator(`${selector} button`).click({force:true});
  await page.waitForTimeout(80);await page.screenshot({path:path.join(evidence,'error.png'),fullPage:true});
  const popupText=await page.locator('[data-md-youtube="popup"]').evaluate(node=>node.shadowRoot?.textContent||'');
  if(/https?:\/\/|signature=|token=|cookie=/i.test(popupText))throw Error('error UI leaked credential-shaped data');
  await page.goto('https://www.youtube.com/shorts/jNQXAC9IVRw');await page.waitForTimeout(300);
  const shorts=await page.locator(selector).count();if(shorts!==1)throw Error(`expected one Shorts control, got ${shorts}`);
  await fs.writeFile(path.join(evidence,'result.json'),JSON.stringify({watchControl:first,rerendered,shorts,narrow:true},null,2));
  console.log(`Isolated Edge fixture PASS: ${evidence}`);
}finally{await context.close();}
