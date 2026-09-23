import Link from 'next/link';
import { twMerge } from 'tailwind-merge';
import { GlassPanel } from '../ui/GlassPanel';

const IMEDIATOS = [
  { titulo: 'Cliente cadastrado', texto: 'Boas-vindas com a compra e o vencimento.' },
  { titulo: 'Nova compra', texto: 'Mensagem mais curta, confirmando o valor.' },
  { titulo: 'Pagamento parcial', texto: 'Confirma o que entrou e quanto falta.' },
];

export function ReguaTimeline({ config }) {
  const a = Number(config.dias_antes_aviso);
  const y = Number(config.dias_repetir_cobranca);
  const pontos = [
    { dia: -a, marca: `${a} ${a === 1 ? 'dia' : 'dias'} antes`, titulo: 'Lembrete' },
    { dia: 0, marca: 'Vencimento', titulo: 'Aviso do dia', principal: true },
    { dia: y, marca: `+${y} dias`, titulo: 'Cobrança' },
    { dia: y * 2, marca: `+${y * 2} dias`, titulo: 'Cobrança' },
    { dia: y * 3, marca: `+${y * 3} dias`, titulo: `Repete a cada ${y}`, continua: true },
  ];

  const min = -a - 1.5;
  const max = y * 3 + 2.5;
  const pos = (dia) => ((dia - min) / (max - min)) * 100;

  return (
    <GlassPanel strong as="section" aria-labelledby="regua-titulo" className="p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="regua-titulo" className="text-2xl font-extrabold tracking-tight text-ink">
          Régua de cada compra
        </h2>
        <Link
          href="/ajustes"
          className="rounded-lg text-base font-bold text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200"
        >
          Mudar os dias
        </Link>
      </div>
      <p className="mt-1 text-base text-ink-soft">Cada compra tem o seu próprio calendário. Quando fica quitada, as mensagens dela param na hora.</p>

      <div className="mt-6 overflow-x-auto pb-2">
        <ol className="relative h-40 min-w-[680px]" aria-label="Momentos de envio em relação ao vencimento">
          <span className="absolute left-0 right-0 top-[42px] h-1 rounded-full bg-line" aria-hidden="true" />
          <span className="bar-fill absolute right-0 top-[42px] h-1 rounded-full opacity-70" style={{ left: `${pos(0)}%` }} aria-hidden="true" />
          {pontos.map((p) => (
            <li
              key={p.dia}
              className="absolute top-0 flex w-36 -translate-x-1/2 flex-col items-center text-center"
              style={{ left: `${pos(p.dia)}%` }}
            >
              <span className={twMerge('h-7 text-sm font-bold tabular-nums', p.principal ? 'text-brand-700' : 'text-ink-faint')}>{p.marca}</span>
              <span
                className={twMerge(
                  'mt-1 rounded-full',
                  p.principal
                    ? 'brand-mark h-7 w-7 ring-4 ring-white'
                    : p.dia > 0
                      ? 'h-5 w-5 bg-brand-500 ring-4 ring-white'
                      : 'h-5 w-5 bg-white ring-4 ring-brand-200'
                )}
                aria-hidden="true"
              />
              <span className="mt-3 text-base font-extrabold text-ink">{p.titulo}</span>
              {p.continua && <span className="text-sm text-ink-faint">até quitar</span>}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-4 border-t border-line pt-5">
        <p className="text-base font-bold text-ink">Também sai na hora, sem esperar a régua:</p>
        <ul className="mt-3 grid gap-4 sm:grid-cols-3">
          {IMEDIATOS.map((i) => (
            <li key={i.titulo}>
              <p className="text-base font-bold text-ink">{i.titulo}</p>
              <p className="text-base text-ink-soft">{i.texto}</p>
            </li>
          ))}
        </ul>
      </div>
    </GlassPanel>
  );
}
