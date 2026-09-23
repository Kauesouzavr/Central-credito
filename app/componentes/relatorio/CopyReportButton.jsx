'use client';

import { CopyIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/Button';

export function CopyReportButton({ texto }) {
  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success('Relatório copiado', { description: 'Agora é só colar no WhatsApp ou no e-mail.' });
    } catch {
      toast.error('Não deu para copiar', { description: 'Selecione o texto e copie manualmente.' });
    }
  }

  return (
    <Button size="lg" icon={<CopyIcon className="h-5 w-5" aria-hidden="true" />} onClick={copiar}>
      Copiar relatório
    </Button>
  );
}
