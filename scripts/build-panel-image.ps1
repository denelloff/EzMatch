# Build ez-panel image and pack a transferable tarball.
# Requires Docker Desktop / docker CLI on PATH.
param(
  [string]$Tag = "ez-panel:0.1.0",
  [string]$OutDir = ""
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
if (-not $OutDir) { $OutDir = Join-Path $Root "dist-images" }
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$Tar = Join-Path $OutDir "ez-panel-0.1.0.tar"

Set-Location $Root

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Error "docker not found on PATH. Install Docker Desktop (or build on the server with scripts/build-panel-image.sh)."
}

Write-Host "==> docker build $Tag"
docker build -f Dockerfile.panel -t $Tag .

Write-Host "==> docker save -> $Tar"
docker save -o $Tar $Tag

Write-Host "Done."
Write-Host "  Image: $Tag"
Write-Host "  File:  $Tar"
Write-Host ""
Write-Host "On the server:"
Write-Host "  docker load -i ez-panel-0.1.0.tar"
Write-Host "  # use .env.panel with DATABASE_URL ...@128.0.141.214:3306/..."
Write-Host "  docker compose -f docker-compose.panel.yml --env-file .env.panel up -d"
