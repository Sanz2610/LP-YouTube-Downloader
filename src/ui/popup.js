const github=document.querySelector('#github'),status=document.querySelector('#status'),version=document.querySelector('#version');
const manifest=chrome.runtime.getManifest();version.textContent=`Version ${manifest.version}`;
const GITHUB_URL='https://github.com/Sanz2610/LP-YouTube-Downloader';
github.addEventListener('click',()=>chrome.tabs.create({url:GITHUB_URL}));
