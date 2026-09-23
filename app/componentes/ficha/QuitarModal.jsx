'use client';

import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { FormaPagamentoPicker } from '../ui/FormaPagamentoPicker';
import { Modal } from '../ui/Modal';

// Genérico: serve tanto pra "marcar 1 título como pago" quanto pra "marcar
// tudo como pago" — `action` é a Server Action certa em cada caso, `campos`
// são os inputs escondidos que ela espera (cliente_id, e titulo_id se for
// um título só).
export function QuitarModal({ open, action, campos, titulo, descricao, formaInicial = 'Dinheiro', rotuloConfirmar, onClose }) {
  const [forma, setForma] = useState(formaInicial);

  useEffect(() => {
    if (open) setForma(formaInicial === 'A combinar' ? 'Dinheiro' : formaInicial);
  }, [open, formaInicial]);

  return (
    <Modal open={open} onClose={onClose} title={titulo} description={descricao}>
      <form action={action} className="grid gap-6">
        {Object.entries(campos).map(([nome, valor]) => (
          <input key={nome} type="hidden" name={nome} value={valor} />
        ))}
        <FormaPagamentoPicker value={forma} onChange={setForma} name="forma_pagamento" label="Como pagou" />
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" size="lg" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" size="lg" autoFocus>
            {rotuloConfirmar}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
