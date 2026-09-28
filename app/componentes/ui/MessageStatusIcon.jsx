import { AlertTriangleIcon, CheckIcon, ClockIcon, UserCheckIcon } from 'lucide-react';

// Status reais de `mensagens` (schema): 'pendente' | 'pendente_revisao' |
// 'enviada' | 'erro' — não existe confirmação de entrega/leitura do
// WhatsApp neste sistema.
export function MessageStatusIcon({ status }) {
  if (status === 'pendente') return <ClockIcon className="h-4 w-4 text-ink-faint" aria-hidden="true" />;
  if (status === 'pendente_revisao') return <UserCheckIcon className="h-4 w-4 text-warn-700" aria-hidden="true" />;
  if (status === 'erro') return <AlertTriangleIcon className="h-4 w-4 text-brand-700" aria-hidden="true" />;
  return <CheckIcon className="h-4 w-4 text-ink-faint" aria-hidden="true" />;
}
