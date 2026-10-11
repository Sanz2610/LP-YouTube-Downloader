import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile),root=path.resolve(import.meta.dirname,'..');
if(process.platform!=='win32')throw Error('The bundled native helper targets Windows x64.');
const lock=JSON.parse(await fs.readFile(path.join(root,'helper/runtime.lock.json'),'utf8'));
async function validFiles(){for(const [file,expected] of Object.entries(lock.files)){try{const actual=crypto.createHash('sha256').update(await fs.readFile(path.join(root,'helper',file))).digest('hex');if(actual!==expected)return false;}catch{return false;}}return true;}
if(!await validFiles()){
  const response=await fetch(lock.url,{signal:AbortSignal.timeout(180000)});
  if(!response.ok)throw Error(`Helper runtime download failed (HTTP ${response.status}).`);
  const bytes=Buffer.from(await response.arrayBuffer());
  if(crypto.createHash('sha256').update(bytes).digest('hex')!==lock.sha256)throw Error('Helper runtime checksum mismatch; no runtime files were installed.');
  const work=path.join(root,'work/helper-setup');await fs.mkdir(work,{recursive:true});
  const zip=path.join(work,'runtime.zip');await fs.writeFile(zip,bytes);
  const quote=value=>`'${value.replaceAll("'","''")}'`;
  await run('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-Command',`Expand-Archive -LiteralPath ${quote(zip)} -DestinationPath ${quote(path.join(root,'helper'))} -Force`]);
  if(!await validFiles())throw Error('Extracted helper runtime verification failed.');
}
await run('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(root,'tools/compile-bridge.ps1')]);
console.log('Helper runtime hashes verified; native bridge compiled.');
