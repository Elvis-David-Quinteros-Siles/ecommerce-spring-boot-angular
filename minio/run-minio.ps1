# Crea/arranca el contenedor MinIO del ecommerce FUERA del docker compose.
# Uso (desde la raiz del proyecto):  powershell -ExecutionPolicy Bypass -File .\minio\run-minio.ps1
$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
$envVars = @{}
Get-Content (Join-Path $root ".env") | Where-Object { $_ -match '^\s*[^#].*=' } | ForEach-Object {
    $k, $v = $_ -split '=', 2
    $envVars[$k.Trim()] = $v.Trim()
}

$name    = $envVars["MINIO_CONTAINER"]
$network = $envVars["MINIO_NETWORK"]
$image   = "pgsty/minio:RELEASE.2026-08-04T00-00-00Z"

# Red compartida con el backend (el compose la usa como external)
docker network inspect $network *> $null
if ($LASTEXITCODE -ne 0) { docker network create $network | Out-Null; Write-Host "Red creada: $network" }

docker container inspect $name *> $null
if ($LASTEXITCODE -eq 0) {
    docker start $name | Out-Null
    Write-Host "Contenedor $name ya existia: iniciado."
    exit 0
}

docker run -d `
    --name $name `
    --restart unless-stopped `
    --network $network `
    -p "127.0.0.1:$($envVars["MINIO_CONSOLE_PORT"]):9001" `
    -e "MINIO_ROOT_USER=$($envVars["MINIO_ROOT_USER"])" `
    -e "MINIO_ROOT_PASSWORD=$($envVars["MINIO_ROOT_PASSWORD"])" `
    -v ecommerce-minio-data:/data `
    --health-cmd "mc ready local" `
    --health-interval 15s --health-timeout 5s --health-retries 5 `
    $image server /data --console-address ":9001" | Out-Null

Write-Host "MinIO '$name' creado. Consola: http://localhost:$($envVars["MINIO_CONSOLE_PORT"])"
