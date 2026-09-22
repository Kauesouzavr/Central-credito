# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Dono(a) de uma loja pequena que vende a prazo ("fiado") — o usuário principal é uma pessoa idosa, sem muita familiaridade com tecnologia, que administra o negócio sozinha (não é uma ferramenta operada por funcionário em nome de outro dono). Usa o sistema misturando celular, tablet e computador de balcão, dependendo do momento — precisa funcionar bem nos três, sem um aparelho "principal".

## Product Purpose

Substitui o controle em caderno ou planilha que pequenos negócios costumam usar pra vendas a prazo. Ajuda a saber quem deve, quanto, até quando vence, e quem tem mais risco de não pagar — com cobrança automática por WhatsApp e previsão de quanto deve entrar de caixa.

## Positioning

Feito sob medida pra um negócio real, não é um SaaS genérico pra qualquer loja. A barra mais alta não é "ter mais recursos" — é ser simples o suficiente pra uma pessoa idosa usar sozinha, sem treinamento. Concorre diretamente com caderno e planilha, não com sistemas de gestão completos.

## Operating Context

Uso diário, na loja, intercalando celular, tablet e computador. O cadastro de venda fiado acontece no balcão, junto com o cliente. A cobrança por WhatsApp acontece sozinha, em segundo plano (bot próprio) — o dono só acompanha a fila e os relatórios, não manda nada manualmente. Tudo em português do Brasil.

## Capabilities and Constraints

- Sem tela de login — ferramenta de um único negócio, sem multiusuário.
- Todo acesso ao banco é server-side (Server Components/Actions); a chave de acesso nunca chega ao navegador.
- Motor de risco (nota de 0 a 100) decide quem cobrar primeiro.
- Cobrança automática por WhatsApp: boas-vindas no cadastro, aviso antes do vencimento, aviso no vencimento, cobrança de atraso.
- Previsão de caixa (4 semanas) e relatório semanal (últimos 7 dias vs. os 7 anteriores).
- Confirmação obrigatória antes de qualquer ação que não dá pra desfazer.
- **Fase de demonstração**: o projeto ainda não tem um cliente fechado — está sendo mostrado pra vender o sistema. Só tem dado fictício de teste. Segurança de produção pesada (autenticação completa, WAF, compliance) fica pra quando o negócio fechar de fato.

## Brand Commitments

Nenhum. **"Central de Crédito" é um nome provisório** (confirmado com o usuário), usado enquanto o projeto está em demonstração pra fechar negócio — não é a marca definitiva do cliente que vai comprar. O redesign não deve investir em identidade de marca fixa (logo definitivo, nome cunhado); deve produzir um sistema visual limpo e reutilizável, que sirva de base sólida e seja fácil de "rebatizar" quando houver um cliente e nome reais.

## Evidence on Hand

Nenhum dado real. Só dados fictícios de teste (clientes com segmento `TESTE`, telefones inválidos de propósito). Nenhum depoimento, case, número real de negócio ou prova social existe — nada disso deve ser inventado ou simulado como se fosse real.

## Product Principles

1. Simplicidade acima de tudo: poucos passos, botões grandes, sem jargão técnico.
2. Confirmação antes de qualquer ação irreversível.
3. Mensagens claras em português, sem "internetês" nem termos técnicos.
4. Funciona igualmente bem em celular, tablet e computador — nenhum é o "principal".
5. Acessível pra quem não é fluente em tecnologia, sem sacrificar quem é.
