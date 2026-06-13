$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$url = "http://localhost:3000"
$serverProcess = $null
$startedServer = $false

function Test-LocalServer {
  try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -ge 200
  } catch {
    return $false
  }
}

if (-not (Test-LocalServer)) {
  $outLog = Join-Path $env:TEMP "lm-health-playwright-dev-$PID.out.log"
  $errLog = Join-Path $env:TEMP "lm-health-playwright-dev-$PID.err.log"

  $serverProcess = Start-Process `
    -FilePath "npx.cmd" `
    -ArgumentList "next", "dev", "--hostname", "localhost" `
    -WorkingDirectory $root `
    -WindowStyle Hidden `
    -RedirectStandardOutput $outLog `
    -RedirectStandardError $errLog `
    -PassThru

  $startedServer = $true
  $deadline = (Get-Date).AddSeconds(120)

  while ((Get-Date) -lt $deadline) {
    if (Test-LocalServer) {
      break
    }

    Start-Sleep -Seconds 2
  }

  if (-not (Test-LocalServer)) {
    if ($serverProcess -and -not $serverProcess.HasExited) {
      Stop-Process -Id $serverProcess.Id -Force
    }

    Write-Error "Next dev server did not start at $url within 120 seconds."
  }
}

try {
  Push-Location $root
  & npx.cmd playwright test
  $exitCode = $LASTEXITCODE
} finally {
  Pop-Location

  if ($startedServer -and $serverProcess -and -not $serverProcess.HasExited) {
    Stop-Process -Id $serverProcess.Id -Force
  }
}

exit $exitCode
