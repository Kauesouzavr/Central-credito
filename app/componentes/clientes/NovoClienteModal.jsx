'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { hojeBrasil, somarDias } from '../../../lib/util';
import { criarCliente } from '../../clientes/novo/actions';
import { ClienteFields } from '../forms/ClienteFields';
import { CompraFields } from '../forms/CompraFields';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

// Aberto/fechado vem da URL (`?novo=1`), não de useState local: se a Server
// Action redirecionar de volta com `?erro=` (validação falhou), a navegação
// não pode fechar o modal escondendo o erro — só fecha quando o parâmetro
// some de verdade (Cancelar, ou sucesso levando pra outra rota).
export function NovoClienteModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const aberto = searchParams.get('novo') === '1';
  const fechar = () => router.push('/clientes');

  return (
    <Modal
      open={aberto}
      onClose={fechar}
      title="Novo cliente"
      description="Cadastre o cliente e a primeira compra de uma vez."
      size="lg"
    >
      <form action={criarCliente} className="grid gap-8">
        <section aria-labelledby="novo-quem" className="grid gap-4">
          <h3 id="novo-quem" className="text-lg font-extrabold text-ink">
            Quem é
          </h3>
          <ClienteFields autoFocus />
        </section>
        <section aria-labelledby="novo-compra" className="grid gap-4 border-t border-line pt-6">
          <h3 id="novo-compra" className="text-lg font-extrabold text-ink">
            Primeira compra
          </h3>
          <CompraFields vencimentoPadrao={somarDias(hojeBrasil(), 30)} />
        </section>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" size="lg" onClick={fechar}>
            Cancelar
          </Button>
          <Button type="submit" size="lg">
            Cadastrar cliente
          </Button>
        </div>
      </form>
    </Modal>
  );
}
