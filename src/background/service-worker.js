import {YouTubeDownloads,youtubeSender} from './youtube.js';
import {sanitizeError} from '../shared/errors.js';

const downloads=new YouTubeDownloads();
const sameExtension=sender=>sender?.id===chrome.runtime.id;
const extensionUI=sender=>sameExtension(sender)&&typeof sender.url==='string'&&sender.url.startsWith(chrome.runtime.getURL(''));
function requireYouTube(sender){if(!sameExtension(sender)||!youtubeSender(sender))throw Error('Chỉ trang YouTube được dùng LP YouTube Downloader.');}
function requireId(value){if(typeof value!=='string'||value.length>100)throw Error('Yêu cầu không hợp lệ.');}

chrome.runtime.onMessage.addListener((message,sender,respond)=>{
  if(!sameExtension(sender))return false;
  const run=async()=>{
    const type=message?.type;
    if(['youtube:info','youtube:download','youtube:cancel','youtube:jobs'].includes(type))requireYouTube(sender);
    if(type==='youtube:open-folder'&&!youtubeSender(sender)&&!extensionUI(sender))throw Error('Nguồn mở thư mục không hợp lệ.');
    if(type==='youtube:info')return {info:await downloads.info(message.videoId)};
    if(type==='youtube:download')return {job:await downloads.start(message.videoId,message.choiceId,sender)};
    if(type==='youtube:cancel'){requireId(message.jobId);await downloads.cancel(message.jobId);return {};}
    if(type==='youtube:jobs')return {jobs:await downloads.list()};
    if(type==='youtube:open-folder'){await downloads.openFolder();return {};}
    throw Error('Yêu cầu LP YouTube Downloader không được hỗ trợ.');
  };
  Promise.resolve().then(run).then(value=>respond({ok:true,...value})).catch(error=>respond({ok:false,error:sanitizeError(error)}));
  return true;
});

chrome.runtime.onInstalled.addListener(()=>downloads.ready.catch(()=>{}));
