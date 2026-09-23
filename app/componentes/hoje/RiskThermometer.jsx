'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { formatarMoedaCurta } from '../../../lib/util';

const TAMANHO = 400;
const ESPESSURA = 30;
const RAIO = TAMANHO / 2 - ESPESSURA / 2 - 20;
const MARCAS = 72;
const CENTRO = TAMANHO / 2;

export function RiskThermometer({ vencido, totalAberto }) {
  const reduzir = useReducedMotion();
  const fracao = totalAberto > 0 ? Math.min(1, vencido / totalAberto) : 0;
  const pct = Math.round(fracao * 100);
  const transicao = { duration: reduzir ? 0 : 0.3, ease: [0.23, 1, 0.32, 1] };

  return (
    <figure
      className="relative mx-auto aspect-square w-full max-w-[420px]"
      aria-label={`${formatarMoedaCurta(vencido)} vencidos de ${formatarMoedaCurta(totalAberto)} em aberto, ${pct}%`}
    >
      <svg viewBox={`0 0 ${TAMANHO} ${TAMANHO}`} className="h-full w-full -rotate-90 overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id="termometro-arco" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF8A7C" />
            <stop offset="45%" stopColor="#E23B2E" />
            <stop offset="100%" stopColor="#9E1A12" />
          </linearGradient>
          <filter id="termometro-brilho" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="9" result="desfoque" />
            <feColorMatrix
              in="desfoque"
              type="matrix"
              values="1 0 0 0 0  0 0.25 0 0 0  0 0 0.2 0 0  0 0 0 0.55 0"
              result="halo"
            />
            <feMerge>
              <feMergeNode in="halo" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {Array.from({ length: MARCAS }).map((_, i) => {
          const angulo = (i / MARCAS) * Math.PI * 2;
          const longa = i % 6 === 0;
          const r1 = TAMANHO / 2 - (longa ? 10 : 6);
          const r2 = TAMANHO / 2 - 1;
          return (
            <line
              key={i}
              x1={CENTRO + Math.cos(angulo) * r1}
              y1={CENTRO + Math.sin(angulo) * r1}
              x2={CENTRO + Math.cos(angulo) * r2}
              y2={CENTRO + Math.sin(angulo) * r2}
              stroke={i / MARCAS < fracao ? '#F1675B' : '#E6D8D4'}
              strokeWidth={longa ? 2.5 : 1.5}
              strokeLinecap="round"
            />
          );
        })}

        <circle cx={CENTRO} cy={CENTRO} r={RAIO} fill="none" stroke="#F3E6E2" strokeWidth={ESPESSURA} />
        <motion.circle
          cx={CENTRO}
          cy={CENTRO}
          r={RAIO}
          fill="none"
          stroke="url(#termometro-arco)"
          strokeWidth={ESPESSURA}
          strokeLinecap="round"
          filter="url(#termometro-brilho)"
          initial={{ pathLength: reduzir ? fracao : 0 }}
          animate={{ pathLength: fracao }}
          transition={transicao}
        />
        <motion.circle
          cx={CENTRO}
          cy={CENTRO}
          r={RAIO + ESPESSURA / 2 - 7}
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={3}
          strokeLinecap="round"
          initial={{ pathLength: reduzir ? fracao * 0.96 : 0 }}
          animate={{ pathLength: fracao * 0.96 }}
          transition={transicao}
        />
      </svg>

      <div className="glass-disk absolute inset-[19%] flex flex-col items-center justify-center rounded-full px-4 text-center">
        <span className="text-base font-semibold text-ink-soft">Vencido em aberto</span>
        <strong className="mt-1 text-[clamp(2.1rem,4.6vw,3.3rem)] font-extrabold leading-none tracking-tight tabular-nums text-brand-700">
          {formatarMoedaCurta(vencido)}
        </strong>
        <span className="mt-3 text-base text-ink-soft">
          de <span className="font-bold tabular-nums text-ink">{formatarMoedaCurta(totalAberto)}</span> na rua
        </span>
        <span className="mt-4 rounded-full bg-brand-50 px-3 py-1 text-sm font-bold tabular-nums text-brand-700 ring-1 ring-brand-100">
          {pct}% já venceu
        </span>
      </div>
    </figure>
  );
}
