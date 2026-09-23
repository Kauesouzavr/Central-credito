'use client';

import { useEffect, useState } from 'react';
import { formatarMoeda } from '../../../lib/util';
import { registrarPagamentoParcial } from '../../clientes/[id]/actions';
import { Button } from '../ui/Button';
import { FormaPagamentoPicker } from '../ui/FormaPagamentoPicker';
import { Modal } from '../ui/Modal';
import { TextField } from '../ui/TextField';

function lerValor(texto) {
  const numero = Number(String(texto).trim().replace(',', '.'));
  return Number.isFinite(numero) ? numero : NaN;
}

function arredondar(valor) {
  return Math.round(valor * 100) / 100;
}

function valorParaCampo(valor) {
  return valor.toFixed(2).replace('.', ',');
}

// `titulo` = a linha de titulos_com_saldo sendo paga, ou null (modal fechado).
export function PagamentoParcialModal({ titulo, clienteId, onClose }) {
  const [valor, setValor] = useState('');
  const [forma, setForma] = useState('Dinheiro');
  const [erro, setErro] = useState();

  useEffect(() => {
    if (titulo) {
      setValor('');
      setErro(undefined);
      setForma(titulo.forma_pagamento === 'A combinar' ? 'Dinheiro' : titulo.forma_pagamento);
    }
  }, [titulo]);

  const restante = titulo ? Number(titulo.valor_restante) : 0;
  const numero = lerValor(valor);
  const valido = !Number.isNaN(numero) && numero > 0;
  const restanteDepois = titulo && valido ? Math.max(0, arredondar(restante - numero)) : null;

  function aoSubmeter(e) {
    if (!valido) {
      e.preventDefault();
      setErro('Coloque quanto o cliente pagou.');
      return;
    }
    if (numero > restante) {
      e.preventDefault();
      setErro(`O valor passa do que falta (${formatarMoeda(restante)}).`);
    }
  }

  return (
    <Modal
      open={Boolean(titulo)}
      onClose={onClose}
      title="Pagamento parcial"
      description={titulo ? `${titulo.produto} · falta ${formatarMoeda(restante)}` : undefined}
    >
      {titulo && (
        <form action={registrarPagamentoParcial} onSubmit={aoSubmeter} className="grid gap-6">
          <input type="hidden" name="cliente_id" value={clienteId} />
          <input type="hidden" name="titulo_id" value={titulo.id} />
          <div>
            <TextField
              label="Quanto o cliente pagou?"
              name="valor"
              leading="R$"
              inputMode="decimal"
              placeholder="0,00"
              value={valor}
              onChange={(e) => {
                setValor(e.target.value);
                setErro(undefined);
              }}
              error={erro}
              autoFocus
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setValor(valorParaCampo(arredondar(restante / 2)))}>
                Metade · {formatarMoeda(arredondar(restante / 2))}
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setValor(valorParaCampo(restante))}>
                Tudo · {formatarMoeda(restante)}
              </Button>
            </div>
          </div>
          <FormaPagamentoPicker value={forma} onChange={setForma} name="forma_pagamento" label="Como pagou" />
          {restanteDepois !== null && !erro && (
            <p className="rounded-2xl bg-white/80 px-4 py-3 text-lg text-ink ring-1 ring-line">
              {restanteDepois > 0 ? (
                <>
                  Depois deste pagamento, falta <strong className="tabular-nums">{formatarMoeda(restanteDepois)}</strong>.
                </>
              ) : (
                <>
                  Esta compra fica <strong>quitada</strong>.
                </>
              )}
            </p>
          )}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" size="lg" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="lg">
              Registrar pagamento
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
