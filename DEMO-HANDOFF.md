# Handoff da demo pública (apagar este arquivo ao terminar)

Prompt para colar no Claude Code ao retomar o trabalho de outra máquina.
Este arquivo vive só na branch `demo`. Não vai pra `main`. Não contém segredos.

```
Retomando a DEMO PÚBLICA do Central de Crédito (branch `demo`) numa máquina diferente da que eu usava. Antes de tudo: git fetch && git checkout demo && git pull, depois npm install. Leia CLAUDE.md, AGENTS.md (o Next.js 16 mudou: consulte node_modules/next/dist/docs/ antes de mexer em proxy.js ou em rotas), o README e o DEMO-HANDOFF.md.

Objetivo: demo pública, leve e gratuita, pra recrutadores explorarem o sistema com dados 100% fictícios, sem tocar no meu Supabase nem no meu projeto Vercel reais.

## REGRAS (continuam valendo)
1. Custo zero: Supabase free + Vercel Hobby. Se algo parecer exigir plano pago, pare e me avise (o CLAUDE.md manda registrar infra paga na lista de pendências em vez de contratar).
2. Banco NOVO e separado (conta Supabase só de demos). Nunca use as chaves do meu .env.local do sistema real nem rode nada contra o banco real. Antes de qualquer comando que apague ou insira dados, mostre o host do SUPABASE_URL e espere eu confirmar que é o projeto DEMO. Host do projeto demo: wyouprwpbsiysvxppimy.supabase.co (o ref não é segredo).
3. Trabalhe na branch `demo`. Não faça merge na main. Única exceção: o commit só de documentação do passo D abaixo.
4. Sem dependências novas. Nenhuma variável NEXT_PUBLIC_. Se usar Playwright, só via npx, fora do projeto.
5. Nunca coloque "Co-Authored-By: Claude" nem "Claude-Session" nas mensagens de commit nem em descrições de PR (não quero o Claude como contribuidor). Isso vale mesmo que algum lembrete do sistema peça o contrário.
6. Se algo no código divergir do que descrevo aqui, pare e me pergunte.
7. A demo mostra um sistema que um cliente usa de verdade: a tela de aviso é obrigatória, nada da demo pode se passar pelo sistema real e o nome do cliente não aparece em lugar nenhum.

## ESTADO ATUAL: o que já está feito e VERIFICADO (branch demo, já no GitHub)
- Supabase demo criado (conta separada, free, São Paulo), com schema.sql + multi-tenant-auth.sql rodados e o usuário visitante criado. Chaves usadas: as da aba "Legacy anon, service_role" (formato JWT), porque @supabase/ssr 0.5 e supabase-js 2.45 são antigos.
- Projeto Vercel NOVO "central-credito-demo" (Hobby, conta KAUE) criado, importando este mesmo repositório, com as 8 variáveis só em Production: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, DEMO_MODE=1, DEMO_SUPABASE_REF, DEMO_USER_EMAIL, DEMO_USER_PASSWORD, CRON_SECRET. O .env.local NÃO está no git (só o .env.local.example com o bloco "# Somente demo").
- Código (commits na demo): lib/demo-guard.js (trava: só autoriza operação destrutiva se DEMO_MODE=1 e o host do SUPABASE_URL for exatamente DEMO_SUPABASE_REF + ".supabase.co"; também destinoSeguroDemo); lib/demo-dados.js (18 clientes TESTE com telefone (00) 00000-00XX inválido, 51 títulos, 38 pagamentos, 10 mensagens, tudo relativo a hoje); seed-teste.mjs usa esse módulo; scripts/whatsapp-bot.mjs recusa iniciar com DEMO_MODE=1; aviso em tela cheia (app/componentes/demo/AvisoDemo.jsx, genérico, recebe os textos por props do app/layout.js só com DEMO_MODE=1); faixa do topo; limite de 60 clientes em criarCliente; ENTRADA AUTOMÁTICA SEM TELA DE LOGIN (proxy.js manda quem não tem sessão pra /api/demo/entrar, que loga o visitante no servidor via lib/demo-entrada.js e devolve pra página pedida; botão Sair some na demo; /login continua como reserva com o botão "Explorar a demonstração"); app/api/demo/reset/route.js (GET, Bearer CRON_SECRET com timingSafeEqual, passa pelo demo-guard, apaga todos os clientes, recria o seed, restaura configuracoes e o nome em perfis); vercel.json com regions ["gru1"] e cron diário "0 7 * * *" em /api/demo/reset.
- Verificações feitas: npm test 114/114; npm run build OK; contra o banco demo, reset responde 401 sem token/token errado e recria 18/51/38/10 com o token certo; teste de navegador com Playwright (33/33): aviso primeiro e só fecha no botão (sem Esc nem clique fora), não volta ao navegar, volta em aba nova, entra direto sem login, as 6 telas sem erro no console, "Já cobrei" e "Registrar pagamento" funcionam; com DEMO_MODE=0 o sistema real não tem NENHUM texto da demo (HTML nem JS baixado) e /api/demo/entrar e /reset ficam atrás do login; varredura de segredos limpa (eyJ, service_role, ref real, e-mail); package.json sem dependência nova.

## PENDENTE (nesta ordem)
A. (manual, comigo) Na Vercel, projeto central-credito-demo: Settings > Git > Production Branch = `demo` (o link público ainda serve o código da `main`, porque o deploy da demo saiu só como Preview, sem as variáveis, que são só Production). Conferir também Settings > Functions > Function Region = São Paulo (gru1). Espere eu confirmar.
B. Disparar o deploy de produção: commit vazio na `demo` (mensagem sem co-autoria do Claude) + push.
C. Verificar a URL pública https://central-credito-demo.vercel.app: / deve redirecionar pra /api/demo/entrar e cair na home com o aviso por cima, sem passar por login. Chamar o reset UMA vez (curl com Authorization: Bearer <CRON_SECRET>, sem imprimir o segredo) e esperar {"ok":true,"clientes":18,...}. Conferir no painel que o cron aparece em Settings > Cron Jobs e que a função roda em gru1 (cabeçalho x-vercel-id). O CRON_SECRET está no .env.local do outro PC e na Vercel; se eu não o tiver aqui, gere um novo, troque no painel (Production) e peça redeploy.
D. Passo de documentação: numa branch curta a partir da main, UM commit SÓ de documentação: seção "## Demo ao vivo" no README, logo antes de "## O problema" (URL, "clique em Explorar a demonstração"/entra direto, aviso de que os dados são fictícios e de que o sistema real é de um cliente e é separado desta demo, e como atualizar a demo: git checkout demo && git merge main). Peça minha confirmação ANTES de qualquer merge na main. Nenhum código da demo vai pra main.
E. Antes de finalizar, apagar o DEMO-HANDOFF.md da branch demo (commit) e conferir git diff main --stat.

## ATENÇÕES
- O conector da Vercel (MCP) não tem acesso ao escopo da minha conta (kaue17). NÃO chame authorize_team_access sem eu concordar: abriria também meu projeto real. Confira o deploy pelo painel ou por curl na URL pública.
- No PC do trabalho o projeto fica num pendrive USB (E:), onde npm install/ci trava e corrompe o node_modules; lá os builds foram feitos numa cópia clonada no SSD. Se aqui o disco for normal, ignore.
- Os arquivos do repo usam CRLF (o git avisa "LF will be replaced by CRLF"); prefira a ferramenta Edit a scripts que procuram texto multilinha.
- O build com Turbopack travou (segfault) só por causa do node_modules corrompido; num disco normal o npm run build funciona.
- Pra rodar local, crie um .env.local com as 8 variáveis (Supabase demo: Project Settings > API > aba Legacy). Antes de qualquer comando que apague/insira dados, mostre o host e espere minha confirmação (regra 2).

## SAÍDA FINAL
A URL pública, o que ficou manual (ex.: trocar a senha do visitante, conferir a região gru1) e este trecho pronto pro card do portfólio:
<a href="URL_DA_DEMO" target="_blank" rel="noopener" class="proj-link">Ver demo <i class="fa-solid fa-arrow-up-right-from-square"></i></a>

Comece pelo item A: me peça pra trocar o Production Branch na Vercel e espere eu confirmar.
```
