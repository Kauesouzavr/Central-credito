// Aparência (cor, rótulo) por nível de risco — um único lugar, reaproveitado
// por RiskRing, RiskBadge, Avatar e EtiquetaRisco, pra nunca dessincronizar.

export const ROTULO_NIVEL = {
  alto: 'Risco alto',
  medio: 'Risco médio',
  baixo: 'Risco baixo',
};

// [cor inicial, cor final] do gradiente do anel de risco, por nível.
export const CORES_ANEL = {
  alto: ['#F1675B', '#A31C13'],
  medio: ['#F4BE5E', '#C9800F'],
  baixo: ['#72C9A0', '#2F9463'],
};

export const ESTILO_SELO = {
  alto: 'btn-primary-surface text-white',
  medio: 'bg-warn-100 text-warn-700 ring-1 ring-warn-500/25',
  baixo: 'bg-ok-50 text-ok-700 ring-1 ring-ok-500/20',
};

export const TOM_AVATAR = {
  alto: 'bg-brand-100 text-brand-700',
  medio: 'bg-warn-100 text-warn-700',
  baixo: 'bg-white text-ink-soft ring-1 ring-line',
};
