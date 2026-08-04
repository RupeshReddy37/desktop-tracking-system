$ErrorActionPreference = "Stop"

$workdir = $PSScriptRoot
. (Join-Path $workdir "local-server-common.ps1")

$env:DB_URL = "jdbc:postgresql://localhost:5432/tracking_server"
$env:DB_USERNAME = "tracking_admin"
$env:DB_PASSWORD = "tracking_password"
$env:SERVER_PORT = "8081"
$env:TRACKING_AGENT_REGISTRATION_TOKEN = "dev-registration-token"
$env:TRACKING_DEMO_DATA_ENABLED = "false"

$port = [int] $env:SERVER_PORT
$jar = Join-Path $workdir "target\tracking-server-0.0.1-SNAPSHOT.jar"
$out = Join-Path $workdir "server-verify.out.log"
$err = Join-Path $workdir "server-verify.err.log"
$pidFile = Join-Path $workdir "server-verify.pid"

if (-not (Test-Path -LiteralPath $jar)) {
    throw "tracking-server jar not found at $jar. Run .\mvnw.cmd -DskipTests package first."
}

Assert-TrackingServerPortAvailable -Port $port -JarPath $jar -PidFile $pidFile
$proc = Start-TrackingServerJava -JarPath $jar -WorkingDirectory $workdir -Port $port -OutLog $out -ErrLog $err -PidFile $pidFile
Write-Output $proc.Id
