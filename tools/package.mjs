import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile);const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(await fs.readFile(path.join(root,'manifest.json'),'utf8'));await fs.mkdir(path.join(root,'dist'),{recursive:true});
await run(process.execPath,[path.join(root,'tools/check.mjs')]);
const zip=path.join(root,'dist',`LP-YouTube-Downloader-${manifest.version}-extension.zip`);await fs.rm(zip,{force:true});
if(process.platform==='win32'){
 const quote=value=>`'${value.replaceAll("'","''")}'`;const source=path.join(root,'extension');const command=`$src=${quote(source)};$dst=${quote(zip)};Compress-Archive -Path (Join-Path $src '*') -DestinationPath $dst -CompressionLevel Optimal -Force`;await run('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-Command',command]);
}else await run('tar',['-a','-c','-f',zip,'-C',path.join(root,'extension'),'.']);
console.log(`Created ${zip}`);
