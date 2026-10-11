param([string]$MediaSweepPath='C:\Users\ADMIN\Desktop\Media Sweep')
$ErrorActionPreference='Stop'
if(!(Test-Path -LiteralPath (Join-Path $MediaSweepPath '.git'))){throw 'Media Sweep is not a Git worktree.'}
$status=& git -C $MediaSweepPath status --porcelain
if($LASTEXITCODE -ne 0){throw 'Could not read Media Sweep status.'}
if($status){Write-Output $status;throw 'Media Sweep has local changes.'}
Write-Output "Media Sweep clean: $(git -C $MediaSweepPath rev-parse HEAD)"
