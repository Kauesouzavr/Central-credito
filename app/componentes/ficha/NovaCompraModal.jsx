'use client';

import { hojeBrasil, somarDias } from '../../../lib/util';
import { adicionarCompra } from '../../clientes/[id]/nova-compra/actions';
import { CompraFields } from '../forms/CompraFields';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export function NovaCompraModal({ open, clienteId, nomeCliente, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nova compra"
      description={`Para ${nomeCliente}. As outras compras continuam como estão.`}
    >
      <form action={adicionarCompra} className="grid gap-6">
        <input type="hidden" name="cliente_id" value={clienteId} />
        <CompraFields vencimentoPadrao={somarDias(hojeBrasil(), 30)} autoFocus />
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" size="lg" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" size="lg">
            Adicionar compra
          </Button>
        </div>
      </form>
    </Modal>
  );
}
