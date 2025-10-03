# LabFlow Clinic - NSIS Installer Script
# Script for downloading and installing NSIS

Write-Host "Installing NSIS for creating installer..." -ForegroundColor Green

# สร้างโฟลเดอร์ temp
$tempDir = "$env:TEMP\nsis-install"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

try {
    # Download NSIS
    Write-Host "Downloading NSIS..." -ForegroundColor Yellow
    $nsisUrl = "https://sourceforge.net/projects/nsis/files/NSIS%203/3.09/nsis-3.09-setup.exe/download"
    $nsisInstaller = "$tempDir\nsis-setup.exe"
    
    Invoke-WebRequest -Uri $nsisUrl -OutFile $nsisInstaller -UseBasicParsing
    
    if (Test-Path $nsisInstaller) {
        Write-Host "NSIS download completed" -ForegroundColor Green
        
        # Run installer
        Write-Host "Installing NSIS..." -ForegroundColor Yellow
        Write-Host "Please click 'I Agree' and 'Install' in the window that opens" -ForegroundColor Red
        
        Start-Process -FilePath $nsisInstaller -Wait
        
        # ตรวจสอบการติดตั้ง
        $nsisPath = "${env:ProgramFiles(x86)}\NSIS\makensis.exe"
        if (Test-Path $nsisPath) {
            Write-Host "NSIS installation successful!" -ForegroundColor Green
            Write-Host "Location: $nsisPath" -ForegroundColor Cyan
            
            # Add NSIS to PATH
            $currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
            $nsisDir = "${env:ProgramFiles(x86)}\NSIS"
            
            if ($currentPath -notlike "*$nsisDir*") {
                Write-Host "Adding NSIS to PATH..." -ForegroundColor Yellow
                [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$nsisDir", "User")
                Write-Host "NSIS added to PATH successfully" -ForegroundColor Green
            }
            
        } else {
            Write-Host "NSIS not found after installation" -ForegroundColor Red
            Write-Host "Try manual installation from: https://nsis.sourceforge.io/Download" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "Could not download NSIS" -ForegroundColor Red
    }
    
} catch {
    Write-Host "Error occurred: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Try manual download and installation from:" -ForegroundColor Yellow
    Write-Host "   https://nsis.sourceforge.io/Download" -ForegroundColor Cyan
} finally {
    # ลบไฟล์ temp
    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force
    }
}

Write-Host "`nAfter NSIS installation is complete:" -ForegroundColor Green
Write-Host "1. Open a new PowerShell window" -ForegroundColor White
Write-Host "2. Run command: npm run build:installer" -ForegroundColor White
Write-Host "3. Installer file will be in dist-electron folder" -ForegroundColor White

Write-Host "`nCompleted!" -ForegroundColor Green
