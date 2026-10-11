import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {build} from 'esbuild';

const root=path.resolve(import.meta.dirname,'..');
const manifest=JSON.parse(await fs.readFile(path.join(root,'manifest.json'),'utf8'));
const pkg=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));
if(manifest.manifest_version!==3||manifest.name!=='LP YouTube Downloader'||manifest.version!==pkg.version)throw Error('Manifest identity/version mismatch');
if(typeof manifest.key!=='string')throw Error('Manifest key is required for a stable helper registration ID');
const keyDigest=crypto.createHash('sha256').update(Buffer.from(manifest.key,'base64')).digest().subarray(0,16);const extensionId=[...keyDigest].flatMap(byte=>[byte>>4,byte&15]).map(n=>String.fromCharCode(97+n)).join('');if(extensionId!=='hlokfmjpeehmmimkggeoppoliknkpacb')throw Error(`Unexpected extension ID: ${extensionId}`);
if(manifest.action?.default_popup!=='ui/popup.html')throw Error('The compact extension popup is missing');
if(manifest.permissions.some(p=>['tabs','activeTab','scripting','downloads','webRequest','declarativeNetRequest'].includes(p)))throw Error('Permission is broader than the YouTube-only MVP');
if(JSON.stringify(manifest).includes('<all_urls>'))throw Error('Wildcard host permission is forbidden');
const hosts=manifest.host_permissions||[];if(hosts.some(h=>!/^https:\/\/(?:www|m)\.youtube\.com\/\*$/.test(h)))throw Error('Unexpected host permission');
const matches=manifest.content_scripts.flatMap(s=>s.matches);if(matches.length!==2||matches.some(h=>!/^https:\/\/(?:www|m)\.youtube\.com\/\*$/.test(h)))throw Error('Unexpected content-script host');
const out=path.join(root,'extension');
for(const file of [manifest.background.service_worker,'content/youtube.js','ui/popup.html','ui/popup.css','ui/popup.js',...Object.values(manifest.icons)])await fs.access(path.join(out,file));
await build({entryPoints:[path.join(out,manifest.background.service_worker)],bundle:true,write:false,format:'esm',platform:'browser',target:'chrome116',logLevel:'silent'});
for(const file of [path.join(out,'background/service-worker.js'),path.join(out,'content/youtube.js')]){const source=await fs.readFile(file,'utf8');if(file.endsWith('.js'))new vm.Script(source,{filename:file});}
const source=await fs.readFile(path.join(out,'content/youtube.js'),'utf8');
for(const forbidden of ['facebook.com','instagram.com','tiktok.com','douyin','<all_urls>','signature=','cookie=','token='])if(source.toLowerCase().includes(forbidden))throw Error(`Forbidden runtime text: ${forbidden}`);
console.log('Manifest scope, permissions, references, worker bundle and runtime security checks: PASS');
