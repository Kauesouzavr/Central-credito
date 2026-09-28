'use client';

import { formatarMoedaDigitada } from '../../../lib/util';
import { FormaPagamentoPicker } from '../ui/FormaPagamentoPicker';
import { TextField } from '../ui/TextField';

function aoDigitarValor(evento) {
  evento.target.value = formatarMoedaDigitada(evento.target.value);
}

export function CompraFields({ vencimentoPadrao, autoFocus }) {
  return (
    <div className="grid gap-5">
      <TextField label="O que comprou" name="produto" placeholder="Ex.: Sandália e bolsa" required autoFocus={autoFocus} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Valor"
          name="valor"
          leading="R$"
          inputMode="decimal"
          placeholder="0,00"
          onChange={aoDigitarValor}
          required
        />
        <TextField label="Vence em" name="data_vencimento" type="date" defaultValue={vencimentoPadrao} required />
      </div>
      <FormaPagamentoPicker name="forma_pagamento" />
    </div>
  );
}
