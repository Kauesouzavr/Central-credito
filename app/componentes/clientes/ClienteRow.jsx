import Link from 'next/link';
import { ChevronRightIcon, Trash2Icon } from 'lucide-react';
import { formatarMoeda, plural } from '../../../lib/util';
import { excluirCliente } from '../../clientes/[id]/actions';
import BotaoAcao from '../BotaoAcao';
import { Avatar } from '../ui/Avatar';
import { RiskBadge } from '../ui/RiskBadge';

export const colunasClientes = 'lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.2fr)_20px]';

function localidade(cliente) {
  return [cliente.bairro, cliente.cidade].filter(Boolean).join(', ');
}

export function ClienteRow({ cliente }) {
  const { risco } = cliente;
  const local = localidade(cliente);
  return (
    <li className="flex items-center gap-1">
      <Link
        href={`/clientes/${cliente.id}`}
        className={`group grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 rounded-2xl px-3 py-4 transition-colors duration-150 hover:bg-white/80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 sm:px-4 lg:gap-6 ${colunasClientes}`}
      >
        <div className="col-span-2 flex min-w-0 items-center gap-4 lg:col-span-1">
          <Avatar nome={cliente.nome} nivel={risco.nivel} />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-ink">{cliente.nome}</p>
            <p className="truncate text-base text-ink-soft">
              {local ? `${local} · ` : ''}
              {cliente.telefone}
            </p>
          </div>
        </div>
        <p className="hidden text-base text-ink lg:block">
          <span className="font-bold tabular-nums">{cliente.titulosAbertos}</span>
          <span className="text-ink-soft"> {plural(cliente.titulosAbertos, 'compra', 'compras')}</span>
        </p>
        <p className={`hidden text-base font-bold tabular-nums lg:block ${cliente.atrasoMaximo > 0 ? 'text-brand-700' : 'text-ink-faint'}`}>
          {cliente.atrasoMaximo > 0 ? `${cliente.atrasoMaximo} dias` : 'Em dia'}
        </p>
        <p className="row-start-1 text-right text-lg font-extrabold tabular-nums text-ink lg:row-auto lg:text-left">
          {formatarMoeda(cliente.valorAberto)}
        </p>
        <div className="col-span-2 pl-16 lg:col-span-1 lg:pl-0">
          <RiskBadge nivel={risco.nivel} nota={risco.nota} />
        </div>
        <ChevronRightIcon
          className="hidden h-5 w-5 text-ink-faint transition-transform duration-150 group-hover:translate-x-0.5 lg:block"
          aria-hidden="true"
        />
      </Link>
      <form action={excluirCliente}>
        <input type="hidden" name="cliente_id" value={cliente.id} />
        <BotaoAcao
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ink-faint transition-colors duration-150 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200"
          confirmar={`Excluir ${cliente.nome}? Isso remove todo o histórico de compras e mensagens dele.`}
          textoEnviando="..."
        >
          <Trash2Icon className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">Excluir {cliente.nome}</span>
        </BotaoAcao>
      </form>
    </li>
  );
}
