@echo off
echo Starting Hazard Reporting System Backend...
start "Backend" cmd /c "cd backend && npm start"

echo Starting Hazard Reporting System Frontend...
start "Frontend" cmd /c "cd frontend && npx serve -p 3000"

echo Both servers started in new command prompt windows!
pause
