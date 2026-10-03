import Link from 'next/link';
import { CheckIcon, Trash2Icon } from 'lucide-react';
import { tempoRelativo } from '../../../lib/util';
import { instanteMensagem, ROTULO_STATUS_MENSAGEM, ROTULO_TIPO_MENSAGEM } from '../../../lib/mensagem-ui';
import { aprovarEnvio, apagarMensagemErro } from '../../cobranca/actions';
import BotaoAcao from '../BotaoAcao';
import { Avatar } from '../ui/Avatar';
import { GlassPanel } from '../ui/GlassPanel';
import { MessageStatusIcon } from '../ui/MessageStatusIcon';

function Item({ m }) {
  return (
    <li className="flex gap-4 py-4">
      <Avatar nome={m.clienteNome} nivel={m.risco?.nivel} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <Link
            href={`/clientes/${m.cliente_id}`}
            className="rounded-lg text-lg font-bold text-ink hover:text-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200"
          >
            {m.clienteNome}
          </Link>
          <span className="flex items-center gap-1.5 text-sm text-ink-faint">
            {tempoRelativo(instanteMensagem(m))} · {ROTULO_STATUS_MENSAGEM[m.status]}
            <MessageStatusIcon status={m.status} />
          </span>
        </div>
        <p className="text-sm font-bold text-ink-soft">{ROTULO_TIPO_MENSAGEM[m.tipo]}</p>
        <p className="mt-1 line-clamp-2 text-base leading-relaxed text-ink-soft">{m.texto}</p>
        {m.status === 'pendente_revisao' && (
          <form action={aprovarEnvio} className="mt-2">
            <input type="hidden" name="mensagem_id" value={m.id} />
            <BotaoAcao
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-500 px-3 text-sm font-bold text-white transition-colors duration-150 hover:bg-brand-600"
              confirmar="Aprovar esta mensagem? Ela sai pelo WhatsApp no próximo ciclo do bot."
              textoEnviando="Aprovando..."
            >
              <CheckIcon className="h-4 w-4" aria-hidden="true" />
              Aprovar e enviar
            </BotaoAcao>
          </form>
        )}
        {m.status === 'erro' && (
          <form action={apagarMensagemErro} className="mt-2">
            <input type="hidden" name="mensagem_id" value={m.id} />
            <BotaoAcao
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-bold text-ink-soft ring-1 ring-line transition-colors duration-150 hover:text-brand-700"
              confirmar="Remover esta mensagem do histórico? Ela não foi enviada."
              textoEnviando="Removendo..."
            >
              <Trash2Icon className="h-4 w-4" aria-hidden="true" />
              Remover
            </BotaoAcao>
          </form>
        )}
      </div>
    </li>
  );
}

export function MensagemFeed({ mensagens }) {
  const aguardandoAprovacao = mensagens.filter((m) => m.status === 'pendente_revisao');
  const programadas = mensagens.filter((m) => m.status === 'pendente');
  const enviadas = mensagens.filter((m) => m.status !== 'pendente' && m.status !== 'pendente_revisao').slice(0, 10);

  return (
    <GlassPanel as="section" aria-labelledby="feed-titulo" className="p-5 sm:p-7">
      <h2 id="feed-titulo" className="text-2xl font-extrabold tracking-tight text-ink">
        Mensagens
      </h2>
      {aguardandoAprovacao.length > 0 && (
        <>
          <h3 className="mt-5 text-base font-bold text-ink-faint">Aguardando aprovação · {aguardandoAprovacao.length}</h3>
          <ul className="divide-y divide-line/80">
            {aguardandoAprovacao.map((m) => (
              <Item key={m.id} m={m} />
            ))}
          </ul>
        </>
      )}
      {programadas.length > 0 && (
        <>
          <h3 className="mt-5 text-base font-bold text-ink-faint">Na fila · {programadas.length}</h3>
          <ul className="divide-y divide-line/80">
            {programadas.map((m) => (
              <Item key={m.id} m={m} />
            ))}
          </ul>
        </>
      )}
      <h3 className="mt-5 text-base font-bold text-ink-faint">Já enviadas</h3>
      {enviadas.length === 0 ? (
        <p className="py-6 text-ink-soft">Nenhuma mensagem enviada ainda.</p>
      ) : (
        <ul className="divide-y divide-line/80">
          {enviadas.map((m) => (
            <Item key={m.id} m={m} />
          ))}
        </ul>
      )}
    </GlassPanel>
  );
}
