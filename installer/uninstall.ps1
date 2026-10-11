$ErrorActionPreference='Stop'
$projectRoot=Split-Path -Parent $PSScriptRoot;$helperRoot=Join-Path $projectRoot 'helper';$hostName='com.lp.youtube_downloader';$manifestPath=Join-Path $helperRoot 'native-host.json'
$registrySubkeys=@("Software\Microsoft\Edge\NativeMessagingHosts\$hostName","Software\Google\Chrome\NativeMessagingHosts\$hostName","Software\Chromium\NativeMessagingHosts\$hostName")
$found=@()
foreach($subkey in $registrySubkeys){$base=[Microsoft.Win32.RegistryKey]::OpenBaseKey([Microsoft.Win32.RegistryHive]::CurrentUser,[Microsoft.Win32.RegistryView]::Default);try{$key=$base.OpenSubKey($subkey);if($key){try{$found+=[pscustomobject]@{Subkey=$subkey;Value=$key.GetValue('')}}finally{$key.Dispose()}}}finally{$base.Dispose()}}
foreach($item in $found){if($item.Value -ne $manifestPath){throw "Native host $hostName does not point to this helper; nothing was removed."}}
foreach($item in $found){$base=[Microsoft.Win32.RegistryKey]::OpenBaseKey([Microsoft.Win32.RegistryHive]::CurrentUser,[Microsoft.Win32.RegistryView]::Default);try{$base.DeleteSubKey($item.Subkey,$false)}finally{$base.Dispose()}}
$managedRoot=Join-Path $env:LOCALAPPDATA 'LP YouTube Downloader'
if([IO.Path]::GetFullPath($projectRoot).TrimEnd('\') -eq [IO.Path]::GetFullPath($managedRoot).TrimEnd('\')){
  $cleanup=Join-Path $env:TEMP "lp-youtube-uninstall-$PID.cmd"
  $lines=@('@echo off','ping 127.0.0.1 -n 3 >nul',('rmdir /s /q "'+$projectRoot+'"'),'del /q "%~f0"')
  [IO.File]::WriteAllLines($cleanup,$lines,[Text.Encoding]::ASCII)
  Start-Process -FilePath $env:ComSpec -ArgumentList @('/d','/c',('"'+$cleanup+'"')) -WindowStyle Hidden
  Write-Output "Removed $hostName registration. AppData cleanup scheduled; downloaded videos were kept."
}else{Write-Output "Removed $hostName registration. Helper files and downloaded videos were kept."}
