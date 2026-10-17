@echo off
title RetroHub - Iniciar Fullstack
echo ========================================================
echo        🎮 INICIANDO RETROHUB (FULLSTACK) 🎮
echo ========================================================
echo.
echo 1. Abrindo terminal do Back-end Spring Boot (Porta 8080)...
start "RetroHub Backend (Porta 8080)" cmd /k "cd /d D:\PROJETOS_GITHOUB\jogosretroAPI\backend && mvn spring-boot:run"

echo 2. Abrindo terminal do Front-end Angular (Porta 4200)...
start "RetroHub Frontend (Porta 4200)" cmd /k "cd /d D:\PROJETOS_GITHOUB\jogosretro\frontend && npm start"

echo.
echo Ambos os servidores estao em execucao!
echo Acesse no navegador:
echo 👉 http://localhost:4200
echo.
pause
