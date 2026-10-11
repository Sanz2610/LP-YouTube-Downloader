const HOST='com.lp.youtube_downloader';
const VIDEO_ID=/^[A-Za-z0-9_-]{11}$/;
export function youtubeSender(sender){try{const url=new URL(sender.url||'');return url.protocol==='https:'&&['www.youtube.com','m.youtube.com'].includes(url.hostname)&&Number.isInteger(sender.tab?.id);}catch{return false;}}
export class YouTubeDownloads{
 constructor(api=chrome){this.api=api;this.port=null;this.pending=new Map();this.infoRequests=new Map();this.jobs=new Map();this.queue=[];this.active=null;this.idle=null;this.saveQueue=Promise.resolve();this.ready=this.restore();}
 async restore(){const {youtubeJobs}=await this.api.storage.session.get('youtubeJobs');for(const job of Object.values(youtubeJobs||{})){if(['queued','starting','downloading','merging'].includes(job.state))Object.assign(job,{state:'failed',error:'Lượt tải đã bị ngắt. Bấm tải lại để tiếp tục.'});this.jobs.set(job.id,job);}this.pruneJobs();}
 pruneJobs(){const protectedIds=new Set([this.active?.id,...this.queue.map(job=>job.id)]),history=[...this.jobs.values()].filter(job=>!protectedIds.has(job.id)&&!['queued','starting','downloading','merging'].includes(job.state)).sort((a,b)=>b.created-a.created);for(const job of history.slice(30))this.jobs.delete(job.id);}
 connect(){
  clearTimeout(this.idle);if(this.port)return this.port;
  const port=this.port=this.api.runtime.connectNative(HOST);
  port.onMessage.addListener(message=>{
   if(this.port!==port)return;
   if(message.event==='progress'){const job=this.jobs.get(message.id);if(job&&['starting','downloading','merging'].includes(job.state)&&(job.state!==message.state||job.percent!==message.percent)){Object.assign(job,{state:message.state,percent:message.percent});this.publish(job);}return;}
   const pending=this.pending.get(message.id);if(!pending)return;clearTimeout(pending.timer);this.pending.delete(message.id);message.ok?pending.resolve(message):pending.reject(Error(message.cancelled?'USER_CANCELED':message.error||'Công cụ tải YouTube báo lỗi.'));this.scheduleIdle();
  });
  port.onDisconnect.addListener(()=>{
   const detail=this.api.runtime.lastError?.message||'';if(this.port!==port)return;this.port=null;
   this.api.storage.session.set({youtubeNativeConnectionError:{host:HOST,extensionId:this.api.runtime.id,reason:detail,at:Date.now()}}).catch(()=>{});
   const error=/not found/i.test(detail)?'Edge chưa nhận công cụ YouTube. Cần đăng ký helper cho extension này.':/forbidden|not allowed/i.test(detail)?'Edge chưa cho phép extension kết nối công cụ YouTube. Cần đăng ký lại đúng ID extension.':'Kết nối công cụ YouTube bị ngắt. Thử tải lại.';
   for(const pending of this.pending.values()){clearTimeout(pending.timer);pending.reject(Error(error));}this.pending.clear();
  });return port;
 }
 scheduleIdle(){clearTimeout(this.idle);if(this.pending.size)return;this.idle=setTimeout(()=>{const port=this.port;this.port=null;port?.disconnect();},60000);}
 request(operation,data={},id=crypto.randomUUID(),timeoutMs=120000){return new Promise((resolve,reject)=>{
  try{const port=this.connect(),timer=timeoutMs?setTimeout(()=>{this.pending.delete(id);reject(Error('YouTube phản hồi quá chậm. Thử lại sau.'));this.request('cancel',{target:id},crypto.randomUUID(),10000).catch(()=>{});},timeoutMs):null;this.pending.set(id,{resolve,reject,timer});port.postMessage({id,operation,...data});}
  catch(error){this.pending.delete(id);reject(error);}
 });}
 async cookies(){return (await this.api.cookies.getAll({domain:'.youtube.com'})).filter(cookie=>/^(?:\.)?(?:[a-z0-9-]+\.)*youtube\.com$/i.test(cookie.domain)).sort((a,b)=>(a.domain+a.path+a.name).localeCompare(b.domain+b.path+b.name));}
 validate(videoId){if(!VIDEO_ID.test(videoId||''))throw Error('Video YouTube không hợp lệ.');}
 async info(videoId){
  this.validate(videoId);const cookies=await this.cookies(),digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(cookies))),key=videoId+':'+[...new Uint8Array(digest)].map(value=>value.toString(16).padStart(2,'0')).join('');
  let pending=this.infoRequests.get(key);
  if(!pending){pending=this.request('info',{videoId,cookies}).then(response=>response.info).finally(()=>{if(this.infoRequests.get(key)===pending)this.infoRequests.delete(key);});this.infoRequests.set(key,pending);}
  return pending;
 }
 snapshot(job){const {tabId,...value}=job;return value;}
 publish(job){
  this.pruneJobs();const snapshot=Object.fromEntries([...this.jobs.values()].map(item=>[item.id,item]));
  this.saveQueue=this.saveQueue.catch(()=>{}).then(()=>this.api.storage.session.set({youtubeJobs:snapshot}));
  this.api.tabs.sendMessage(job.tabId,{type:'youtube:job',job:this.snapshot(job)}).catch(()=>{});
 }
 async start(videoId,choiceId,sender){
  await this.ready;this.validate(videoId);if(!/^[\d]+(?:-[a-z0-9_-]+)?(?:\+[\d]+(?:-[a-z0-9_-]+)?)?$/i.test(choiceId||''))throw Error('Chất lượng YouTube không hợp lệ.');
  if(this.queue.length>=5)throw Error('Có nhiều video đang chờ tải. Chờ lượt hiện tại xong rồi thử lại.');
  const job={id:crypto.randomUUID(),videoId,choiceId,tabId:sender.tab.id,state:'queued',percent:0,created:Date.now()};this.jobs.set(job.id,job);this.queue.push(job);this.publish(job);this.pump();return this.snapshot(job);
 }
 async pump(){
  if(this.active||!this.queue.length)return;const job=this.queue.shift();this.active=job;
  try{Object.assign(job,{state:'starting',percent:0});this.publish(job);const cookies=await this.cookies();if(job.state==='cancelled')throw Error('USER_CANCELED');const response=await this.request('download',{videoId:job.videoId,choiceId:job.choiceId,cookies},job.id,0);Object.assign(job,response.result);}
  catch(error){job.state=error.message==='USER_CANCELED'?'cancelled':'failed';job.error=error.message==='USER_CANCELED'?'Đã dừng tải.':error.message;}
  finally{this.publish(job);this.active=null;this.pump();}
 }
 async cancel(jobId){const job=this.jobs.get(jobId);if(!job)return;if(this.active?.id===jobId){job.state='cancelled';this.publish(job);await this.request('cancel',{target:jobId});}else{this.queue=this.queue.filter(item=>item.id!==jobId);job.state='cancelled';job.error='Đã dừng tải.';this.publish(job);}}
 async openFolder(){await this.request('open-folder',{},crypto.randomUUID(),10000);}
 async list(){await this.ready;return [...this.jobs.values()].map(job=>this.snapshot(job));}
}
