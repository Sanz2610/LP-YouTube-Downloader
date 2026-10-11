import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import assert from 'node:assert/strict';
const execute=promisify(execFile),root=path.resolve(import.meta.dirname,'..');
const stage=path.join(root,'work/native-folder-qa'),helper=path.join(stage,'helper');
await fs.mkdir(helper,{recursive:true});
const folder=await fs.mkdtemp(path.join(stage,"Downloads space's "));
for(const item of await fs.readdir(path.join(root,'helper'),{withFileTypes:true})){
  if(item.isFile()&&(item.name.endsWith('.mjs')||['native-bridge.exe','folder-opener.exe'].includes(item.name)))await fs.copyFile(path.join(root,'helper',item.name),path.join(helper,item.name));
}
const probe=path.join(stage,'explorer-probe.exe'),compiler=path.join(process.env.WINDIR,'Microsoft.NET/Framework64/v4.0.30319/csc.exe');
await execute(compiler,['/nologo','/target:exe',`/out:${probe}`,'/reference:System.Web.Extensions.dll',path.join(root,'tools/ExplorerProbe.cs')]);
const origin='chrome-extension://hlokfmjpeehmmimkggeoppoliknkpacb/';
await fs.writeFile(path.join(helper,'config.json'),JSON.stringify({node:process.execPath,downloadsDir:folder,allowedOrigins:[origin]}));
const child=spawn(path.join(helper,'native-bridge.exe'),[origin],{windowsHide:true,stdio:['pipe','pipe','ignore']});
let buffer=Buffer.alloc(0);
try{
  const start=performance.now();
  const results=await new Promise((resolve,reject)=>{
    const replies=[];
    const timer=setTimeout(()=>reject(Error('Native folder response timeout.')),5000);
    child.once('error',error=>{clearTimeout(timer);reject(error);});
    child.stdout.on('data',bytes=>{buffer=Buffer.concat([buffer,bytes]);while(buffer.length>=4&&buffer.length>=buffer.readUInt32LE(0)+4){const size=buffer.readUInt32LE(0);replies.push(JSON.parse(buffer.subarray(4,4+size).toString('utf8')));buffer=buffer.subarray(4+size);if(replies.length===3){clearTimeout(timer);resolve(replies);}}});
    for(let index=0;index<3;index++){const payload=Buffer.from(JSON.stringify({id:`folder-qa-${index}`,operation:'open-folder',path:'C:\\must-not-open-this'})),frame=Buffer.alloc(payload.length+4);frame.writeUInt32LE(payload.length);payload.copy(frame,4);child.stdin.write(frame);}
  });
  const elapsed=Math.round(performance.now()-start);assert.ok(results.every(result=>result.ok));assert.ok(elapsed<3000,`Folder response took ${elapsed}ms`);
  let visible=false;
  for(let attempt=0;attempt<10;attempt++){
    // EnumWindows is read-only and does not start Shell.Application/Explorer automation processes.
    const {stdout}=await execute(probe,[path.basename(folder)],{windowsHide:true});
    if(JSON.parse(stdout).matchedVisible){visible=true;break;}
    await new Promise(resolve=>setTimeout(resolve,300));
  }
  assert.equal(visible,true,'The newly requested folder must be visibly open in Explorer.');
  await execute(probe,[path.basename(folder),'--close-test'],{windowsHide:true});
  console.log(`Native folder QA PASS: 3 simultaneous requests, visible new folder, ${elapsed}ms response, no PowerShell/COM automation; test window closed.`);
}finally{child.stdin.end();}
