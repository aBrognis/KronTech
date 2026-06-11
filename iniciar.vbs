Set oShell = CreateObject("WScript.Shell")
oShell.CurrentDirectory = "C:\Users\ander\OneDrive\Desktop\KronTech"
oShell.Run "cmd /c SET ELECTRON_RUN_AS_NODE=& npm run dev", 0, False
