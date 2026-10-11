// Project only metadata needed to offer the existing quality choices.
export const INFO_TEMPLATE='{"title":%(title)j,"duration":%(duration)j,"is_live":%(is_live)j,"live_status":%(live_status)j,"formats":%(formats.:.{format_id,url,ext,width,height,fps,vcodec,acodec,filesize,filesize_approx,format_note,dynamic_range,has_drm,abr,tbr,language_preference})j}';
export function progressEmitter(send,{now=Date.now,interval=350}={}){
 let previousState,previousPercent,lastEvent=-Infinity;
 return (state,percent)=>{
  if(state===previousState&&percent===previousPercent)return false;
  const time=now();if(state==='downloading'&&time-lastEvent<interval)return false;
  previousState=state;previousPercent=percent;lastEvent=time;send(state,percent);return true;
 };
}
