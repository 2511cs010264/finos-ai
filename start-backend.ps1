# PowerShell Script to Start FinOS Spring Boot Backend
$backendDir = Join-Path $PSScriptRoot "backend"
if (Test-Path (Join-Path $backendDir "pom.xml")) {
    Write-Host "🚀 Starting FinOS Spring Boot MySQL Backend..." -ForegroundColor Green
    Set-Location $backendDir
    mvn spring-boot:run
} else {
    Write-Host "❌ Error: pom.xml not found in $backendDir" -ForegroundColor Red
}
