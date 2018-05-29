@echo off

taskkill /F /IM chrome.exe /T

start "DummyName" "chrome" "http://localhost:3000/wip/bloom?presentationMode=true" --incognito --kiosk --allow-file-access-from-files --profile-directory="Profile 1" 