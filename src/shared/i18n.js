const messages={
  vi:{
    'Tải video':'Tải video','Đóng menu tải':'Đóng menu tải','Chọn chất lượng':'Chọn chất lượng',
    'Dừng':'Dừng','Tiến trình tải video':'Tiến trình tải video','Đang chờ':'Đang chờ',
    'Đang chuẩn bị':'Đang chuẩn bị','Đang tải':'Đang tải','Đang ghép hình và tiếng':'Đang ghép hình và tiếng',
    'Đã lưu vào Tải xuống':'Đã lưu vào Tải xuống','Đã dừng tải':'Đã dừng tải',
    'Tải không thành công.':'Tải không thành công.','Tải video YouTube':'Tải video YouTube',
    'Tải video YouTube {id}':'Tải video YouTube {id}','Tải {quality} {container}':'Tải {quality} {container}',
    'Đang lấy chất lượng…':'Đang lấy chất lượng…','Đang chuẩn bị tải…':'Đang chuẩn bị tải…','Mở thư mục':'Mở thư mục','Mở thư mục tải':'Mở thư mục tải','Đang mở thư mục…':'Đang mở thư mục…'
  },
  en:{
    'Tải video':'Download','Đóng menu tải':'Close download menu','Chọn chất lượng':'Choose quality',
    'Dừng':'Cancel','Tiến trình tải video':'Video download progress','Đang chờ':'Queued',
    'Đang chuẩn bị':'Preparing','Đang tải':'Downloading','Đang ghép hình và tiếng':'Muxing video and audio',
    'Đã lưu vào Tải xuống':'Saved to Downloads','Đã dừng tải':'Download cancelled',
    'Tải không thành công.':'Download failed.','Tải video YouTube':'Download YouTube video',
    'Tải video YouTube {id}':'Download YouTube video {id}','Tải {quality} {container}':'Download {quality} {container}',
    'Đang lấy chất lượng…':'Loading qualities…','Đang chuẩn bị tải…':'Preparing download…','Mở thư mục':'Open folder','Mở thư mục tải':'Open download folder','Đang mở thư mục…':'Opening folder…'
  }
};
let language='vi';const subscribers=new Set();
export function getLanguage(){return language;}
export function getLocale(){return language==='en'?'en-US':'vi-VN';}
export function t(key,vars={}){let value=messages[language]?.[key]||key;return String(value).replace(/\{(\w+)\}/g,(_,name)=>vars[name]??`{${name}}`);}
export function subscribeLanguage(callback){subscribers.add(callback);return()=>subscribers.delete(callback);}
export async function initializeLanguage(){try{const value=await chrome.storage.local.get('APP_LANGUAGE');language=value.APP_LANGUAGE==='en'?'en':'vi';}catch{language='vi';}return language;}
export function setLanguage(value){language=value==='en'?'en':'vi';for(const callback of subscribers){try{callback(language);}catch{}}}
if(typeof chrome!=='undefined'&&chrome.storage?.onChanged)chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.APP_LANGUAGE){setLanguage(changes.APP_LANGUAGE.newValue);}});
