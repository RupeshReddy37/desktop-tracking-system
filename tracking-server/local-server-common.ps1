$ErrorActionPreference = "Stop"

function Resolve-TrackingServerPath {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Path
    )

    return [System.IO.Path]::GetFullPath($Path)
}

function Get-TrackingServerJavaProcesses {
    param(
        [Parameter(Mandatory = $true)]
        [string] $JarPath
    )

    $resolvedJarPath = (Resolve-TrackingServerPath $JarPath).ToLowerInvariant()
    Get-CimInstance Win32_Process -Filter "Name = 'java.exe'" |
        Where-Object {
            $commandLine = $_.CommandLine
            -not [string]::IsNullOrWhiteSpace($commandLine) -and
                $commandLine.Replace("/", "\").ToLowerInvariant().Contains($resolvedJarPath)
        }
}

function Test-TrackingServerJavaProcess {
    param(
        [Parameter(Mandatory = $true)]
        [int] $ProcessId,

        [Parameter(Mandatory = $true)]
        [string] $JarPath
    )

    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction SilentlyContinue
    if ($null -eq $process -or $process.Name -ne "java.exe") {
        return $false
    }

    $resolvedJarPath = (Resolve-TrackingServerPath $JarPath).ToLowerInvariant()
    $commandLine = $process.CommandLine
    if ([string]::IsNullOrWhiteSpace($commandLine)) {
        return $false
    }

    $commandLine = $commandLine.Replace("/", "\").ToLowerInvariant()
    return $commandLine.Contains($resolvedJarPath)
}

function Get-PortListeningProcesses {
    param(
        [Parameter(Mandatory = $true)]
        [int] $Port
    )

    Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique |
        Where-Object { $_ -gt 0 }
}

function Stop-ProcessAndWait {
    param(
        [Parameter(Mandatory = $true)]
        [int] $ProcessId,

        [int] $TimeoutSeconds = 15
    )

    $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
    if ($null -eq $process) {
        return
    }

    Write-Host "Stopping existing tracking-server process PID $ProcessId..."
    Stop-Process -Id $ProcessId -ErrorAction SilentlyContinue

    try {
        Wait-Process -Id $ProcessId -Timeout $TimeoutSeconds -ErrorAction Stop
    }
    catch {
        if (Get-Process -Id $ProcessId -ErrorAction SilentlyContinue) {
            Write-Host "PID $ProcessId did not stop within $TimeoutSeconds seconds; forcing termination..."
            Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
            Wait-Process -Id $ProcessId -Timeout 5 -ErrorAction SilentlyContinue
        }
    }
}

function Wait-PortToClear {
    param(
        [Parameter(Mandatory = $true)]
        [int] $Port,

        [int] $TimeoutSeconds = 15
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    do {
        $owners = @(Get-PortListeningProcesses -Port $Port)
        if ($owners.Count -eq 0) {
            return
        }

        Start-Sleep -Milliseconds 250
    } while ((Get-Date) -lt $deadline)

    $remainingOwners = @(Get-PortListeningProcesses -Port $Port)
    throw "Port $Port is still in use by PID(s): $($remainingOwners -join ', ')."
}

function Assert-TrackingServerPortAvailable {
    param(
        [Parameter(Mandatory = $true)]
        [int] $Port,

        [Parameter(Mandatory = $true)]
        [string] $JarPath,

        [Parameter(Mandatory = $true)]
        [string] $PidFile
    )

    $resolvedPidFile = Resolve-TrackingServerPath $PidFile
    if (Test-Path -LiteralPath $resolvedPidFile) {
        $pidText = (Get-Content -LiteralPath $resolvedPidFile -ErrorAction SilentlyContinue | Select-Object -First 1)
        $pidValue = 0
        if ([int]::TryParse($pidText, [ref] $pidValue) -and $pidValue -gt 0) {
            if (Test-TrackingServerJavaProcess -ProcessId $pidValue -JarPath $JarPath) {
                Stop-ProcessAndWait -ProcessId $pidValue
            }
        }

        Remove-Item -LiteralPath $resolvedPidFile -Force -ErrorAction SilentlyContinue
    }

    $matchingJavaProcesses = @(Get-TrackingServerJavaProcesses -JarPath $JarPath)
    foreach ($process in $matchingJavaProcesses) {
        Stop-ProcessAndWait -ProcessId $process.ProcessId
    }

    $owners = @(Get-PortListeningProcesses -Port $Port)
    foreach ($owner in $owners) {
        if (Test-TrackingServerJavaProcess -ProcessId $owner -JarPath $JarPath) {
            Stop-ProcessAndWait -ProcessId $owner
        }
    }

    $remainingOwners = @(Get-PortListeningProcesses -Port $Port)
    if ($remainingOwners.Count -gt 0) {
        $ownerDetails = $remainingOwners | ForEach-Object {
            $process = Get-CimInstance Win32_Process -Filter "ProcessId = $_" -ErrorAction SilentlyContinue
            if ($null -eq $process) {
                "PID $_"
            }
            else {
                $command = $process.CommandLine
                if ([string]::IsNullOrWhiteSpace($command)) {
                    $command = $process.Name
                }

                "PID $_ ($command)"
            }
        }

        throw "Port $Port is already in use by a non-tracking-server process: $($ownerDetails -join '; ')"
    }

    Wait-PortToClear -Port $Port
}

function Start-TrackingServerJava {
    param(
        [Parameter(Mandatory = $true)]
        [string] $JarPath,

        [Parameter(Mandatory = $true)]
        [string] $WorkingDirectory,

        [Parameter(Mandatory = $true)]
        [int] $Port,

        [Parameter(Mandatory = $true)]
        [string] $OutLog,

        [Parameter(Mandatory = $true)]
        [string] $ErrLog,

        [Parameter(Mandatory = $true)]
        [string] $PidFile,

        [int] $StartupTimeoutSeconds = 90
    )

    $resolvedJarPath = Resolve-TrackingServerPath $JarPath
    $resolvedWorkingDirectory = Resolve-TrackingServerPath $WorkingDirectory
    $resolvedOutLog = Resolve-TrackingServerPath $OutLog
    $resolvedErrLog = Resolve-TrackingServerPath $ErrLog
    $resolvedPidFile = Resolve-TrackingServerPath $PidFile

    Remove-Item -LiteralPath $resolvedOutLog, $resolvedErrLog -Force -ErrorAction SilentlyContinue

    $arguments = @("-jar", "`"$resolvedJarPath`"")
    $process = Start-Process `
        -FilePath "java.exe" `
        -ArgumentList $arguments `
        -WorkingDirectory $resolvedWorkingDirectory `
        -WindowStyle Hidden `
        -PassThru `
        -RedirectStandardOutput $resolvedOutLog `
        -RedirectStandardError $resolvedErrLog

    Set-Content -LiteralPath $resolvedPidFile -Value $process.Id

    $deadline = (Get-Date).AddSeconds($StartupTimeoutSeconds)
    do {
        if ($process.HasExited) {
            $process.Refresh()
            $exitCode = $process.ExitCode
            if ([string]::IsNullOrWhiteSpace([string] $exitCode)) {
                $exitCode = "unknown"
            }
            Remove-Item -LiteralPath $resolvedPidFile -Force -ErrorAction SilentlyContinue

            $tail = @()
            if (Test-Path -LiteralPath $resolvedOutLog) {
                $tail += Get-Content -LiteralPath $resolvedOutLog -Tail 40 -ErrorAction SilentlyContinue
            }
            if (Test-Path -LiteralPath $resolvedErrLog) {
                $tail += Get-Content -LiteralPath $resolvedErrLog -Tail 40 -ErrorAction SilentlyContinue
            }

            throw "tracking-server exited during startup with code $exitCode. Recent log output:`n$($tail -join [Environment]::NewLine)"
        }

        $owners = @(Get-PortListeningProcesses -Port $Port)
        if ($owners -contains $process.Id) {
            return $process
        }

        Start-Sleep -Milliseconds 500
        $process.Refresh()
    } while ((Get-Date) -lt $deadline)

    Stop-ProcessAndWait -ProcessId $process.Id
    Remove-Item -LiteralPath $resolvedPidFile -Force -ErrorAction SilentlyContinue
    throw "tracking-server PID $($process.Id) did not start listening on port $Port within $StartupTimeoutSeconds seconds. See $resolvedOutLog and $resolvedErrLog."
}
