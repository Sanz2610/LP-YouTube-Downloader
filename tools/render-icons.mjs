import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
const root=path.resolve(import.meta.dirname,'..');
const source=await fs.readFile(path.join(root,'assets/icons/lucide/download.svg'),'utf8');
const svg=source.replace('width="24"','x="22" width="84"').replace('height="24"','y="22" height="84"').replace('stroke="currentColor"','stroke="#fff"');
const brand=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><circle cx="64" cy="64" r="62" fill="#e5092f"/>${svg}</svg>\n`;
await fs.writeFile(path.join(root,'assets/icon.svg'),brand);
const browser=await chromium.launch({channel:'msedge',headless:true});
try{const page=await browser.newPage();for(const size of [16,32,48,128]){await page.setContent(`<style>body{margin:0;background:transparent}#icon{width:${size}px;height:${size}px}#icon>svg{display:block;width:100%;height:100%}</style><div id="icon">${brand}</div>`);await page.locator('#icon').screenshot({path:path.join(root,`assets/icon${size}.png`),omitBackground:true});}}
finally{await browser.close();}
console.log('Manifest PNGs and popup SVG rendered from the same Lucide download asset.');
