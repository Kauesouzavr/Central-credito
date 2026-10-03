@echo off
REM Central de Credito - liga o bot de WhatsApp (Fase 6).
REM Usado pelo Agendador de Tarefas do Windows (roda sozinho ao entrar na
REM conta), mas também dá pra dar 2 cliques nele direto, se quiser rodar na
REM hora.
REM
REM Sem "pause" no fim de propósito: se o bot cair, este script termina com
REM erro e o Agendador reinicia sozinho (ver RestartCount na tarefa). Com
REM "pause" ele ficaria esperando uma tecla e a tarefa nunca reiniciaria.

title Central de Credito - Bot WhatsApp
cd /d "%~dp0.."
call npm run whatsapp:bot
exit /b %errorlevel%
