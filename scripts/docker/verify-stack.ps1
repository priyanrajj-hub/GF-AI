# ==============================================================================
# GF-AI Docker Stack Validation Script (PowerShell)
# ==============================================================================
Write-Host "=================================================="
Write-Host "GF-AI Docker Stack Architecture Verification"
Write-Host "=================================================="

$dockerAvailable = Get-Command docker -ErrorAction SilentlyContinue

if (-not $dockerAvailable) {
    Write-Host "⚠️ Docker command-line not found in current session. Running AST verification..." -ForegroundColor Yellow
    node scripts/docker/verify_docker_compose.mjs
    exit 0
}

$env:POSTGRES_PASSWORD = "test_verification_secret_postgres"
$env:JWT_SECRET = "test_verification_jwt_secret_min_32_chars_1234"
$env:REFRESH_SECRET = "test_verification_refresh_secret_min_32_chars_5678"

Write-Host "Checking docker-compose.yml syntax..."
docker compose -f docker-compose.yml config --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Error "docker-compose.yml validation failed"
    exit 1
}

Write-Host "Checking docker-compose.dev.yml syntax..."
docker compose -f docker-compose.yml -f docker-compose.dev.yml config --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Error "docker-compose.dev.yml validation failed"
    exit 1
}

Write-Host "✅ Docker Compose stack configurations verified successfully." -ForegroundColor Green
