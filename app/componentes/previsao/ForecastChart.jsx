'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatarData, formatarMoeda, formatarMoedaCurta } from '../../../lib/util';

// `periodo.de`/`periodo.ate` são null só pro período "Já vencidos".
function intervalo(periodo) {
  if (!periodo.de) return 'títulos já vencidos';
  return `${formatarData(periodo.de)} a ${formatarData(periodo.ate)}`;
}

function Dica({ active, payload }) {
  if (!active || !payload?.length) return null;
  const periodo = payload[0].payload;
  return (
    <div className="glass-strong rounded-2xl px-4 py-3 text-base">
      <p className="font-extrabold text-ink">{periodo.rotulo}</p>
      <p className="text-sm text-ink-faint">{intervalo(periodo)}</p>
      <p className="mt-2 flex justify-between gap-6 text-ink-soft">
        Vence <span className="font-bold tabular-nums text-ink">{formatarMoeda(periodo.saldo)}</span>
      </p>
      <p className="flex justify-between gap-6 text-ink-soft">
        Deve entrar <span className="font-bold tabular-nums text-brand-700">{formatarMoeda(periodo.previsto)}</span>
      </p>
    </div>
  );
}

export function ForecastChart({ periodos }) {
  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={periodos} barGap={8} margin={{ top: 16, right: 8, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="barra-ajustada" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F1675B" />
              <stop offset="100%" stopColor="#A31C13" />
            </linearGradient>
            <linearGradient id="barra-soma" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FBE1DD" />
              <stop offset="100%" stopColor="#F4CBC5" />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#ECE2DF" />
          <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tick={{ fill: '#5B4F4C', fontSize: 15, fontWeight: 700 }} dy={8} />
          <YAxis tickFormatter={(v) => formatarMoedaCurta(v)} width={84} tickLine={false} axisLine={false} tick={{ fill: '#8E817E', fontSize: 13 }} />
          <Tooltip cursor={{ fill: 'rgba(226,59,46,0.05)' }} content={<Dica />} />
          <Bar dataKey="saldo" name="Soma dos vencimentos" fill="url(#barra-soma)" radius={[12, 12, 4, 4]} maxBarSize={64} animationDuration={300} />
          <Bar dataKey="previsto" name="Previsão ajustada" fill="url(#barra-ajustada)" radius={[12, 12, 4, 4]} maxBarSize={64} animationDuration={300} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
