param(
  [ValidatePattern('^[a-p]{32}$')][string]$ExtensionId='hlokfmjpeehmmimkggeoppoliknkpacb',
  [ValidateSet('edge','chrome','both')][string]$Browser='edge',
  [string]$StoreUrl='',
  [switch]$OpenBrowser
)
$ErrorActionPreference='Stop'
$payloadRoot=Split-Path -Parent $PSScriptRoot
$installRoot=Join-Path $env:LOCALAPPDATA 'LP YouTube Downloader'
New-Item -ItemType Directory -Force -Path $installRoot | Out-Null
if((Resolve-Path $payloadRoot).Path.TrimEnd('\') -ne (Resolve-Path $installRoot).Path.TrimEnd('\')){
  foreach($name in @('helper','extension','installer','manifest.json','README.md','THIRD_PARTY.md')){
    $source=Join-Path $payloadRoot $name;if(Test-Path -LiteralPath $source){Copy-Item -LiteralPath $source -Destination $installRoot -Recurse -Force}
  }
}
$installScript=Join-Path $installRoot 'installer\install.ps1'
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $installScript -ExtensionId $ExtensionId
if($StoreUrl){Start-Process $StoreUrl}elseif($OpenBrowser){
  function Find-Browser([string]$name){
    $paths=if($name -eq 'edge'){@("$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe","${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe","$env:LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe")}else{@("$env:ProgramFiles\Google\Chrome\Application\chrome.exe","${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe","$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe")}
    return $paths|Where-Object {Test-Path -LiteralPath $_}|Select-Object -First 1
  }
  $targets=@();if($Browser -in @('edge','both')){$exe=Find-Browser 'edge';if($exe){$targets+=[pscustomobject]@{Exe=$exe;Url='edge://extensions/'}}};if($Browser -in @('chrome','both')){$exe=Find-Browser 'chrome';if($exe){$targets+=[pscustomobject]@{Exe=$exe;Url='chrome://extensions/'}}}
  foreach($target in $targets){try{Start-Process -FilePath $target.Exe -ArgumentList $target.Url}catch{}}
  if(!$targets){Write-Output 'Edge or Chrome was not found. Open the Extensions page manually.'}else{Write-Output "Helper installed. Load unpacked from: $installRoot\extension"}
}else{Write-Output "Helper installed. Open Edge and load unpacked from: $installRoot\extension"}
Write-Output "LP YouTube Downloader installation complete: $installRoot"
