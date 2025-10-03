
; LabFlow Clinic Custom NSIS Script with Launcher
; สร้าง desktop shortcut ที่ใช้ batch launcher

!macro customInstall
  ; Create the launcher batch file in install directory
  FileOpen $0 "$INSTDIR\Start-LabFlow.bat" w
  FileWrite $0 "@echo off$$
"
  FileWrite $0 "title LabFlow Clinic Launcher$$
"
  FileWrite $0 "color 0A$$
"
  FileWrite $0 "echo.$$
"
  FileWrite $0 "echo ========================================$$
"
  FileWrite $0 "echo    LabFlow Clinic - Starting System$$
"
  FileWrite $0 "echo ========================================$$
"
  FileWrite $0 "echo.$$
"
  FileWrite $0 "set INSTALL_DIR=%~dp0$$
"
  FileWrite $0 "cd /d %INSTALL_DIR%$$
"
  FileWrite $0 "echo [1/2] Starting Backend Server...$$
"
  FileWrite $0 "if exist resources\app.asar.unpacked\backend\server.js ($$
"
  FileWrite $0 "  start $"LabFlow Backend$" cmd /k $"cd /d %INSTALL_DIR%resources\app.asar.unpacked\backend && echo LabFlow Backend Server && echo Running on http://localhost:3001 && node server.js$"$$
"
  FileWrite $0 "  timeout /t 3 /nobreak >nul$$
"
  FileWrite $0 ")$$
"
  FileWrite $0 "echo [2/2] Starting Main Application...$$
"
  FileWrite $0 "start $"$" $"LabFlow Clinic.exe$"$$
"
  FileWrite $0 "echo LabFlow Clinic Started Successfully!$$
"
  FileWrite $0 "timeout /t 3 /nobreak >nul$$
"
  FileWrite $0 "exit$$
"
  FileClose $0
  
  ; Create desktop shortcut to our created batch file
  CreateShortCut "$DESKTOP\LabFlow Clinic.lnk" "$INSTDIR\Start-LabFlow.bat" "" "$INSTDIR\resources\app\public\iconlabflow.ico" 0 SW_SHOWMINIMIZED
  
  ; Create start menu shortcuts
  CreateDirectory "$SMPROGRAMS\LabFlow Clinic"
  CreateShortCut "$SMPROGRAMS\LabFlow Clinic\LabFlow Clinic.lnk" "$INSTDIR\Start-LabFlow.bat" "" "$INSTDIR\resources\app\public\iconlabflow.ico" 0 SW_SHOWMINIMIZED
  CreateShortCut "$SMPROGRAMS\LabFlow Clinic\LabFlow Clinic (Direct).lnk" "$INSTDIR\LabFlow Clinic.exe" "" "$INSTDIR\resources\app\public\iconlabflow.ico"
  CreateShortCut "$SMPROGRAMS\LabFlow Clinic\Uninstall LabFlow Clinic.lnk" "$INSTDIR\Uninstall LabFlow Clinic.exe"
!macroend

!macro customUnInstall
  ; Remove desktop shortcut
  Delete "$DESKTOP\LabFlow Clinic.lnk"
  
  ; Remove start menu shortcuts
  Delete "$SMPROGRAMS\LabFlow Clinic\LabFlow Clinic.lnk"
  Delete "$SMPROGRAMS\LabFlow Clinic\LabFlow Clinic (Direct).lnk"
  Delete "$SMPROGRAMS\LabFlow Clinic\Uninstall LabFlow Clinic.lnk"
  RMDir "$SMPROGRAMS\LabFlow Clinic"
  
  ; Remove created batch file
  Delete "$INSTDIR\Start-LabFlow.bat"
!macroend
