@echo off
SET ELECTRON_RUN_AS_NODE=
cd /d "%~dp0"
start "" /B npm run dev
exit
