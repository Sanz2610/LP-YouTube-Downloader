param([ValidatePattern('^[a-p]{32}$')][string]$ExtensionId='hlokfmjpeehmmimkggeoppoliknkpacb')
$ErrorActionPreference='Stop'
$projectRoot=Split-Path -Parent $PSScriptRoot
$helperRoot=Join-Path $projectRoot 'helper'
$hostName='com.lp.youtube_downloader'
$configPath=Join-Path $helperRoot 'config.json'
$manifestPath=Join-Path $helperRoot 'native-host.json'
$bridge=Join-Path $helperRoot 'native-bridge.exe'
$script=Join-Path $helperRoot 'youtube-host.mjs'
$ytdlp=Join-Path $helperRoot 'tools\yt-dlp.exe'
$ffmpegDir=Join-Path $helperRoot 'tools\ffmpeg'
$bundledNode=Join-Path $helperRoot 'runtime\node.exe'
if(Test-Path -LiteralPath $bundledNode){$node=$bundledNode}else{$node=(Get-Command node.exe -ErrorAction SilentlyContinue).Source;if(!$node -and (Test-Path "$env:ProgramFiles\nodejs\node.exe")){$node="$env:ProgramFiles\nodejs\node.exe"}}
if(!$node){throw 'Node.js runtime was not found.'}
foreach($file in @($script,$ytdlp,$bridge,(Join-Path $helperRoot 'folder-opener.exe'))){if(!(Test-Path -LiteralPath $file)){throw "Missing helper file: $file"}}
foreach($file in @('ffmpeg.exe','ffprobe.exe')){if(!(Test-Path -LiteralPath (Join-Path $ffmpegDir $file))){throw "Missing FFmpeg runtime: $file"}}
$downloads=(New-Object -ComObject Shell.Application).NameSpace('shell:Downloads').Self.Path
$registrySubkeys=@("Software\Microsoft\Edge\NativeMessagingHosts\$hostName","Software\Google\Chrome\NativeMessagingHosts\$hostName","Software\Chromium\NativeMessagingHosts\$hostName")
$records=@()
try {
  foreach($subkey in $registrySubkeys){$base=[Microsoft.Win32.RegistryKey]::OpenBaseKey([Microsoft.Win32.RegistryHive]::CurrentUser,[Microsoft.Win32.RegistryView]::Default);try{$key=$base.OpenSubKey($subkey);if($key){try{$records+= [pscustomobject]@{Subkey=$subkey;Value=$key.GetValue('')}}finally{$key.Dispose()}}}finally{$base.Dispose()}}
  foreach($record in $records){if($record.Value -and $record.Value -ne $manifestPath){throw "Native host $hostName belongs to another helper; no changes were made."}}
  $utf8=New-Object System.Text.UTF8Encoding($false)
  $config=[ordered]@{node=$node;hostScript=$script;ytdlp=$ytdlp;ffmpegDir=$ffmpegDir;downloadsDir=$downloads;allowedOrigins=@("chrome-extension://$ExtensionId/")}
  [IO.File]::WriteAllText($configPath,($config|ConvertTo-Json -Depth 5),$utf8)
  $manifest=[ordered]@{name=$hostName;description='LP YouTube Downloader native helper';path=$bridge;type='stdio';allowed_origins=@("chrome-extension://$ExtensionId/")}
  [IO.File]::WriteAllText($manifestPath,($manifest|ConvertTo-Json -Depth 5),$utf8)
  foreach($subkey in $registrySubkeys){$base=[Microsoft.Win32.RegistryKey]::OpenBaseKey([Microsoft.Win32.RegistryHive]::CurrentUser,[Microsoft.Win32.RegistryView]::Default);try{$key=$base.CreateSubKey($subkey);try{$key.SetValue('',$manifestPath,[Microsoft.Win32.RegistryValueKind]::String)}finally{$key.Dispose()}}finally{$base.Dispose()}}
  Write-Output "Registered $hostName for extension $ExtensionId."
} catch {
  foreach($subkey in $registrySubkeys){$base=[Microsoft.Win32.RegistryKey]::OpenBaseKey([Microsoft.Win32.RegistryHive]::CurrentUser,[Microsoft.Win32.RegistryView]::Default);try{$key=$base.OpenSubKey($subkey,$true);if($key){try{$current=$key.GetValue('');if($records.Subkey -contains $subkey){$previous=($records|Where-Object Subkey -eq $subkey).Value;if($previous){$key.SetValue('',$previous,[Microsoft.Win32.RegistryValueKind]::String)}else{$base.DeleteSubKey($subkey,$false)}}elseif($current -eq $manifestPath){$base.DeleteSubKey($subkey,$false)}}finally{$key.Dispose()}}}finally{$base.Dispose()}}
  throw
}
