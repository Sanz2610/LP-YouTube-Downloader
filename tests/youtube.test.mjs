import test from 'node:test';import assert from 'node:assert/strict';
import {youtubeChoices,cookieText,safeError} from '../helper/formats.mjs';
import {youtubeSender,YouTubeDownloads} from '../src/background/youtube.js';
import {progressEmitter} from '../helper/flow.mjs';
const format=(id,props={})=>({format_id:id,url:'https://example.test/video',ext:'mp4',width:1920,height:1080,fps:30,vcodec:'avc1.640028',acodec:'none',filesize:100,...props});
const aac=format('140',{width:0,height:0,vcodec:'none',acodec:'mp4a.40.2',ext:'m4a',abr:128,filesize:20});
test('adaptive video offers a real video/audio pair and compatible copy container',()=>{const [choice]=youtubeChoices({formats:[format('137'),aac]});assert.equal(choice.id,'137+140');assert.equal(choice.container,'mp4');assert.equal(choice.hasAudio,true);assert.equal(choice.estimatedBytes,120);assert.equal(choice.label,'1080p');});
test('progressive files with sound are preferred at the same resolution',()=>{const result=youtubeChoices({formats:[format('137'),format('22',{acodec:'mp4a.40.2'}),aac]});assert.equal(result.length,1);assert.equal(result[0].id,'22');});
test('WebM pairs with Opus without changing codec or falsely claiming MP4',()=>{const [choice]=youtubeChoices({formats:[format('248',{ext:'webm',vcodec:'vp9'}),{...aac,format_id:'251',ext:'webm',acodec:'opus'}]});assert.equal(choice.container,'webm');assert.equal(choice.id,'248+251');});
test('vertical Shorts labels use their real short-side resolution and preserve FPS/HDR',()=>{const [choice]=youtubeChoices({formats:[format('399',{width:1080,height:1920,fps:60,dynamic_range:'HDR10',vcodec:'av01.0.08M.10'}),aac]});assert.equal(choice.label,'1080p60 HDR');assert.equal(choice.height,1920);});
test('live, protected and unavailable formats cannot become invented quality choices',()=>{assert.throws(()=>youtubeChoices({is_live:true}),/trực tiếp/);assert.deepEqual(youtubeChoices({formats:[format('137',{has_drm:true}),format('unknown-id')]}),[]);});
test('missing exact sizes are estimates and silent videos do not invent an audio track',()=>{const [choice]=youtubeChoices({formats:[format('137',{filesize:undefined,filesize_approx:200})]});assert.equal(choice.estimated,true);assert.equal(choice.hasAudio,false);assert.equal(choice.id,'137');});
test('cookies only include YouTube domains and cannot inject Netscape records',()=>{const text=cookieText([{domain:'.youtube.com',name:'session',value:'fixture',path:'/',secure:true,httpOnly:true,expirationDate:100},{domain:'.google.com',name:'other',value:'private'},{domain:'.youtube.com',name:'broken',value:'a\nINJECTED'}]);assert.match(text,/#HttpOnly_\.youtube.com\tTRUE\t\/\tTRUE\t100\tsession\tfixture/);assert.ok(!text.includes('private'));assert.ok(!text.includes('INJECTED'));});
test('native errors expose a cause without echoing signed media URLs',()=>{assert.match(safeError('HTTP Error 403: https://video.test/?signature=private'),/HTTP 403/);assert.ok(!safeError('HTTP Error 403: https://video.test/?signature=private').includes('signature'));});
test('only extension-owned content on a real HTTPS YouTube tab may use the helper',()=>{assert.equal(youtubeSender({url:'https://www.youtube.com/watch?v=jNQXAC9IVRw',tab:{id:1}}),true);for(const url of ['https://youtube.com.attacker.test/','https://www.facebook.com/','http://www.youtube.com/'])assert.equal(youtubeSender({url,tab:{id:1}}),false);assert.equal(youtubeSender({url:'https://www.youtube.com/'}),false);});
test('restoring an interrupted native job makes its interruption explicit',async()=>{const api={storage:{session:{get:async()=>({youtubeJobs:{job:{id:'job',videoId:'jNQXAC9IVRw',state:'downloading'}}})}}};const manager=new YouTubeDownloads(api);const [job]=await manager.list();assert.equal(job.state,'failed');assert.match(job.error,/bị ngắt/);});
test('an unknown video size cannot turn only the audio size into the whole download size',()=>{const [choice]=youtubeChoices({formats:[format('137',{filesize:undefined}),aac]});assert.equal(choice.estimatedBytes,0);});
test('low FPS variants do not produce two indistinguishable 144p choices',()=>{const choices=youtubeChoices({formats:[format('269',{width:256,height:144,fps:15}),format('602',{width:256,height:144,fps:30}),aac]});assert.equal(choices.length,1);assert.equal(choices[0].label,'144p');assert.equal(choices[0].fps,30);});
test('the original non-DRC audio track is retained instead of picking a louder variant',()=>{const [choice]=youtubeChoices({formats:[format('137'),aac,{...aac,format_id:'140-drc',abr:140}]});assert.equal(choice.id,'137+140');});

function nativeAPI(){
 const ports=[],values={};const api={runtime:{id:'test-extension',lastError:null,connectNative(){const messages=[],disconnected=[];const port={onMessage:{addListener:fn=>messages.push(fn)},onDisconnect:{addListener:fn=>disconnected.push(fn)},postMessage(){},emit(message){messages.forEach(fn=>fn(message));},end(){disconnected.forEach(fn=>fn());},disconnect(){this.end();}};ports.push(port);return port;}},storage:{session:{get:async()=>({}),set:async data=>Object.assign(values,data)}}};return {api,ports,values};
}
test('a disconnect from an old native port cannot reject a request on the new connection',async()=>{
 const {api,ports}=nativeAPI(),manager=new YouTubeDownloads(api);const first=manager.request('ping',{},'first',0);ports[0].emit({id:'first',ok:true});await first;clearTimeout(manager.idle);
 manager.port=null;const second=manager.request('ping',{},'second',0);api.runtime.lastError={message:'Specified native messaging host not found.'};ports[0].end();assert.equal(manager.port,ports[1]);ports[1].emit({id:'second',ok:true});assert.equal((await second).ok,true);clearTimeout(manager.idle);
});
test('native connection failure preserves its actual diagnostic without mixing it with media failure',async()=>{
 const {api,ports,values}=nativeAPI(),manager=new YouTubeDownloads(api);const pending=manager.request('ping',{},'request',0);api.runtime.lastError={message:'Specified native messaging host not found.'};ports[0].end();await assert.rejects(pending,/Edge chưa nhận công cụ/);assert.equal(values.youtubeNativeConnectionError.reason,api.runtime.lastError.message);assert.equal(values.youtubeNativeConnectionError.extensionId,'test-extension');
});
test('unchanged native progress does not repeatedly publish or restart cancelled jobs',async()=>{
 const {api,ports,values}=nativeAPI(),messages=[];api.tabs={sendMessage:async(id,message)=>messages.push(message)};
 const manager=new YouTubeDownloads(api);await manager.ready;manager.connect();const job={id:'job',videoId:'jNQXAC9IVRw',tabId:1,state:'starting',percent:0,created:1};manager.jobs.set(job.id,job);
 ports[0].emit({event:'progress',id:job.id,state:'downloading',percent:null});ports[0].emit({event:'progress',id:job.id,state:'downloading',percent:null});await manager.saveQueue;assert.equal(messages.length,1);assert.equal(values.youtubeJobs.job.percent,null);
 job.state='cancelled';ports[0].emit({event:'progress',id:job.id,state:'downloading',percent:50});assert.equal(job.state,'cancelled');assert.equal(messages.length,1);
});
test('finished history is bounded while live and queued jobs survive pruning',async()=>{
 const {api}=nativeAPI(),manager=new YouTubeDownloads(api);await manager.ready;
 for(let index=0;index<70;index++)manager.jobs.set(String(index),{id:String(index),state:'complete',created:index});
 const queued={id:'queued',state:'queued',created:-1};manager.jobs.set(queued.id,queued);manager.queue=[queued];manager.pruneJobs();assert.equal(manager.jobs.size,31);assert.equal(manager.jobs.get('queued'),queued);assert.equal(manager.jobs.has('0'),false);assert.equal(manager.jobs.has('69'),true);
});
test('simultaneous quality lookups share work for identical login snapshots',async()=>{
 const {api}=nativeAPI();let cookieValue='first';api.cookies={getAll:async()=>[{domain:'.youtube.com',path:'/',name:'session',value:cookieValue}]};
 const manager=new YouTubeDownloads(api),calls=[];manager.request=(operation,data)=>new Promise(resolve=>calls.push({operation,data,resolve}));
 const waitForCalls=async count=>{const deadline=Date.now()+2000;while(calls.length<count&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,5));assert.equal(calls.length,count);};
 const first=manager.info('jNQXAC9IVRw'),same=manager.info('jNQXAC9IVRw');await waitForCalls(1);
 cookieValue='second';const changed=manager.info('jNQXAC9IVRw');await waitForCalls(2);
 calls[0].resolve({info:{title:'first'}});calls[1].resolve({info:{title:'second'}});assert.deepEqual(await Promise.all([first,same,changed]),[{title:'first'},{title:'first'},{title:'second'}]);assert.equal(manager.infoRequests.size,0);
});
test('progress reports skip repeats and preserve phase changes under throttling',()=>{
 let time=0;const values=[],emit=progressEmitter((state,percent)=>values.push({state,percent}),{now:()=>time});
 emit('downloading',0);time=400;emit('downloading',0);emit('downloading',null);time=800;emit('downloading',null);emit('downloading',10);time=810;emit('merging',98);
 assert.deepEqual(values,[{state:'downloading',percent:0},{state:'downloading',percent:null},{state:'downloading',percent:10},{state:'merging',percent:98}]);
});
test('simultaneous folder clicks share one native request and a failed attempt can be retried',async()=>{
 const {api,ports}=nativeAPI(),manager=new YouTubeDownloads(api);let sent=[];
 manager.connect();ports[0].postMessage=message=>sent.push(message);
 const first=manager.openFolder(),same=manager.openFolder();assert.equal(first,same);assert.equal(sent.length,1);assert.equal(sent[0].operation,'open-folder');
 ports[0].emit({id:sent[0].id,ok:false,error:'Không mở được thư mục tải.'});await assert.rejects(first,/Không mở được/);clearTimeout(manager.idle);
 const retry=manager.openFolder();assert.equal(sent.length,2);ports[0].emit({id:sent[1].id,ok:true});await retry;clearTimeout(manager.idle);
});
