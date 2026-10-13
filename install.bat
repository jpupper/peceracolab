@echo off
setlocal
cd /d "%~dp0"

echo ================================================================
echo    INSTALADOR DE DEPENDENCIAS - AQUAVERSE 3D
echo ================================================================
echo.

echo [1/3] Verificando Node.js y npm...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js no esta instalado o no se encuentra en el PATH.
    echo Por favor descarga e instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm no esta disponible en el PATH.
    pause
    exit /b 1
)

echo [OK] Node.js y npm detectados correctamente.
echo.

echo [2/3] Instalando dependencias (express, socket.io, three)...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Hubo un error al ejecutar npm install.
    pause
    exit /b 1
)
echo [OK] Dependencias instaladas correctamente.
echo.

echo [3/3] Verificando modelos 3D...
if not exist "public\models\clownfish.glb" (
    echo Generando modelos 3D con Blender...
    set "BLENDER_PATH="
    if exist "C:\Program Files\Blender Foundation\Blender 4.5\blender.exe" (
        set "BLENDER_PATH=C:\Program Files\Blender Foundation\Blender 4.5\blender.exe"
    ) else if exist "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" (
        set "BLENDER_PATH=C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
    )

    if defined BLENDER_PATH (
        echo Ejecutando Blender desde: "%BLENDER_PATH%"
        "%BLENDER_PATH%" --background --python generate_models.py
        echo [OK] Modelos 3D generados con exito.
    ) else (
        echo [AVISO] No se encontro Blender en C:\Program Files\Blender Foundation.
    )
) else (
    echo [OK] Modelos 3D ya presentes en public\models.
)

echo.
echo ================================================================
echo  INSTALACION FINALIZADA CON EXITO
echo  Ahora puedes ejecutar run.bat para iniciar el simulador
echo ================================================================
echo.
pause
