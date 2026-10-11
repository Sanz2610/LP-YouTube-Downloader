export const VIDEO_ID=/^[A-Za-z0-9_-]{11}$/;
export function youtubeVideoId(value){try{const url=new URL(value,'https://www.youtube.com');if(!['www.youtube.com','m.youtube.com'].includes(url.hostname))return '';const id=url.pathname==='/watch'?url.searchParams.get('v'):url.pathname.match(/^\/shorts\/([^/]+)/)?.[1];return VIDEO_ID.test(id||'')?id:'';}catch{return '';}}
export function assertVideoId(value){if(!VIDEO_ID.test(value||''))throw Error('Video YouTube không hợp lệ.');return value;}
