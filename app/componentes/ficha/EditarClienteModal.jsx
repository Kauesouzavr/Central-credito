'use client';

import { atualizarCliente } from '../../clientes/[id]/actions';
import { ClienteFields } from '../forms/ClienteFields';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export function EditarClienteModal({ open, cliente, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Editar dados">
      <form action={atualizarCliente} className="grid gap-6">
        <input type="hidden" name="cliente_id" value={cliente.id} />
        <ClienteFields cliente={cliente} />
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" size="lg" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" size="lg">
            Salvar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
