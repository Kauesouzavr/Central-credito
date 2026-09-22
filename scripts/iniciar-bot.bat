@echo off
REM Central de Credito - liga o bot de WhatsApp (Fase 6).
REM Usado pelo Agendador de Tarefas do Windows (roda sozinho ao entrar na
REM conta), mas também dá pra dar 2 cliques nele direto, se quiser rodar na
REM hora.

title Central de Credito - Bot WhatsApp
cd /d "%~dp0.."
call npm run whatsapp:bot

echo.
echo O bot parou (a janela acima mostra o motivo, se der pra ver).
pause
