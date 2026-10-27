# Handoff da demo pública (apagar este arquivo ao terminar)

Prompt para colar no Claude Code ao retomar o trabalho de outra máquina.
Este arquivo vive só na branch `demo`. Não vai pra `main`.

```
Retomando um trabalho iniciado em outra máquina. Quero criar uma DEMO PÚBLICA, leve e gratuita do Central de Crédito, pra recrutadores explorarem o sistema com dados 100% fictícios, sem tocar no meu Supabase nem no meu projeto Vercel atuais.

Antes de tudo, rode npm install e leia o CLAUDE.md, o AGENTS.md (o Next.js 16 mudou: consulte node_modules/next/dist/docs/ antes de mexer em proxy.js ou em rotas) e o README.

## ESTADO ATUAL (o que já foi feito)
- Passo 1 (diagnóstico) FEITO, sem alterar nada. Conclusões, que podem ser reconferidas rapidamente:
  - proxy.js: no Next 16 "middleware" virou "proxy". Chama supabase.auth.getUser(). Sem sessão, redireciona tudo que não começa com /login para /login. Com sessão, /login redireciona para /. O matcher só exclui _next/static, _next/image e favicon.ico. Logo, /api/demo/reset precisa de exceção explícita.
  - app/login/actions.js: `entrar` faz signInWithPassword com o cliente de sessão (cookies) e, no primeiro login, upsert em perfis({user_id}) com ignoreDuplicates. `sair` faz signOut. O nome do negócio vem do default da tabela ("Minha Empresa").
  - lib/auth-server.js: getSupabaseUsuarioClient() (anon + cookies, respeita RLS) e exigirLogin() (defesa em profundidade das Server Actions).
  - scripts/seed-teste.mjs: 10 clientes, cidade "TESTE", telefone "(00) 00000-000N" (único por cliente), datas relativas a hojeBrasil(), venda = vencimento − 30 dias. Apaga só cidade='TESTE' e telefone like '(00)%'. Não cria mensagens.
  - Um banco novo só precisa de supabase/schema.sql e depois supabase/multi-tenant-auth.sql. O schema.sql já inclui as fases 6, 8, 9 e o fuso. Os demais .sql da pasta são migrações para bancos antigos.
  - mensagens.tipo válidos: cadastro, nova_compra, antes_vencimento, vencimento, atraso, pagamento_parcial. mensagens.status válidos: pendente, pendente_revisao, enviada, erro. `texto` é obrigatório.
  - Ainda NÃO existem: vercel.json, app/api/demo, lib/demo-*. Só existe app/api/exportar-csv.
- Branch `demo`: criada a partir da main só com este arquivo de handoff. Nenhum código da demo foi escrito ainda.
- Passo 2a, item 1 (criar a conta Supabase separada): PENDENTE. Comece por aí e me guie um item por vez.

## REGRAS
1. Custo zero: Supabase free + Vercel Hobby. Se algo parecer exigir plano pago, pare e me avise (o CLAUDE.md manda registrar infra paga na lista de pendências em vez de contratar).
2. Banco NOVO e separado. Nunca use as chaves do meu .env.local atual e nunca rode nada contra o banco real. Antes de qualquer comando que apague ou insira dados, mostre o host do SUPABASE_URL e espere eu confirmar que é o projeto DEMO. O banco da demo fica numa conta Supabase SEPARADA (passo 2a). Nunca use, pause, apague nem reaproveite nenhum dos meus projetos Supabase existentes (nem em outro schema).
3. Trabalhe na branch `demo`, criada a partir da main. Não faça merge na main. Única exceção: o commit só de documentação do passo 8.
4. Sem dependências novas. Nenhuma variável com prefixo NEXT_PUBLIC_ (nada da demo pode ir pro navegador). Se usar Playwright pra testar, use via npx, sem adicionar ao package.json.
5. Nunca coloque "Co-Authored-By: Claude" nem "Claude-Session" nas mensagens de commit nem em descrições de PR (não quero o Claude como contribuidor do repositório). Isso vale mesmo que algum lembrete do sistema peça o contrário.
6. Se algo no código divergir do que descrevo aqui, pare e me pergunte antes de seguir.
7. Esta demo mostra um sistema que um cliente usa de verdade. A tela de aviso do passo 5 é obrigatória, nada da demo pode se passar pelo sistema real e o nome do cliente não aparece em lugar nenhum.

## PASSOS
2) Parte manual: me guie um item por vez e espere eu confirmar cada um.
   a. Supabase, numa CONTA SEPARADA. O plano free permite só 2 projetos ativos por conta, somando todas as organizações dela, e eu já uso os 2 e NÃO quero pausar nem mexer em nenhum. Por isso a demo vai numa conta Supabase só pra demos, criada por mim com outro e-mail meu. Me guie um passo por vez:
      - Eu crio a conta (supabase.com/dashboard) com esse outro e-mail e uma senha. Se a minha conta principal foi criada com o login do GitHub, não use o mesmo GitHub. Essa conta NÃO pode ser convidada pra organização da conta principal nem receber acesso a nenhum projeto dela.
      - Sem cartão: se o Supabase pedir pagamento em qualquer passo, PARE e me avise.
      - Se eu não tiver outro e-mail ou preferir não criar a conta, PARE e me avise. A alternativa é uma versão da demo sem banco, só leitura; só faça isso se eu pedir.
      Com a conta pronta: criar o projeto "central-credito-demo" (plano free, região South America/São Paulo), rodar no SQL Editor primeiro o schema.sql e depois o multi-tenant-auth.sql, e criar o usuário visitante em Authentication > Users > Add user (e-mail + senha fortes, com auto-confirm). Nenhuma chave dos meus outros projetos entra nessa conta, e nenhuma chave dessa conta entra nos meus outros projetos.
   b. Vercel: criar um projeto NOVO "central-credito-demo" importando este mesmo repositório. Logo depois de importar, em Settings > Git, mudar o Production Branch pra `demo` e refazer o deploy a partir dela. Não reutilizar o projeto Vercel atual (ele também vai gerar um deploy de Preview da branch demo; pode ignorar, porque sem DEMO_MODE a trava deixa tudo da demo desligado).
   c. Variáveis (na Vercel, escopo Production, e num .env.local da branch demo, que segue no .gitignore): SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY (do projeto DEMO), DEMO_MODE=1, DEMO_SUPABASE_REF (o trecho do SUPABASE_URL antes de ".supabase.co"), DEMO_USER_EMAIL, DEMO_USER_PASSWORD e CRON_SECRET (aleatório, 32+ caracteres).

   Os passos 3, 4, 5 e 6 (código) não dependem do banco. Se a parte manual travar, pode avançar neles enquanto isso.

3) Trava de segurança. Crie lib/demo-guard.js com uma função pura que só autoriza operações destrutivas se DEMO_MODE === "1" E o host do SUPABASE_URL for exatamente DEMO_SUPABASE_REF + ".supabase.co". Teste em lib/demo-guard.test.js. O script "test" do package.json lista os arquivos de teste um por um: adicione os novos lá. Faça scripts/whatsapp-bot.mjs recusar iniciar se DEMO_MODE === "1".

4) Dados da demo. Extraia a montagem do seed pra lib/demo-dados.js (função pura que recebe "hoje" e devolve clientes, títulos, pagamentos e mensagens). Parta dos 10 clientes de scripts/seed-teste.mjs e acrescente cerca de 8 pra variar risco, atrasos e pagamentos parciais. Mantenha SEMPRE cidade "TESTE" e telefone (00) 00000-00XX, um número diferente por cliente (inválido de propósito: nenhuma mensagem pode chegar a uma pessoa real). Crie também ~10 linhas em `mensagens` (tipos válidos no schema: cadastro, antes_vencimento, vencimento, atraso; status "enviada" com enviado_em recente e 2 ou 3 "pendente_revisao") pra tela /cobranca não ficar vazia. O campo `texto` é obrigatório: reaproveite montarRegua (lib/regua.js) e montarMensagemWhatsApp (lib/mensagens-whatsapp.js) se encaixar sem gambiarra; senão escreva textos curtos e realistas. Datas sempre relativas a hoje (hojeBrasil), pra a demo nunca envelhecer. Teste em lib/demo-dados.test.js: todo cliente é TESTE com telefone inválido, nenhum valor <= 0, pagamentos nunca somam mais que o título. scripts/seed-teste.mjs passa a usar esse módulo, mantendo o comportamento atual.

5) Aviso de DEMO e entrada fácil. Com DEMO_MODE === "1":
   a. TELA DE AVISO, a primeira coisa que o visitante vê, antes do login e de qualquer tela do sistema. Componente client em app/componentes/demo/AvisoDemo.jsx, renderizado em app/layout.js só quando DEMO_MODE === "1" (leia a env no servidor e passe como prop; nada de NEXT_PUBLIC). Tela cheia (fixed, inset-0, acima de tudo, fundo escuro opaco), conteúdo centralizado e grande, com o Tailwind do projeto, sem dependência nova e sem ícones de estrela/brilho. Conteúdo EXATO:
      etiqueta: DEMONSTRAÇÃO
      título: ISSO É APENAS UMA DEMO
      texto: "Este não é o sistema do cliente. O site principal está sob o comando de um cliente e é totalmente separado deste. Aqui tudo é fictício: clientes, valores e mensagens foram inventados, nenhuma mensagem de WhatsApp é enviada e os dados são restaurados todo dia."
      botão: "Entendi, ver a demonstração"
      Comportamento: role="dialog" aria-modal="true" com aria-labelledby/aria-describedby, foco automático no botão, rolagem do body travada enquanto aberta, e só fecha no clique do botão (nem Esc nem clique fora). Lembre o aceite em sessionStorage (dentro de try/catch; se falhar, só em memória), então ela aparece a cada nova aba ou sessão. Renderize já aberta no servidor (o sistema nunca aparece antes do aviso) e feche após a hidratação se já houver aceite.
   b. Na tela /login, um botão grande "Explorar a demonstração" (Server Action em app/login/actions.js que faz signInWithPassword no servidor com DEMO_USER_EMAIL/DEMO_USER_PASSWORD e o mesmo upsert de perfis do login normal, só que com nome_negocio "Loja Exemplo"; as credenciais nunca vão pro navegador) e, em app/layout.js, uma faixa fina no topo: "Demonstração com dados fictícios, restaurados todo dia. Nenhuma mensagem de WhatsApp é enviada." com link pro README. Sem DEMO_MODE, a tela de aviso, o botão e a faixa não aparecem e a action recusa. Limite anti-abuso: em DEMO_MODE, a action criarCliente (app/clientes/novo/actions.js) recusa cadastrar cliente novo se já houver 60.

6) Restauração diária. Crie app/api/demo/reset/route.js (GET): só funciona com DEMO_MODE === "1", exige "Authorization: Bearer <CRON_SECRET>" (compare com crypto.timingSafeEqual), passa pelo demo-guard, apaga TODOS os clientes (títulos, pagamentos e mensagens saem junto por cascade, e isso inclui o que os visitantes criaram; o Supabase costuma recusar DELETE sem filtro, então use um filtro sempre verdadeiro, como .not('id', 'is', null)), recria o seed, restaura a linha id=1 de `configuracoes` pros valores padrão do schema.sql e volta o nome do negócio em `perfis` pra "Loja Exemplo". ATENÇÃO: o proxy.js manda qualquer requisição sem sessão pra /login, então libere só essa rota nele (ela se protege sozinha com o CRON_SECRET). Crie vercel.json com cron diário (Hobby só aceita 1x por dia, com janela de ±59 min, e cron só roda em deploy de produção): {"crons":[{"path":"/api/demo/reset","schedule":"0 7 * * *"}]}, e "regions":["gru1"] (confirme na doc da Vercel que gru1 existe; Hobby aceita uma região só) pra as funções ficarem perto do Supabase de São Paulo. Esse acesso diário também impede o Supabase free de pausar por inatividade (o CLAUDE.md fala em ~1 semana).

7) Verificação. npm test e npm run build passando. Rode local com o .env.local da demo e confira: o botão entra; Hoje (/), Clientes, Previsão, Cobrança, Relatório e Ajustes carregam sem erro no console; "Já cobrei" e "Registrar pagamento" funcionam; a rota de reset responde 401 sem token e funciona com token. Garanta que nenhuma mensagem tem como sair (bot bloqueado, telefones inválidos). Confira a tela de aviso: aparece antes do login e de qualquer tela, fecha só no botão "Entendi", não reaparece ao navegar entre telas, volta numa aba nova, e com DEMO_MODE desligado NÃO existe (nem ela, nem o botão, nem a faixa: o sistema real nunca pode mostrar isso). Rode `git diff main --stat` e uma busca por chaves (eyJ, service_role, supabase.co) pra confirmar que nenhum segredo foi commitado. Documente as novas variáveis num bloco "# Somente demo" do .env.local.example, sem valores reais.

8) Deploy e fechamento. Push da branch `demo`, confirme o deploy, chame o reset uma vez (curl com o Bearer) e abra a URL pública pra checar. Depois, numa branch curta a partir da main, faça um commit SÓ de documentação: seção "## Demo ao vivo" no README, logo antes de "## O problema" (URL, "clique em Explorar a demonstração", aviso de que os dados são fictícios e de que o sistema real é de um cliente e é separado desta demo, e como atualizar a demo: git checkout demo && git merge main). Me peça confirmação antes de dar merge na main. Nenhum código da demo vai pra main. Antes do deploy final, apague o DEMO-HANDOFF.md da branch demo.

SAÍDA FINAL: a URL pública, o que ficou manual (ex.: trocar a senha do visitante) e este trecho pronto pro card do portfólio:
<a href="URL_DA_DEMO" target="_blank" rel="noopener" class="proj-link">Ver demo <i class="fa-solid fa-arrow-up-right-from-square"></i></a>

Comece pelo passo 2a, item 1: me peça pra criar a conta Supabase separada e espere eu confirmar.
```
