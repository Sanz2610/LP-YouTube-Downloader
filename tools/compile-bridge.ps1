$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$compiler=Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
if(!(Test-Path -LiteralPath $compiler)){throw 'The Windows .NET Framework C# compiler was not found.'}
$source=Join-Path $root 'helper/NativeBridge.cs'
$output=Join-Path $root 'helper/native-bridge.exe'
& $compiler /nologo /target:winexe "/out:$output" /reference:System.Web.Extensions.dll $source
if($LASTEXITCODE -ne 0){throw 'Native bridge compilation failed.'}
Write-Output 'Compiled native-bridge.exe from the included C# source.'
