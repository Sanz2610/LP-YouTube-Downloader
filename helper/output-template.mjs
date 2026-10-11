import fs from 'node:fs/promises';

// Repeated downloads get a separate filename; yt-dlp still never overwrites an existing video.
export async function outputTemplate(directory,videoId,choice){
  const names=(await fs.readdir(directory)).map(name=>name.toLowerCase());
  const tail=` [${videoId}] ${choice.label}`;
  let number=1,suffix='';
  while(names.some(name=>name.endsWith(`${tail}${suffix}.${choice.container}`.toLowerCase()))){number++;suffix=` (${number})`;}
  return `%(title).150B [%(id)s] ${choice.label}${suffix}.%(ext)s`;
}
