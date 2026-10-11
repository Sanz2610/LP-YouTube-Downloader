import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {openDownloadFolder} from '../helper/windows-shell.mjs';
import {outputTemplate} from '../helper/output-template.mjs';

test('folder opening uses the compiled launcher directly with no PowerShell or path argument',async()=>{
  let call;
  await openDownloadFolder("C:\\Users\\Fixture\\My Downloads's",{opener:'C:\\App\\folder-opener.exe',stat:async()=>({isDirectory:()=>true}),execute:async(...args)=>{call=args;}});
  assert.equal(call[0],'C:\\App\\folder-opener.exe');assert.deepEqual(call[1],[]);
  assert.equal(call[2].windowsHide,false);assert.equal(call[2].timeout,2500);
});
test('missing folders or invalid paths cannot launch Explorer',async()=>{
  for(const value of ['relative','https://example.test/video','C:\\Missing']){
    await assert.rejects(openDownloadFolder(value,{stat:async()=>{throw Error('private file path');},execute:async()=>assert.fail('must not launch')}),/Không mở được thư mục tải/);
  }
});
test('shell failures return a safe error instead of a false successful acknowledgement',async()=>{
  const failure=await openDownloadFolder('C:\\Downloads',{stat:async()=>({isDirectory:()=>true}),execute:async()=>{throw Error('https://fixture.test/?token=secret');}}).catch(error=>error.message);
  assert.match(failure,/Không mở được thư mục tải/);assert.ok(!failure.includes('secret'));assert.ok(!failure.includes('https://'));
});
test('redownloading preserves existing files and downloading after deletion is allowed',async()=>{
  const root=path.resolve(import.meta.dirname,'../work/test-downloads');await fs.mkdir(root,{recursive:true});
  const folder=await fs.mkdtemp(path.join(root,'retry-'));
  const id='jNQXAC9IVRw',choice={label:'1080p',container:'mp4'};
  try{
    assert.equal(await outputTemplate(folder,id,choice),'%(title).150B [%(id)s] 1080p.%(ext)s');
    const original=path.join(folder,`Fixture [${id}] 1080p.mp4`);
    await fs.writeFile(original,'original video');
    assert.equal(await outputTemplate(folder,id,choice),'%(title).150B [%(id)s] 1080p (2).%(ext)s');
    await fs.writeFile(path.join(folder,`Fixture [${id}] 1080p (2).mp4`),'second video');
    assert.equal(await outputTemplate(folder,id,choice),'%(title).150B [%(id)s] 1080p (3).%(ext)s');
    assert.equal(await fs.readFile(original,'utf8'),'original video');
    await fs.unlink(original);
    assert.equal(await outputTemplate(folder,id,choice),'%(title).150B [%(id)s] 1080p.%(ext)s');
  }finally{await fs.rm(folder,{recursive:true,force:true});}
});
