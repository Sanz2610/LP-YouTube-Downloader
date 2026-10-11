import {t,getLanguage,getLocale,initializeLanguage,subscribeLanguage} from '../shared/i18n.js';
// YouTube UI only. Media extraction and remuxing run in the local helper.
// Icon node data copied from the project's official Lucide assets (ISC license).
(()=>{
 const KEY='LPYouTubeDownloader';if(globalThis[KEY]?.version==='0.1.1')return;
 globalThis[KEY]?.destroy?.();
 const SVG='http://www.w3.org/2000/svg';
 const paths={download:['M12 15V3','M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4','m7 10 5 5 5-5'],folder:['M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z'],x:['M18 6 6 18','m6 6 12 12'],loader:['M21 12a9 9 0 1 1-6.219-8.56']};
 const style=`
 :host{font-family:Roboto,"Open Sans",Arial,sans-serif;font-size:13px;color:#17233a;--surface:#fff;--text:#17233a;--muted:#526176;--border:#dce4ef;--soft:#edf4ff;--accent:#0964d9;--error:#b42318}
 :host([data-dark]){color-scheme:dark;--surface:#212733;--text:#edf2fa;--muted:#b9c5d6;--border:#3b4659;--soft:#1c3554;--accent:#83b8ff;--error:#ffb4ab}
 *,*::before,*::after{box-sizing:border-box}button{font:inherit;cursor:pointer}button:disabled{cursor:default;opacity:.55}button:focus-visible{outline:2px solid var(--accent);outline-offset:3px}svg{width:16px;height:16px;flex-shrink:0;display:block}
 .trigger{width:32px;height:32px;padding:7px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;border:1px solid rgba(255,255,255,.28);background:rgba(0,0,0,.58);color:#b9c0ca;box-shadow:0 2px 8px #0007;backdrop-filter:blur(3px);transition:background .12s,color .12s;touch-action:manipulation}
 .trigger:hover{background:rgba(0,0,0,.78);color:#fff}.watch{border-radius:50%;height:32px;box-shadow:0 2px 8px #0007}.trigger[data-busy=true]{background:rgba(0,0,0,.78);color:#d8e6ff}
 .popup{position:fixed;inset:auto;width:min(320px,calc(100vw - 16px));max-height:min(480px,calc(100dvh - 16px));margin:0;padding:0;border:1px solid var(--border);border-radius:12px;background:var(--surface);color:var(--text);box-shadow:0 8px 28px #0003;overflow:hidden;font:inherit}
 .popup:popover-open{display:flex;flex-direction:column}.heading{display:flex;align-items:center;justify-content:space-between;padding:12px 12px 3px;gap:8px}.heading h2{margin:0;font-size:15px;line-height:22px;font-weight:600}.close{border:0;border-radius:5px;background:transparent;color:var(--muted);width:28px;height:28px;display:grid;place-items:center}.close:hover{background:var(--soft);color:var(--text)}
 .title{padding:0 12px 9px;color:var(--muted);font-size:12px;line-height:18px;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
 .choices{overflow:auto;overscroll-behavior:contain;padding:0 5px 6px;scrollbar-width:thin;max-height:300px}.choice{width:100%;padding:9px 8px;display:flex;justify-content:space-between;align-items:center;gap:8px;border:0;border-radius:6px;background:transparent;color:var(--text);line-height:20px;text-align:left}.choice:hover,.choice:focus-visible{background:var(--soft);color:var(--accent)}.quality{font-weight:600;font-size:13px}.details{font-size:12px;color:var(--muted);white-space:nowrap}
 .status{padding:4px 12px 12px;line-height:20px;font-size:13px;overflow-wrap:anywhere}.status:empty{display:none}.status[data-error=true]{color:var(--error)}.progress-area{padding:2px 12px 12px}.progress-area[hidden],.choices[hidden]{display:none}.progress-row,.complete-actions{display:flex;align-items:center;justify-content:space-between;gap:8px}.cancel,.folder-btn,.retry-btn{border:1px solid var(--border);background:var(--surface);border-radius:6px;padding:7px 9px;color:var(--text);display:inline-flex;align-items:center;gap:6px}.cancel:hover,.folder-btn:hover,.retry-btn:hover{background:var(--soft)}[hidden]{display:none!important}progress{display:block;width:100%;height:5px;margin:8px 0 0;border:0;border-radius:10px;overflow:hidden;accent-color:#0964d9}progress::-webkit-progress-bar{background:var(--soft)}progress::-webkit-progress-value{background:#0964d9}.spin{animation:md-spin 1s linear infinite}@keyframes md-spin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.spin{animation:none}.trigger{transition:none}}
 `;
 function element(name,attrs={},text){const node=document.createElement(name);for(const [key,value] of Object.entries(attrs))node.setAttribute(key,['aria-label','title'].includes(key)?t(value):value);if(text!==undefined)node.textContent=t(text);return node;}
 function icon(name){const node=document.createElementNS(SVG,'svg');for(const [key,value] of Object.entries({viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':'2','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'}))node.setAttribute(key,value);for(const d of paths[name]||paths.download){const path=document.createElementNS(SVG,'path');path.setAttribute('d',d);node.append(path);}if(name==='loader')node.classList.add('spin');return node;}
 function videoID(value){try{const url=new URL(value,location.origin);if(!['www.youtube.com','m.youtube.com','youtube.com'].includes(url.hostname))return '';const id=url.pathname==='/watch'?url.searchParams.get('v'):url.pathname.match(/^\/shorts\/([^/]+)/)?.[1];return /^[A-Za-z0-9_-]{11}$/.test(id||'')?id:'';}catch{return '';}}
 async function send(payload){const response=await chrome.runtime.sendMessage(payload);if(!response?.ok)throw Error(response?.error||'Không kết nối được công cụ tải.');return response;}
 const records=new Map(),jobs=new Map(),infos=new Map(),busyStates=new Set(['queued','starting','downloading','merging']);let opened=null,requestToken=0,displayedJobId=null,scanTimer,positionFrame,cachedHref,cachedVideoID='';
 function currentVideoID(){if(cachedHref!==location.href){cachedHref=location.href;cachedVideoID=videoID(cachedHref);}return cachedVideoID;}
 // Remove only a previous instance left behind after an extension reload.
 for(const node of document.querySelectorAll('[data-md-youtube]'))node.remove();
 const portal=element('span',{'data-md-youtube':'popup'});document.documentElement.append(portal);const shadow=portal.attachShadow({mode:'open'});const sheet=element('style',{},style);shadow.append(sheet);
 const popup=element('div',{popover:'auto',class:'popup',role:'dialog','aria-labelledby':'md-youtube-heading'}),heading=element('div',{class:'heading'}),label=element('h2',{id:'md-youtube-heading'},'Tải video'),close=element('button',{type:'button',class:'close','aria-label':'Đóng menu tải'});close.append(icon('x'));heading.append(label,close);
 const title=element('div',{class:'title'}),choices=element('div',{class:'choices','aria-label':'Chọn chất lượng'}),status=element('div',{class:'status',role:'status','aria-live':'polite','aria-atomic':'true'}),progressArea=element('div',{class:'progress-area'}),progressRow=element('div',{class:'progress-row'}),percent=element('span'),cancel=element('button',{type:'button',class:'cancel'},'Dừng'),folderButton=element('button',{type:'button',class:'folder-btn','aria-label':'Mở thư mục tải'},'Mở thư mục'),progress=element('progress',{max:'100','aria-label':'Tiến trình tải video'});
 const completeActions=element('div',{class:'complete-actions'}),retryButton=element('button',{type:'button',class:'retry-btn'},'Tải lại');
 folderButton.prepend(icon('folder'));folderButton.hidden=true;completeActions.hidden=true;completeActions.append(folderButton,retryButton);progressRow.append(percent,cancel);progressArea.append(progressRow,completeActions,progress);progressArea.hidden=true;popup.append(heading,title,choices,status,progressArea);shadow.append(popup);
 function dark(){return document.documentElement.hasAttribute('dark')||getComputedStyle(document.documentElement).colorScheme==='dark';}
 function theme(){portal.toggleAttribute('data-dark',dark());for(const record of records.values())record.host.toggleAttribute('data-dark',dark());}
 function positionControls(){for(const record of records.values()){if(!record.host.isConnected||!record.anchor.isConnected)continue;record.host.style.top='16px';record.host.style.right='16px';}}
 function position(){if(!opened||!popup.matches(':popover-open'))return;if(!opened.button.isConnected){popup.hidePopover();return;}const rect=opened.button.getBoundingClientRect(),box=popup.getBoundingClientRect();const left=Math.max(8,Math.min(rect.left,innerWidth-box.width-8));const below=rect.bottom+6,desiredTop=below+box.height<=innerHeight-8?below:rect.top-box.height-6,top=Math.max(8,Math.min(desiredTop,innerHeight-box.height-8));popup.style.left=left+'px';popup.style.top=top+'px';}
 function schedulePosition(){cancelAnimationFrame(positionFrame);positionFrame=requestAnimationFrame(()=>{positionControls();if(opened&&popup.matches(':popover-open'))position();});}
 let statusSource='',statusError=false;
 function setStatus(text,error=false){statusSource=text;statusError=error;const translated=t(text);if(status.textContent!==translated)status.textContent=translated;if(status.dataset.error!==String(error))status.dataset.error=String(error);}
 function currentJob(id){return [...jobs.values()].filter(job=>job.videoId===id).sort((a,b)=>b.created-a.created)[0];}
 function jobState(job){
  const names={queued:'Đang chờ',starting:'Đang chuẩn bị',downloading:'Đang tải',merging:'Đang ghép hình và tiếng',complete:'Đã lưu vào Tải xuống',cancelled:'Đã dừng tải'};
  if(job.state==='complete')return t('Đã lưu vào {folder}',{folder:job.downloadsFolder||'Downloads'});
  return t(job.state==='failed'?job.error||'Tải không thành công.':names[job.state]||'Đang tải');
 }
 function updateJob(job){
  const known=jobs.has(job.id);jobs.set(job.id,job);const busy=busyStates.has(job.state);
  if(!known||!busy){const history=[...jobs.values()].filter(item=>!busyStates.has(item.state)).sort((a,b)=>b.created-a.created);for(const item of history.slice(30))jobs.delete(item.id);}
  for(const record of records.values())if(record.videoId===job.videoId){
   if((record.button.dataset.busy==='true')!==busy)record.button.replaceChildren(icon(busy?'loader':'download'));
   if(record.button.dataset.busy!==String(busy))record.button.dataset.busy=String(busy);
   const tooltip=busy?jobState(job):t('Tải video YouTube');if(record.button.title!==tooltip)record.button.title=tooltip;
  }
  if(opened?.videoId!==job.videoId||!popup.matches(':popover-open')||currentJob(job.videoId)?.id!==job.id)return;
  // Restored terminal history must never replace a newly opened quality menu.
  if(!busy&&displayedJobId!==job.id)return;
  displayedJobId=job.id;
 const complete=job.state==='complete';choices.hidden=true;progressArea.hidden=!(busy||complete);progressRow.hidden=!busy;cancel.hidden=!busy;completeActions.hidden=!complete;folderButton.hidden=!complete;progress.hidden=!busy;setStatus(jobState(job),job.state==='failed');
  if(busy){if(job.percent===null){progress.removeAttribute('value');percent.textContent='';}else{progress.value=job.percent||0;percent.textContent=(job.percent||0)+'%';}cancel.dataset.job=job.id;}
  schedulePosition();
 }
 function showChoices(info){
  displayedJobId=null;title.textContent=info.title;title.title=info.title;choices.replaceChildren();choices.hidden=false;progressArea.hidden=true;setStatus('');
  for(const choice of info.choices){const row=element('button',{type:'button',class:'choice','aria-label':t('Tải {quality} {container}',{quality:choice.label,container:choice.container.toUpperCase()})}),quality=element('span',{class:'quality'},choice.label),details=element('span',{class:'details'});let text=choice.container.toUpperCase();if(choice.estimatedBytes)text+=' · '+(choice.estimated?'≈ ':'')+new Intl.NumberFormat(getLocale(),{maximumFractionDigits:1}).format(choice.estimatedBytes/1048576)+' MB';details.textContent=text;row.append(quality,details);row.onclick=async event=>{if(!event.isTrusted)return;const record=opened;if(!record)return;choices.hidden=true;setStatus('Đang chuẩn bị tải…');try{const response=await send({type:'youtube:download',videoId:record.videoId,choiceId:choice.id});updateJob(response.job);}catch(error){setStatus(error.message,true);choices.hidden=false;}schedulePosition();};choices.append(row);}
  schedulePosition();
 }
 async function open(record,event){
  event.preventDefault();event.stopPropagation();if(!event.isTrusted)return;
  opened=record;displayedJobId=null;const requestedVideo=record.videoId,token=++requestToken;theme();title.textContent='';choices.replaceChildren();choices.hidden=true;progressArea.hidden=true;setStatus('Đang lấy chất lượng…');
  record.button.setAttribute('aria-expanded','true');if(!popup.matches(':popover-open'))popup.showPopover();position();close.focus({preventScroll:true});
  const running=currentJob(record.videoId);if(running&&busyStates.has(running.state)){updateJob(running);return;}
  try{const cached=infos.get(requestedVideo);const info=cached&&Date.now()-cached.at<120000?cached.info:(await send({type:'youtube:info',videoId:requestedVideo})).info;if(token!==requestToken||opened?.videoId!==requestedVideo)return;infos.set(requestedVideo,{at:Date.now(),info});if(infos.size>30)infos.delete(infos.keys().next().value);showChoices(info);}
  catch(error){if(token===requestToken){setStatus(error.message,true);schedulePosition();}}
 }
 close.onclick=()=>popup.hidePopover();cancel.onclick=async event=>{if(!event.isTrusted)return;cancel.disabled=true;try{await send({type:'youtube:cancel',jobId:cancel.dataset.job});}catch(error){setStatus(error.message,true);}finally{cancel.disabled=false;}};folderButton.onclick=async event=>{if(!event.isTrusted)return;folderButton.disabled=true;setStatus('Đang mở thư mục…');try{await send({type:'youtube:open-folder'});const job=opened&&currentJob(opened.videoId);if(job)setStatus(jobState(job));}catch(error){setStatus(error.message,true);}finally{folderButton.disabled=false;}};
 retryButton.onclick=event=>{if(opened)open(opened,event);};
 popup.addEventListener('toggle',event=>{if(event.newState==='closed'){requestToken++;opened?.button.setAttribute('aria-expanded','false');opened?.button.focus({preventScroll:true});opened=null;}});
 popup.addEventListener('keydown',event=>{if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;const rows=[...choices.querySelectorAll('button:not(:disabled)')];if(!rows.length)return;const focused=shadow.activeElement,index=rows.indexOf(focused);let next=event.key==='Home'?0:event.key==='End'?rows.length-1:(index+(event.key==='ArrowDown'?1:-1)+rows.length)%rows.length;event.preventDefault();rows[next].focus();});
 function attach(anchor,id,mode='watch'){
  const watch=mode==='watch';
  if(records.has(anchor)){const record=records.get(anchor);if(record.videoId!==id){if(opened===record)popup.hidePopover();record.videoId=id;record.button.replaceChildren(icon('download'));record.button.dataset.busy='false';record.button.title=t('Tải video YouTube');}
   // SPA rendering can clear the toolbar's children without replacing the toolbar.
   if(record.host.parentNode!==anchor)anchor.append(record.host);positionControls();
   record.button.setAttribute('aria-label',t('Tải video YouTube {id}',{id}));return;}
  const host=element('span',{'data-md-youtube':mode}),root=host.attachShadow({mode:'open'}),css=element('style',{},style),button=element('button',{type:'button',class:'trigger'+(watch?' watch':''),'aria-label':t('Tải video YouTube {id}',{id}),'aria-haspopup':'dialog','aria-expanded':'false',title:'Tải video YouTube'});
  button.append(icon('download'));root.append(css,button);const previousPosition=anchor.style.position,record={anchor,host,button,videoId:id,watch,mode,previousPosition,restorePosition:getComputedStyle(anchor).position==='static'};if(record.restorePosition)anchor.style.position='relative';records.set(anchor,record);
  button.addEventListener('pointerdown',event=>event.stopPropagation());button.onclick=event=>open(record,event);
  // Absolute placement keeps the control attached to the active player surface.
  host.style.cssText='position:absolute;display:inline-flex;align-items:center;z-index:2147483646;margin:0';anchor.append(host);positionControls();
  host.toggleAttribute('data-dark',dark());const job=currentJob(id);if(job)updateJob(job);
 }
 function scan(){
  const id=currentVideoID();let target=null,mode='watch';
  const visible=node=>node.getClientRects().length>0&&!node.closest('[hidden]');
  const playerSurface=(scope,shorts=false)=>{const selectors=shorts?['#movie_player','#player-container-outer','#player-container-inner','ytd-reel-video-renderer[is-active]']:['#movie_player','ytd-player #player-container-outer','ytd-player #player-container-inner','ytd-player'];return selectors.map(selector=>[...scope.querySelectorAll(selector)]).flat().find(node=>visible(node)&&node.querySelector('video'))||null;};
  if(id&&location.pathname==='/watch'){
   const views=[...document.querySelectorAll('ytd-watch-flexy')].filter(node=>!node.hasAttribute('hidden')&&(!node.getAttribute('video-id')||node.getAttribute('video-id')===id));
   const scope=views[0]||document;
   target=playerSurface(scope)||playerSurface(document);
  }else if(id&&location.pathname.startsWith('/shorts/')){mode='shorts';const active=[...document.querySelectorAll('ytd-reel-video-renderer[is-active],ytd-reel-video-renderer[active]')].find(visible);target=active?playerSurface(active,true)||active:null;}
  // Keep exactly one trigger on the active player's actions, including playlist navigation.
  for(const [anchor,record] of records)if(anchor!==target||!anchor.isConnected){if(opened===record&&popup.matches(':popover-open'))popup.hidePopover();record.host.remove();if(record.restorePosition&&anchor.isConnected)anchor.style.position=record.previousPosition;records.delete(anchor);}
  if(target)attach(target,id,mode);
 }
 // Coalesce mutations without letting captions/comments postpone attachment forever.
 function scheduleScan(){if(scanTimer!==undefined)return;scanTimer=setTimeout(()=>{scanTimer=undefined;scan();},150);}
 const observer=new MutationObserver(mutations=>{
  const id=currentVideoID(),record=records.values().next().value;
  if(!id&&!record)return;
  // Caption/comment/feed updates do not require another document-wide toolbar search.
  if(!record||record.videoId!==id||!record.anchor.isConnected||record.host.parentNode!==record.anchor){scheduleScan();return;}
  if(mutations.some(mutation=>mutation.type==='attributes'&&!mutation.target.closest?.('[data-md-youtube]')
   &&(mutation.target.contains?.(record.anchor)||['YTD-WATCH-FLEXY','YTD-REEL-VIDEO-RENDERER'].includes(mutation.target.tagName))))scheduleScan();
 });observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['video-id','is-active','active','hidden','style','class']});
 const themeObserver=new MutationObserver(theme);themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['dark']});
 document.addEventListener('yt-navigate-finish',scheduleScan);document.addEventListener('yt-page-data-updated',scheduleScan);
 window.addEventListener('popstate',scheduleScan);
 window.addEventListener('resize',schedulePosition,{passive:true});window.addEventListener('scroll',schedulePosition,{passive:true,capture:true});
 const jobListener=message=>{if(message.type==='youtube:job')updateJob(message.job);};chrome.runtime.onMessage.addListener(jobListener);
 globalThis[KEY]={version:'0.1.1',destroy(){observer.disconnect();themeObserver.disconnect();clearTimeout(scanTimer);cancelAnimationFrame(positionFrame);document.removeEventListener('yt-navigate-finish',scheduleScan);document.removeEventListener('yt-page-data-updated',scheduleScan);window.removeEventListener('popstate',scheduleScan);window.removeEventListener('resize',schedulePosition);window.removeEventListener('scroll',schedulePosition,true);chrome.runtime.onMessage.removeListener(jobListener);unsubscribeLanguage();for(const record of records.values()){record.host.remove();if(record.restorePosition&&record.anchor.isConnected)record.anchor.style.position=record.previousPosition;}portal.remove();}};scan();send({type:'youtube:jobs'}).then(response=>response.jobs.forEach(updateJob)).catch(()=>{});
 const localize=()=>{portal.lang=getLanguage();label.textContent=t('Tải video');close.setAttribute('aria-label',t('Đóng menu tải'));choices.setAttribute('aria-label',t('Chọn chất lượng'));cancel.textContent=t('Dừng');folderButton.setAttribute('aria-label',t('Mở thư mục tải'));folderButton.lastChild.textContent=t('Mở thư mục');progress.setAttribute('aria-label',t('Tiến trình tải video'));for(const record of records.values()){record.host.lang=getLanguage();record.button.setAttribute('aria-label',t('Tải video YouTube {id}',{id:record.videoId}));record.button.title=t('Tải video YouTube');}if(!choices.hidden&&opened&&infos.has(opened.videoId))showChoices(infos.get(opened.videoId).info);else setStatus(statusSource,statusError);for(const record of records.values()){const job=currentJob(record.videoId);if(job)updateJob(job);}};
 const unsubscribeLanguage=subscribeLanguage(localize);initializeLanguage().then(localize);
})();
