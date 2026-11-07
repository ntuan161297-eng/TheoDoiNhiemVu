# Optional local-only workaround for this machine's old VC++ runtime.
# Copies signed Microsoft libraries already installed with Edge. Never installs
# redistributables, changes registry/PATH, modifies Windows, or downloads DLLs.
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$runtimeDirectory = Join-Path $projectRoot '.local\cloudflare\workerd-runtime'
$nativeRuntime = Join-Path $projectRoot 'node_modules\@cloudflare\workerd-windows-64\bin\workerd.exe'
if (-not (Test-Path -LiteralPath $nativeRuntime)) { throw 'Run npm ci first; Windows x64 workerd binary not found.' }
$edgeRoot = Join-Path ${env:ProgramFiles(x86)} 'Microsoft\Edge\Application'
$candidateDirectories = @()
if ($env:CLOUDFLARE_VC_RUNTIME_DIR) { $candidateDirectories += $env:CLOUDFLARE_VC_RUNTIME_DIR }
if (Test-Path -LiteralPath $edgeRoot) {
  $candidateDirectories += @(Get-ChildItem -LiteralPath $edgeRoot -Directory | Where-Object { $_.Name -match '^\d+(\.\d+)+$' } |
    Sort-Object { [version]$_.Name } -Descending | Select-Object -ExpandProperty FullName)
}
$sourceDirectory = $candidateDirectories | Where-Object {
  (Test-Path -LiteralPath (Join-Path $_ 'vcruntime140.dll')) -and
  (Test-Path -LiteralPath (Join-Path $_ 'vcruntime140_1.dll')) -and
  (Test-Path -LiteralPath (Join-Path $_ 'msvcp140.dll'))
} | Select-Object -First 1
if (-not $sourceDirectory) { throw 'No complete local Microsoft runtime found. Use a supported Windows 11/Linux machine; no system install was attempted.' }
New-Item -ItemType Directory -Path $runtimeDirectory -Force | Out-Null
$runtimeFiles = @()
function Copy-VerifiedLocalFile([string]$Source, [string]$Name) {
  $destination = Join-Path $runtimeDirectory $Name
  $sourceHash = (Get-FileHash -LiteralPath $Source -Algorithm SHA256).Hash.ToLowerInvariant()
  if (-not (Test-Path -LiteralPath $destination) -or (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash.ToLowerInvariant() -ne $sourceHash) {
    Copy-Item -LiteralPath $Source -Destination $destination
  }
  return [pscustomobject]@{name=$Name;sha256=$sourceHash}
}
$runtimeFiles += Copy-VerifiedLocalFile $nativeRuntime 'workerd.exe'
foreach ($name in @('vcruntime140.dll','vcruntime140_1.dll','msvcp140.dll','msvcp140_1.dll','msvcp140_2.dll','msvcp140_atomic_wait.dll','msvcp140_codecvt_ids.dll','concrt140.dll')) {
  $source = Join-Path $sourceDirectory $name
  if (-not (Test-Path -LiteralPath $source)) { continue }
  $signature = Get-AuthenticodeSignature -LiteralPath $source
  if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notmatch 'Microsoft') { throw ('Untrusted Microsoft runtime file: ' + $name) }
  $runtimeFiles += Copy-VerifiedLocalFile $source $name
}
$manifest = [pscustomobject]@{
  purpose='Local development only; not distributed or deployed'
  dllVersion=(Get-Item -LiteralPath (Join-Path $sourceDirectory 'msvcp140.dll')).VersionInfo.FileVersion
  files=$runtimeFiles
}
[IO.File]::WriteAllText((Join-Path $runtimeDirectory 'manifest.json'),($manifest | ConvertTo-Json -Depth 4),[Text.UTF8Encoding]::new($false))
Write-Output ('Project-local workerd runtime prepared: ' + $runtimeDirectory)
Write-Output ('Microsoft DLL version: ' + $manifest.dllVersion)
Write-Output 'Windows/System32/registry/PATH unchanged. No DLLs will be committed.'
