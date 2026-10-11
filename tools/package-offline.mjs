import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import crypto from 'node:crypto';
const run=promisify(execFile);const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(await fs.readFile(path.join(root,'manifest.json'),'utf8'));const dist=path.join(root,'dist');const stage=path.join(dist,'offline-stage');
await run(process.execPath,[path.join(root,'tools/check.mjs')]);
const lock=JSON.parse(await fs.readFile(path.join(root,'helper/runtime.lock.json'),'utf8'));
for(const [file,expected] of Object.entries(lock.files)){const bytes=await fs.readFile(path.join(root,'helper',file));if(crypto.createHash('sha256').update(bytes).digest('hex')!==expected)throw Error(`Runtime integrity check failed: ${file}`);}
await fs.access(path.join(root,'helper/native-bridge.exe'));
await fs.rm(stage,{recursive:true,force:true});await fs.mkdir(stage,{recursive:true});await fs.mkdir(dist,{recursive:true});
for(const name of ['helper','extension','installer','manifest.json','README.md','THIRD_PARTY.md','PRIVACY.md','Install-LP-YouTube-Downloader.cmd','Uninstall-LP-YouTube-Downloader.cmd']){const source=path.join(root,name);if(await fs.stat(source).catch(()=>null))await fs.cp(source,path.join(stage,name),{recursive:true,filter:file=>{const relative=path.relative(path.join(root,'helper'),file).replaceAll('\\','/');return !['config.json','native-host.json','temp','tools/ffmpeg/ffplay.exe'].includes(relative)&&!relative.startsWith('temp/');}});}
const output=path.join(dist,`LP-YouTube-Downloader-${manifest.version}-offline.zip`);await fs.rm(output,{force:true});
if(process.platform==='win32'){
  const quote=value=>`'${value.replaceAll("'","''")}'`;
  const command=`$src=${quote(stage)};$dst=${quote(output)};Compress-Archive -Path (Join-Path $src '*') -DestinationPath $dst -CompressionLevel Optimal -Force`;
  await run('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-Command',command]);
}else await run('tar',['-a','-c','-f',output,'-C',stage,'.']);
await fs.rm(stage,{recursive:true,force:true});console.log(`Created ${output}`);
