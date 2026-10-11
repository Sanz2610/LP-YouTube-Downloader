export const VIDEO_ID=/^[A-Za-z0-9_-]{11}$/;
const formatID=/^\d+(?:-[a-z0-9_-]+)?$/i;
const video=f=>Number(f.width)>0&&Number(f.height)>0&&f.vcodec!=='none';
const audio=f=>typeof f.acodec==='string'&&f.acodec!=='none';
const size=f=>Number(f.filesize||f.filesize_approx)||0;
export function youtubeChoices(info){
 if(info.is_live||info.live_status==='is_upcoming')throw Error('Video đang phát trực tiếp hoặc chưa phát chưa hỗ trợ tải.');
 const formats=(info.formats||[]).filter(f=>formatID.test(f.format_id||'')&&!f.has_drm&&f.url);
 const audioScore=f=>(Number(f.language_preference)||0)*10000+(/original/i.test(f.format_note||'')?5000:0)+(/-drc$/.test(f.format_id)?0:1000)+(Number(f.abr)||Number(f.tbr)||0);
 const audios=formats.filter(f=>!video(f)&&audio(f)).sort((a,b)=>audioScore(b)-audioScore(a));
 const grouped=new Map();
 for(const f of formats.filter(video)){
  let paired=null,container=['mp4','webm'].includes(f.ext)?f.ext:'mkv';
  if(!audio(f)){
   paired=audios.find(a=>container==='mp4'?/^(?:mp4a|aac)/i.test(a.acodec):container==='webm'?/^(?:opus|vorbis)/i.test(a.acodec):true)||audios[0];
   if(paired&&!(container==='mp4'&&/^(?:mp4a|aac)/i.test(paired.acodec))&&!(container==='webm'&&/^(?:opus|vorbis)/i.test(paired.acodec)))container='mkv';
  }
  const resolution=Number(String(f.format_note||'').match(/(\d{3,4})p/)?.[1])||Math.min(Number(f.width),Number(f.height));
  const fps=Math.round(Number(f.fps)||30),hdr=Boolean(f.dynamic_range&&f.dynamic_range!=='SDR');
  const label=resolution+'p'+(fps>=50?fps:'')+(hdr?' HDR':'');
  const id=f.format_id+(paired?'+'+paired.format_id:'');
  const estimatedBytes=size(f)&&(!paired||size(paired))?size(f)+(paired?size(paired):0):0;
  const score=(container==='mp4'?10000:0)+(audio(f)?2000:0)+(/^(?:avc1|h264)/i.test(f.vcodec)?1000:0)+fps*5+(Number(f.tbr)||0)/10;
  const key=[resolution,fps>=50?fps:0,hdr].join(':'),choice={id,label,resolution,fps,hdr,container,estimatedBytes,estimated:Boolean(!f.filesize||paired&&!paired.filesize),hasAudio:audio(f)||Boolean(paired),width:Number(f.width),height:Number(f.height),streams:[f,...paired?[paired]:[]].map(item=>({id:item.format_id,bytes:size(item)})),score};
  if(!grouped.has(key)||grouped.get(key).score<score)grouped.set(key,choice);
 }
 return [...grouped.values()].sort((a,b)=>b.resolution-a.resolution||b.fps-a.fps||Number(b.hdr)-Number(a.hdr)).map(({score,...choice})=>choice);
}
export function cookieText(cookies=[]){
 const lines=['# Netscape HTTP Cookie File'];
 for(const cookie of cookies){
  if(!/^(?:\.)?(?:[a-z0-9-]+\.)*youtube\.com$/i.test(cookie.domain||'')||/[\t\r\n\0]/.test((cookie.name||'')+(cookie.value||'')+(cookie.path||'')))continue;
  const domain=(cookie.httpOnly?'#HttpOnly_':'')+cookie.domain;
  lines.push([domain,cookie.domain.startsWith('.')?'TRUE':'FALSE',cookie.path||'/',cookie.secure?'TRUE':'FALSE',Math.floor(cookie.expirationDate||0),cookie.name,cookie.value].join('\t'));
 }
 return lines.length>1?lines.join('\n')+'\n':'';
}
export function safeError(stderr=''){
 if(/confirm.*not a bot|sign in|login|cookies.*expired/i.test(stderr))return 'YouTube yêu cầu xác minh phiên đăng nhập. Đăng nhập YouTube rồi thử lại.';
 if(/requested format.*not available/i.test(stderr))return 'Chất lượng này không còn khả dụng. Mở lại danh sách rồi chọn lại.';
 if(/HTTP Error (\d{3})/.test(stderr))return 'YouTube từ chối tải (HTTP '+stderr.match(/HTTP Error (\d{3})/)[1]+'). Thử lại hoặc chọn chất lượng khác.';
 if(/private video|members.only|not available|removed|copyright|unavailable/i.test(stderr))return 'Video không khả dụng với tài khoản hiện tại.';
 if(/no space|disk full|not enough space/i.test(stderr))return 'Ổ đĩa không đủ dung lượng để tải và ghép video.';
 return 'Không tải được dữ liệu YouTube. Thử lại sau.';
}
