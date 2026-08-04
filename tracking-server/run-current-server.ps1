$ErrorActionPreference = "Stop"

$workdir = $PSScriptRoot
. (Join-Path $workdir "local-server-common.ps1")

$env:DB_URL = "jdbc:postgresql://localhost:5432/tracking_server"
$env:DB_USERNAME = "tracking_admin"
$env:DB_PASSWORD = "tracking_password"
$env:SERVER_PORT = "8081"

Set-Location $workdir

& .\mvnw.cmd -DskipTests package

$port = [int] $env:SERVER_PORT
$jar = Join-Path $workdir "target\tracking-server-0.0.1-SNAPSHOT.jar"
$out = Join-Path $workdir "server-start.out.log"
$err = Join-Path $workdir "server-start.err.log"
$pidFile = Join-Path $workdir "server-start.pid"

Assert-TrackingServerPortAvailable -Port $port -JarPath $jar -PidFile $pidFile
$proc = Start-TrackingServerJava -JarPath $jar -WorkingDirectory $workdir -Port $port -OutLog $out -ErrLog $err -PidFile $pidFile
Write-Output "tracking-server started on http://localhost:$port with PID $($proc.Id)."
