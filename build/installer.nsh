
; LabFlow Clinic Custom NSIS Script
; สำหรับสร้าง desktop shortcut และ start menu

!macro customInstall
  ; สร้าง desktop shortcut
  CreateShortCut "$DESKTOP\LabFlow Clinic.lnk" "$INSTDIR\LabFlow Clinic.exe" "" "$INSTDIR\resources\app\public\iconlabflow.ico"
  
  ; สร้าง start menu shortcut
  CreateDirectory "$SMPROGRAMS\LabFlow Clinic"
  CreateShortCut "$SMPROGRAMS\LabFlow Clinic\LabFlow Clinic.lnk" "$INSTDIR\LabFlow Clinic.exe" "" "$INSTDIR\resources\app\public\iconlabflow.ico"
  CreateShortCut "$SMPROGRAMS\LabFlow Clinic\Uninstall LabFlow Clinic.lnk" "$INSTDIR\Uninstall LabFlow Clinic.exe"
!macroend

!macro customUnInstall
  ; ลบ desktop shortcut
  Delete "$DESKTOP\LabFlow Clinic.lnk"
  
  ; ลบ start menu shortcuts
  Delete "$SMPROGRAMS\LabFlow Clinic\LabFlow Clinic.lnk"
  Delete "$SMPROGRAMS\LabFlow Clinic\Uninstall LabFlow Clinic.lnk"
  RMDir "$SMPROGRAMS\LabFlow Clinic"
!macroend
