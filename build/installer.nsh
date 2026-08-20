; O NSIS gerado pelo electron-builder, no uninstall (chamado automaticamente
; a cada update via autoUpdater.quitAndInstall, ver src/main/services/updater.js),
; por padrão faz RMDir /r $INSTDIR — apaga TUDO na pasta de instalação,
; incluindo krontech.ini, que fica lá (mesma pasta do .exe, ver BASE_DIR em
; src/main/config.js) mas nunca foi "instalado" pelo NSIS, é criado em
; runtime pelo próprio app. Isso já causou perda de configuração/dados em
; produção — nunca remover essa proteção sem substituí-la por outra.
;
; customRemoveFiles roda ANTES do RMDir /r $INSTDIR padrão (tanto no
; uninstall manual quanto no uninstall silencioso que precede cada update).
; Move o .ini pra fora da pasta antes da limpeza, e customInstall (que roda
; DEPOIS que os novos arquivos da versão são copiados) devolve ele pro lugar.
!macro customRemoveFiles
  IfFileExists "$INSTDIR\krontech.ini" 0 iniAusente
    CreateDirectory "$TEMP\krontech-ini-backup"
    Delete "$TEMP\krontech-ini-backup\krontech.ini"
    CopyFiles /SILENT "$INSTDIR\krontech.ini" "$TEMP\krontech-ini-backup\krontech.ini"
  iniAusente:
  RMDir /r $INSTDIR
!macroend

!macro customInstall
  IfFileExists "$TEMP\krontech-ini-backup\krontech.ini" 0 backupAusente
    CopyFiles /SILENT "$TEMP\krontech-ini-backup\krontech.ini" "$INSTDIR\krontech.ini"
    Delete "$TEMP\krontech-ini-backup\krontech.ini"
    RMDir "$TEMP\krontech-ini-backup"
  backupAusente:
!macroend
