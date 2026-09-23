import { AlertTriangleIcon, CheckIcon, ClockIcon } from 'lucide-react';

// Status reais de `mensagens` (schema): 'pendente' | 'enviada' | 'erro' —
// não existe confirmação de entrega/leitura do WhatsApp neste sistema.
export function MessageStatusIcon({ status }) {
  if (status === 'pendente') return <ClockIcon className="h-4 w-4 text-ink-faint" aria-hidden="true" />;
  if (status === 'erro') return <AlertTriangleIcon className="h-4 w-4 text-brand-700" aria-hidden="true" />;
  return <CheckIcon className="h-4 w-4 text-ink-faint" aria-hidden="true" />;
}
