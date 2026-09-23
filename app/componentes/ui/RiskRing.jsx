'use client';

import { useId } from 'react';
import { CORES_ANEL } from '../../../lib/risco-ui';

export function RiskRing({ nota, nivel, size = 64, stroke }) {
  const id = useId().replace(/:/g, '');
  const espessura = stroke ?? Math.max(5, size * 0.1);
  const raio = (size - espessura) / 2;
  const circ = 2 * Math.PI * raio;
  const [inicio, fim] = CORES_ANEL[nivel];

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Índice de risco ${nota} de 100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={inicio} />
            <stop offset="100%" stopColor={fim} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={raio} fill="none" stroke="#F1E6E3" strokeWidth={espessura} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={raio}
          fill="none"
          stroke={`url(#g${id})`}
          strokeWidth={espessura}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - Math.min(100, nota) / 100)}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-extrabold tabular-nums text-ink"
        style={{ fontSize: Math.max(13, size * 0.3) }}
      >
        {Math.floor(nota)}
      </span>
    </div>
  );
}
