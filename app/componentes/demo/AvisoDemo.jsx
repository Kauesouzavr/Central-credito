'use client';

import { useEffect, useRef, useState } from 'react';
import { classesBotao } from '../../../lib/buttonStyles';

// Demo pública: tela de aviso em tela cheia, a primeira coisa que o visitante
// vê (antes do login e de qualquer tela do sistema). Só é renderizada quando
// DEMO_MODE=1 (ver app/layout.js) — o sistema real nunca mostra isso.
//
// Nasce ABERTA no servidor (o sistema nunca aparece antes do aviso) e fecha
// depois da hidratação se nesta sessão do navegador já houve aceite. Só fecha
// no clique do botão: sem Esc e sem clique fora.
const CHAVE_ACEITE = 'aviso-demo-aceito';

export default function AvisoDemo() {
  const [aberto, setAberto] = useState(true);
  const botao = useRef(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(CHAVE_ACEITE) === '1') setAberto(false);
    } catch {
      // Sem sessionStorage (navegação privada restrita etc.): o aviso fica só
      // em memória, então volta a cada carregamento da página.
    }
  }, []);

  useEffect(() => {
    if (!aberto) return undefined;
    botao.current?.focus();
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflowAnterior;
    };
  }, [aberto]);

  function aceitar() {
    try {
      sessionStorage.setItem(CHAVE_ACEITE, '1');
    } catch {
      // ver comentário acima: segue só em memória.
    }
    setAberto(false);
  }

  // O botão é o único elemento focável do aviso: Tab não pode "vazar" pra
  // página que está atrás.
  function manterFoco(evento) {
    if (evento.key === 'Tab') {
      evento.preventDefault();
      botao.current?.focus();
    }
  }

  if (!aberto) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="aviso-demo-titulo"
      aria-describedby="aviso-demo-texto"
      onKeyDown={manterFoco}
      className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-ink px-6 py-10 text-white"
    >
      <div className="flex w-full max-w-3xl flex-col items-center text-center">
        <span className="rounded-full border border-white/30 px-4 py-1.5 text-sm font-bold uppercase tracking-[0.2em] text-brand-200">
          DEMONSTRAÇÃO
        </span>
        <h2 id="aviso-demo-titulo" className="mt-8 text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          ISSO É APENAS UMA DEMO
        </h2>
        <p id="aviso-demo-texto" className="mt-8 max-w-2xl text-lg leading-relaxed text-white/85 sm:text-xl">
          Este não é o sistema do cliente. O site principal está sob o comando de um cliente e é totalmente separado
          deste. Aqui tudo é fictício: clientes, valores e mensagens foram inventados, nenhuma mensagem de WhatsApp é
          enviada e os dados são restaurados todo dia.
        </p>
        <button
          ref={botao}
          type="button"
          onClick={aceitar}
          className={classesBotao('primary', 'lg', 'mt-10 w-full sm:w-auto sm:px-10')}
        >
          Entendi, ver a demonstração
        </button>
      </div>
    </div>
  );
}
