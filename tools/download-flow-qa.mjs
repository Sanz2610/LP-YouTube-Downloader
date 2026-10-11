import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const root=path.resolve(import.meta.dirname,'..'),output=path.join(root,'evidence/download-flow');
await fs.mkdir(output,{recursive:true});
const fixture=await fs.readFile(path.join(root,'fixtures/youtube-shaped.html'),'utf8');
const context=await chromium.launchPersistentContext(path.join(output,'profile'),{channel:'msedge',headless:true,args:[`--disable-extensions-except=${path.join(root,'extension')}`,`--load-extension=${path.join(root,'extension')}`]});
try{
  const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker');
  await worker.evaluate(()=>{
    // Replace only the native transport. The real service-worker router, jobs and content script run.
    globalThis.qaRequests=[];globalThis.qaHoldDownload=false;globalThis.qaFolderFailure=false;
    chrome.runtime.connectNative=()=>{
      const messages=[],disconnects=[],operations=new Map();
      const emit=value=>messages.forEach(listener=>listener(value));
      return {onMessage:{addListener:listener=>messages.push(listener)},onDisconnect:{addListener:listener=>disconnects.push(listener)},disconnect(){disconnects.forEach(listener=>listener());},postMessage(message){
        qaRequests.push({operation:message.operation,id:message.id,videoId:message.videoId});
        if(message.operation==='info')setTimeout(()=>emit({id:message.id,ok:true,info:{videoId:message.videoId,title:'Fixture video',choices:[{id:'137+140',label:'1080p',container:'mp4',estimatedBytes:1024*1024}]}}),60);
        if(message.operation==='download'){
          const operation={cancelled:false};operations.set(message.id,operation);
          setTimeout(()=>emit({event:'progress',id:message.id,state:'downloading',percent:45}),100);
          if(!qaHoldDownload)setTimeout(()=>{if(!operation.cancelled)emit({id:message.id,ok:true,result:{videoId:message.videoId,filename:'fixture.mp4',downloadsFolder:'Downloads',state:'complete',percent:100}});},350);
        }
        if(message.operation==='cancel'){const target=operations.get(message.target);if(target){target.cancelled=true;emit({id:message.target,ok:false,cancelled:true});}setTimeout(()=>emit({id:message.id,ok:true}),0);}
        if(message.operation==='open-folder')setTimeout(()=>emit(qaFolderFailure?{id:message.id,ok:false,error:'Không mở được thư mục tải. Kiểm tra thư mục Downloads rồi thử lại.'}:{id:message.id,ok:true}),20);
      }};
    };
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://www.youtube.com/**',route=>route.fulfill({contentType:'text/html',body:fixture}));
  await page.goto('https://www.youtube.com/watch?v=jNQXAC9IVRw');
  const trigger=page.locator('[data-md-youtube="watch"] .trigger'),dialog=page.locator('[data-md-youtube="popup"]');
  const quality=dialog.locator('.choice'),folder=dialog.locator('.folder-btn'),retry=dialog.locator('.retry-btn'),cancel=dialog.locator('.cancel');
  await trigger.waitFor();assert.equal(await trigger.innerText(),'');
  await trigger.click();await quality.waitFor();await quality.click();
  await cancel.waitFor();await folder.waitFor();
  assert.equal(await cancel.isVisible(),false);assert.equal(await retry.isVisible(),true);
  assert.match(await dialog.locator('.status').innerText(),/Đã lưu vào Downloads/);
  await page.screenshot({path:path.join(output,'complete-desktop.png'),fullPage:true});
  await page.evaluate(()=>document.documentElement.setAttribute('dark',''));
  await page.waitForFunction(()=>document.querySelector('[data-md-youtube="popup"]').hasAttribute('data-dark'));
  await page.screenshot({path:path.join(output,'complete-dark.png'),fullPage:true});
  // Save the rendered dialog for the shared static visual audit (fixture data only).
  const snapshot=await dialog.evaluate(host=>{
    const style=host.shadowRoot.querySelector('style').textContent.replaceAll(':host([data-dark])','.qa-host[data-dark]').replaceAll(':host','.qa-host').replaceAll('.popup:popover-open','.popup');
    const content=host.shadowRoot.querySelector('.popup').outerHTML.replace('popover="auto"','').replace('class="popup"','class="popup" style="position:static;margin:8px"');
    return `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#0f0f0f}.qa-host{display:block;padding:8px}${style}.qa-host{color:var(--text)}</style><div class="qa-host" data-dark>${content}</div>`;
  });await fs.writeFile(path.join(output,'complete-audit.html'),snapshot);
  await folder.click();await page.waitForFunction(()=>document.querySelector('[data-md-youtube="popup"]').shadowRoot.querySelector('.status').textContent.includes('Đã lưu'));
  assert.equal(await worker.evaluate(()=>qaRequests.filter(request=>request.operation==='open-folder').length),1);
  await worker.evaluate(()=>{qaFolderFailure=true;});await folder.click();
  await page.waitForFunction(()=>document.querySelector('[data-md-youtube="popup"]').shadowRoot.querySelector('.status').textContent.includes('Không mở được'));
  await worker.evaluate(()=>{qaFolderFailure=false;});
  await retry.click();await quality.waitFor();assert.equal(await folder.isVisible(),false);
  await quality.click();await folder.waitFor();
  // Close/reopen and page reload both restore the quality menu despite completed job history.
  await dialog.locator('.close').click();await trigger.click();await quality.waitFor();
  await page.reload();await trigger.waitFor();await trigger.click();await quality.waitFor();
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(output,'quality-narrow.png'),fullPage:true});
  await quality.click();await folder.waitFor();
  await page.screenshot({path:path.join(output,'complete-narrow.png'),fullPage:true});
  await retry.click();await quality.waitFor();
  await worker.evaluate(()=>{qaHoldDownload=true;});await quality.click();await cancel.waitFor();await cancel.click();
  await page.waitForFunction(()=>document.querySelector('[data-md-youtube="popup"]').shadowRoot.querySelector('.status').textContent.includes('Đã dừng tải'));
  assert.equal(await folder.isVisible(),false);assert.equal(await cancel.isVisible(),false);
  await dialog.locator('.close').click();await trigger.click();await quality.waitFor();
  assert.equal(await worker.evaluate(()=>qaRequests.filter(request=>request.operation==='download').length),4);
  assert.deepEqual(errors,[]);
  const visual=await dialog.evaluate(host=>{
    const popup=host.shadowRoot.querySelector('.popup'),bounds=popup.getBoundingClientRect();
    return {overflow:bounds.left<0||bounds.right>innerWidth||bounds.top<0||bounds.bottom>innerHeight,smallText:[...host.shadowRoot.querySelectorAll('button,.status,.quality,.details')].filter(node=>node.getClientRects().length&&parseFloat(getComputedStyle(node).fontSize)<12).length};
  });assert.equal(visual.overflow,false);assert.equal(visual.smallText,0);
  await fs.writeFile(path.join(output,'result.json'),JSON.stringify({completeHidesCancel:true,retryInDialog:true,reopenRestoresQualities:true,reloadRestoresQualities:true,folderRequest:true,folderFailureVisible:true,cancel:true,iconOnly:true,visual},null,2));
  console.log('Edge download-flow PASS: complete, folder, retry, reopen, reload, cancel and narrow layout.');
}finally{await context.close();}
