import { MessageCircleIcon } from 'lucide-react';
import { tempoRelativo } from '../../../lib/util';
import { instanteMensagem, ROTULO_STATUS_MENSAGEM, ROTULO_TIPO_MENSAGEM } from '../../../lib/mensagem-ui';
import { GlassPanel } from '../ui/GlassPanel';
import { MessageStatusIcon } from '../ui/MessageStatusIcon';

export function ConversaWhatsApp({ nome, mensagens }) {
  return (
    <GlassPanel as="section" aria-labelledby="conversa-titulo" className="p-5 sm:p-6">
      <h2 id="conversa-titulo" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-ink">
        <MessageCircleIcon className="h-5 w-5 text-ok-500" aria-hidden="true" />
        WhatsApp com {nome}
      </h2>
      <p className="mt-1 text-base text-ink-soft">Mensagens que o sistema mandou sozinho.</p>

      {mensagens.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-white/70 px-4 py-6 text-center text-base text-ink-soft ring-1 ring-line">
          Nenhuma mensagem enviada ainda.
        </p>
      ) : (
        <ol className="mt-5 grid gap-3">
          {mensagens.slice(0, 6).map((m) => (
            <li key={m.id} className="rounded-2xl rounded-tr-md bg-white px-4 py-3 shadow-[0_2px_8px_-4px_rgba(30,22,20,0.15)] ring-1 ring-line">
              <p className="text-sm font-bold text-ink-faint">{ROTULO_TIPO_MENSAGEM[m.tipo]}</p>
              <p className="mt-1 text-base leading-relaxed text-ink">{m.texto}</p>
              <p className="mt-2 flex items-center justify-end gap-1.5 text-sm text-ink-faint">
                {tempoRelativo(instanteMensagem(m))} · {ROTULO_STATUS_MENSAGEM[m.status]}
                <MessageStatusIcon status={m.status} />
              </p>
            </li>
          ))}
        </ol>
      )}
    </GlassPanel>
  );
}
