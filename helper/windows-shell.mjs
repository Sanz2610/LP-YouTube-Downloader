import fs from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';

const run=promisify(execFile);
const FOLDER_ERROR='Không mở được thư mục tải. Kiểm tra thư mục Downloads rồi thử lại.';

// The path comes from the installed helper configuration, never from a page message.
export async function openDownloadFolder(directory,{execute=run,stat=fs.stat,windowsRoot=process.env.WINDIR}={}){
  try{
    if(typeof directory!=='string'||!path.win32.isAbsolute(directory)||directory.includes('\0'))throw Error();
    const folder=path.win32.normalize(directory);
    if(!(await stat(folder)).isDirectory())throw Error();
    const literal=folder.replaceAll("'","''");
    // Hide only the PowerShell console. ShellExecute's final argument explicitly shows Explorer.
    const script=`$ErrorActionPreference='Stop';$shell=New-Object -ComObject Shell.Application;$shell.ShellExecute('${literal}','','','open',1)`;
    const encoded=Buffer.from(script,'utf16le').toString('base64');
    await execute(path.win32.join(windowsRoot,'System32/WindowsPowerShell/v1.0/powershell.exe'),['-NoProfile','-NonInteractive','-EncodedCommand',encoded],{windowsHide:true,timeout:10000,maxBuffer:64*1024});
  }catch{throw Error(FOLDER_ERROR);}
}
