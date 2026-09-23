'use client';

import { RefreshCwIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/Button';
import { GlassPanel } from '../ui/GlassPanel';

function Uso({ rotulo, usado, limite }) {
  if (limite == null) {
    return (
      <div className="flex items-baseline justify-between text-base">
        <span className="text-ink-soft">{rotulo}</span>
        <span className="font-bold tabular-nums text-ink">{usado} · sem limite</span>
      </div>
    );
  }
  const pct = Math.min(100, (usado / Math.max(1, limite)) * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between text-base">
        <span className="text-ink-soft">{rotulo}</span>
        <span className="font-bold tabular-nums text-ink">
          {usado} <span className="font-medium text-ink-faint">de {limite}</span>
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div className="bar-fill h-full rounded-full" style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
    </div>
  );
}

// `config` = linha de `configuracoes` (snake_case: whatsapp_limite_por_dia,
// whatsapp_limite_por_hora, whatsapp_atraso_min_segundos/max_segundos,
// whatsapp_pausado). `enviadasHoje`/`nestaHora` já vêm contados de
// lib/carregar-regua.js.
export function ConexaoWhatsApp({ config, enviadasHoje, nestaHora }) {
  const pausado = config.whatsapp_pausado;

  return (
    <GlassPanel as="section" aria-labelledby="conexao-titulo" className="p-6">
      <h2 id="conexao-titulo" className="text-xl font-extrabold tracking-tight text-ink">
        WhatsApp da loja
      </h2>
      <div className="mt-4 flex items-center gap-3">
        <span
          className={`h-3 w-3 rounded-full ${pausado ? 'bg-warn-500' : 'bg-ok-500 shadow-[0_0_0_4px_rgba(47,148,99,0.15)]'}`}
          aria-hidden="true"
        />
        <p className="text-lg font-bold text-ink">{pausado ? 'Envios pausados' : 'Conectado e enviando'}</p>
      </div>
      <p className="mt-1 text-base text-ink-soft">Bot separado, conectado por QR code (`npm run whatsapp:bot`).</p>

      <div className="mt-6 grid gap-5">
        <Uso rotulo="Enviadas hoje" usado={enviadasHoje} limite={config.whatsapp_limite_por_dia} />
        <Uso rotulo="Nesta hora" usado={nestaHora} limite={config.whatsapp_limite_por_hora} />
      </div>
      <p className="mt-5 text-sm text-ink-faint">
        Entre uma mensagem e outra o sistema espera de {config.whatsapp_atraso_min_segundos} a {config.whatsapp_atraso_max_segundos} segundos,
        sorteado, pro número não ser bloqueado.
      </p>
      <Button
        variant="secondary"
        className="mt-5 w-full"
        icon={<RefreshCwIcon className="h-4 w-4" aria-hidden="true" />}
        onClick={() =>
          toast('Para reconectar, rode "npm run whatsapp:bot" no servidor e leia o QR code no terminal.')
        }
      >
        Reconectar com QR code
      </Button>
    </GlassPanel>
  );
}
