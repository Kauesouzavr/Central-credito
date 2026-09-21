'use client';

import { useFormStatus } from 'react-dom';

// Botão de envio para formulários com Server Action. Faz duas coisas:
// - pergunta "tem certeza?" antes de enviar, quando recebe `confirmar`;
// - trava enquanto salva, pra um clique duplo não registrar duas vezes.
export default function BotaoAcao({
  children,
  confirmar,
  textoEnviando = 'Salvando...',
  className,
}) {
  const { pending } = useFormStatus();

  function aoClicar(evento) {
    if (confirmar && !window.confirm(confirmar)) {
      evento.preventDefault();
    }
  }

  return (
    <button type="submit" className={className} disabled={pending} onClick={aoClicar}>
      {pending ? textoEnviando : children}
    </button>
  );
}
