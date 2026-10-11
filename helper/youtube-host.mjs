import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {VIDEO_ID,youtubeChoices,cookieText,safeError} from './formats.mjs';
import {INFO_TEMPLATE,progressEmitter} from './flow.mjs';
import {openDownloadFolder} from './windows-shell.mjs';
import {outputTemplate} from './output-template.mjs';
const root=import.meta.dirname,config=JSON.parse((await fs.readFile(path.join(root,'config.json'),'utf8')).replace(/^\uFEFF/,''));
if(!config.allowedOrigins.includes(process.argv[2]))process.exit(1);
const tempRoot=path.join(root,'temp'),children=new Set(),operations=new Map(),cache=new Map();let input=Buffer.alloc(0),closing=false,downloadActive=false;
await fs.mkdir(tempRoot,{recursive:true});
function write(message){if(closing)return;const payload=Buffer.from(JSON.stringify(message));if(payload.length>1000000)return;const header=Buffer.alloc(4);header.writeUInt32LE(payload.length);process.stdout.write(header);process.stdout.write(payload);}
const key=(id,cookies)=>id+':'+crypto.createHash('sha256').update(JSON.stringify(cookies||[])).digest('hex');
async function workspace(cookies){const dir=path.join(tempRoot,crypto.randomUUID());await fs.mkdir(dir);await fs.writeFile(path.join(dir,'.owned-by-media-downloader'),JSON.stringify({owner:'youtube-temp-v1',pid:process.pid}));const text=cookieText(cookies);if(text)await fs.writeFile(path.join(dir,'cookies.txt'),text,{mode:0o600});return {dir,cookies:text?path.join(dir,'cookies.txt'):null};}
async function marker(dir){try{return JSON.parse(await fs.readFile(path.join(dir,'.owned-by-media-downloader'),'utf8'));}catch{return null;}}
async function cleanup(dir){const relative=path.relative(tempRoot,path.resolve(dir));if(!/^[a-f0-9-]{36}$/.test(relative)||path.dirname(path.resolve(dir))!==tempRoot)return;if((await marker(dir))?.owner!=='youtube-temp-v1')return;await fs.rm(dir,{recursive:true,force:true,maxRetries:3,retryDelay:200});}
for(const entry of await fs.readdir(tempRoot,{withFileTypes:true})){if(!entry.isDirectory()||!/^[a-f0-9-]{36}$/.test(entry.name))continue;const dir=path.join(tempRoot,entry.name),value=await marker(dir);if(value?.owner!=='youtube-temp-v1')continue;let alive=false;try{process.kill(value.pid,0);alive=true;}catch{}if(!alive)await cleanup(dir);}
function stop(child){if(!child?.pid)return;spawn('taskkill.exe',['/PID',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'}).on('error',()=>{});}
function run(executable,args,{onLine,operation,timeout=0,maxOutput=20*1024*1024}={}){
 return new Promise((resolve,reject)=>{
  const child=spawn(executable,args,{windowsHide:true,env:{...process.env,PYTHONUTF8:'1',PYTHONIOENCODING:'utf-8'},stdio:['ignore','pipe','pipe']});children.add(child);if(operation)operation.child=child;
  let output='',stderr='',partial='',timer;
  if(timeout)timer=setTimeout(()=>{if(operation)operation.timeout=true;stop(child);},timeout);
  child.stdout.setEncoding('utf8');child.stderr.setEncoding('utf8');
  child.stdout.on('data',text=>{if(onLine){partial+=text;const lines=partial.split(/\r?\n/);partial=lines.pop();for(const line of lines)onLine(line);}else{output+=text;if(output.length>maxOutput)stop(child);}});
  child.stderr.on('data',text=>{stderr=(stderr+text).slice(-8000);});
  child.on('error',()=>{clearTimeout(timer);children.delete(child);reject(Error('Không khởi động được công cụ tải YouTube.'));});
  child.on('close',code=>{clearTimeout(timer);children.delete(child);if(onLine&&partial)onLine(partial);if(operation?.cancelled)reject(Error('USER_CANCELED'));else if(operation?.timeout)reject(Error('YouTube phản hồi quá chậm. Thử lại sau.'));else if(code!==0)reject(Error(safeError(stderr)));else resolve(output);});
 });
}
function baseArgs(space){return ['--ignore-config','--no-playlist','--no-warnings','--no-cache-dir','--encoding','utf-8','--js-runtimes','node:'+config.node,'--ffmpeg-location',config.ffmpegDir,'--socket-timeout','20','--retries','3','--fragment-retries','3',...space.cookies?['--cookies',space.cookies]:[]];}
async function getInfo(videoId,cookies,operation){
 const cacheKey=key(videoId,cookies),previous=cache.get(cacheKey);if(previous&&Date.now()-previous.at<180000)return previous.info;
 const space=await workspace(cookies);
 try{const output=await run(config.ytdlp,[...baseArgs(space),'--skip-download','--print',INFO_TEMPLATE,'https://www.youtube.com/watch?v='+videoId],{operation,timeout:120000});const raw=JSON.parse(output),choices=youtubeChoices(raw);if(!choices.length)throw Error('Video không có chất lượng tải khả dụng.');const info={videoId,title:String(raw.title||videoId),duration:Number(raw.duration)||0,choices};cache.set(cacheKey,{at:Date.now(),info});if(cache.size>30)cache.delete(cache.keys().next().value);return info;}finally{await cleanup(space.dir);}
}
async function download(message,operation){
 if(downloadActive)throw Error('Đang tải một video. Chờ lượt hiện tại xong rồi thử lại.');downloadActive=true;
 let space;
 try{
  const info=await getInfo(message.videoId,message.cookies,operation),choice=info.choices.find(item=>item.id===message.choiceId);if(!choice)throw Error('Chất lượng đã thay đổi. Mở danh sách rồi chọn lại.');
  space=await workspace(message.cookies);await fs.mkdir(config.downloadsDir,{recursive:true});
  const template=await outputTemplate(config.downloadsDir,message.videoId,choice);
  let filepath='';const streams=new Map(),expected=choice.estimatedBytes;
  const emit=progressEmitter((state,percent)=>write({event:'progress',id:message.id,videoId:message.videoId,state,percent}));
  const args=[...baseArgs(space),'--no-simulate','--newline','--progress','--windows-filenames','--trim-filenames','180','--no-overwrites','-f',choice.id,'--merge-output-format',choice.container,'-P','home:'+config.downloadsDir,'-P','temp:'+space.dir,'-o',template,'--progress-template','download:MD_PROGRESS:{"status":%(progress.status)j,"bytes":%(progress.downloaded_bytes)j,"total":%(progress.total_bytes)j,"format":%(info.format_id)j}','--progress-template','postprocess:MD_MERGE:%(progress.status)j','--print','after_move:MD_SAVED:%(filepath)j','https://www.youtube.com/watch?v='+message.videoId];
  emit('downloading',0);
  await run(config.ytdlp,args,{operation,onLine:line=>{
   if(line.startsWith('MD_PROGRESS:')){try{const value=JSON.parse(line.slice(12)),bytesForStream=Number(value.bytes)||0;streams.set(value.format,{bytes:bytesForStream,total:Number(value.total)||(value.status==='finished'?bytesForStream:0)});const bytes=[...streams.values()].reduce((sum,item)=>sum+item.bytes,0);const total=expected||(streams.size===choice.streams.length&&[...streams.values()].every(item=>item.total>0)?[...streams.values()].reduce((sum,item)=>sum+item.total,0):0);emit('downloading',total?Math.min(95,Math.floor(bytes/total*95)):null);}catch{}}
   else if(line.startsWith('MD_MERGE:'))emit('merging',98);
   else if(line.startsWith('MD_SAVED:')){try{filepath=JSON.parse(line.slice(9));}catch{}}
  }});
  const relativeFile=filepath?path.relative(config.downloadsDir,path.resolve(filepath)):'';
  if(!filepath||!relativeFile||relativeFile.startsWith('..')||path.isAbsolute(relativeFile))throw Error('Không xác nhận được file đã lưu.');
  const stat=await fs.stat(filepath);if(!stat.isFile()||!stat.size)throw Error('File tải về rỗng.');
  const probe=JSON.parse(await run(path.join(config.ffmpegDir,'ffprobe.exe'),['-v','error','-show_entries','stream=codec_type','-of','json',filepath],{operation,timeout:20000}));
  if(!probe.streams?.some(stream=>stream.codec_type==='video')||choice.hasAudio&&!probe.streams?.some(stream=>stream.codec_type==='audio'))throw Error('File tải về thiếu hình hoặc tiếng.');
  return {videoId:message.videoId,filename:path.basename(filepath),downloadsFolder:path.basename(config.downloadsDir),bytes:stat.size,state:'complete',percent:100};
 }finally{downloadActive=false;if(space)await cleanup(space.dir);}
}
async function handle(message){
 if(!message||typeof message.id!=='string'||message.id.length>100)return;
 if(message.operation==='ping'){write({id:message.id,ok:true,version:'0.1.1'});return;}
 if(message.operation==='open-folder'){try{await openDownloadFolder(config.downloadsDir);write({id:message.id,ok:true});}catch(error){write({id:message.id,ok:false,error:error.message});}return;}
 if(message.operation==='cancel'){const operation=operations.get(message.target);if(operation){operation.cancelled=true;stop(operation.child);}write({id:message.id,ok:true});return;}
 if(!VIDEO_ID.test(message.videoId||'')||!['info','download'].includes(message.operation)){write({id:message.id,ok:false,error:'Yêu cầu YouTube không hợp lệ.'});return;}
 const operation={cancelled:false};operations.set(message.id,operation);
 try{const value=message.operation==='info'?await getInfo(message.videoId,message.cookies,operation):await download(message,operation);write({id:message.id,ok:true,...message.operation==='info'?{info:value}:{result:value}});}catch(error){write({id:message.id,ok:false,error:error.message,cancelled:error.message==='USER_CANCELED'});}finally{operations.delete(message.id);}
}
process.stdin.on('data',chunk=>{input=Buffer.concat([input,chunk]);while(input.length>=4){const size=input.readUInt32LE(0);if(size>1000000){process.exit(1);return;}if(input.length<size+4)return;const payload=input.subarray(4,size+4);input=input.subarray(size+4);try{handle(JSON.parse(payload)).catch(()=>{});}catch{}}});
process.stdin.on('end',()=>{closing=true;for(const child of children)stop(child);setTimeout(()=>process.exit(0),1500);});
process.stdin.resume();
