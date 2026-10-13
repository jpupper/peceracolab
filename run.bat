@echo off
setlocal
cd /d "%~dp0"

echo ================================================================
echo    INICIANDO SIMULADOR DE PECERA GIGANTE 3D (AQUAVERSE)
echo ================================================================
echo.

echo [1/2] Abriendo navegador web en http://localhost:2470 ...
start "" cmd /c "timeout /t 1 /nobreak >nul & start http://localhost:2470"

echo [2/2] Iniciando servidor Node.js (server.js)...
echo.
echo Presiona Ctrl+C en cualquier momento para detener el servidor.
echo ================================================================
echo.

node server.js
pause
