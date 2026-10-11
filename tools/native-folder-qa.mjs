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
  if(item.isFile()&&(item.name.endsWith('.mjs')||item.name==='native-bridge.exe'))await fs.copyFile(path.join(root,'helper',item.name),path.join(helper,item.name));
}
const origin='chrome-extension://hlokfmjpeehmmimkggeoppoliknkpacb/';
await fs.writeFile(path.join(helper,'config.json'),JSON.stringify({node:process.execPath,downloadsDir:folder,allowedOrigins:[origin]}));
const child=spawn(path.join(helper,'native-bridge.exe'),[origin],{windowsHide:true,stdio:['pipe','pipe','ignore']});
let buffer=Buffer.alloc(0);
try{
  const result=await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error('Native folder response timeout.')),15000);
    child.once('error',error=>{clearTimeout(timer);reject(error);});
    child.stdout.on('data',bytes=>{buffer=Buffer.concat([buffer,bytes]);if(buffer.length>=4&&buffer.length>=buffer.readUInt32LE(0)+4){clearTimeout(timer);resolve(JSON.parse(buffer.subarray(4,4+buffer.readUInt32LE(0)).toString('utf8')));}});
    const payload=Buffer.from(JSON.stringify({id:'folder-qa',operation:'open-folder',path:'C:\\must-not-open-this'})),frame=Buffer.alloc(payload.length+4);frame.writeUInt32LE(payload.length);payload.copy(frame,4);child.stdin.write(frame);
  });
  assert.equal(result.ok,true);
  // Read-only enumeration proves the configured folder is visible, not merely that a process spawned.
  const literal=folder.replaceAll("'","''");
  const script=`Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class LPWindow{[DllImport("user32.dll")]public static extern bool IsWindowVisible(IntPtr handle);}';$match=$false;foreach($window in (New-Object -ComObject Shell.Application).Windows()){try{if($window.Document.Folder.Self.Path -eq '${literal}' -and [LPWindow]::IsWindowVisible([IntPtr]$window.HWND)){$match=$true}}catch{}};Write-Output $match`;
  let visible=false;
  for(let attempt=0;attempt<8;attempt++){
    const {stdout}=await execute('powershell.exe',['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{windowsHide:true});
    if(stdout.trim()==='True'){visible=true;break;}
    await new Promise(resolve=>setTimeout(resolve,400));
  }
  assert.equal(visible,true,'The configured folder must be visibly open in Explorer.');
  console.log('Native folder QA PASS: hidden bridge -> visible Explorer; spaces/apostrophe path; message path ignored.');
}finally{child.stdin.end();}
