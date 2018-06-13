@echo off

taskkill /F /IM chrome.exe /T

start "DummyName" "chrome" "http://localhost:3000/wip/bloom?kioskMode=true" --incognito --kiosk --allow-file-access-from-files --profile-directory="Profile 1" 

SLEEP 5

echo (new ActiveXObject("WScript.Shell")).AppActivate("app A"); > focus.js
cscript //nologo focus.js
del focus.js
