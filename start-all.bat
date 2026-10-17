@echo off
title RetroHub - Iniciar Sistema Completo
echo ========================================================
echo        🎮 INICIANDO RETROHUB (FULLSTACK) 🎮
echo ========================================================
echo.
echo 1. Abrindo terminal do Back-end Spring Boot (8080)...
start "RetroHub Backend" cmd /k "%~dp0start-backend.bat"

echo 2. Abrindo terminal do Front-end Angular (4200)...
start "RetroHub Frontend" cmd /k "%~dp0start-frontend.bat"

echo.
echo Ambos os servicos estao sendo iniciados!
echo Quando o front-end carregar, acesse no navegador:
echo 👉 http://localhost:4200
echo.
pause
