import fs from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';

const run=promisify(execFile);
const FOLDER_ERROR='Không mở được thư mục tải. Kiểm tra thư mục Downloads rồi thử lại.';

// OpenFolder.exe reads the installed configuration itself; no page path or shell command is accepted.
export async function openDownloadFolder(directory,{execute=run,stat=fs.stat,opener=path.join(import.meta.dirname,'folder-opener.exe')}={}){
  try{
    if(typeof directory!=='string'||!path.win32.isAbsolute(directory)||directory.includes('\0'))throw Error();
    const folder=path.win32.normalize(directory);
    if(!(await stat(folder)).isDirectory())throw Error();
    await execute(opener,[],{windowsHide:false,timeout:2500,maxBuffer:16*1024});
  }catch{throw Error(FOLDER_ERROR);}
}
