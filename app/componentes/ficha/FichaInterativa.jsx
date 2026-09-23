'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, CheckCheckIcon, PencilIcon, PhoneIcon, PlusIcon } from 'lucide-react';
import { classesBotao } from '../../../lib/buttonStyles';
import { formatarMoeda } from '../../../lib/util';
import { ROTULO_NIVEL } from '../../../lib/risco-ui';
import { marcarTituloComoPago, marcarTudoComoPago } from '../../clientes/[id]/actions';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { GlassPanel } from '../ui/GlassPanel';
import { RiskRing } from '../ui/RiskRing';
import { ConversaWhatsApp } from './ConversaWhatsApp';
import { EditarClienteModal } from './EditarClienteModal';
import { NovaCompraModal } from './NovaCompraModal';
import { PagamentoParcialModal } from './PagamentoParcialModal';
import { QuitarModal } from './QuitarModal';
import { TituloCard } from './TituloCard';

// `acao` guia qual modal está aberto: null | {tipo:'parcial'|'quitar', titulo}
// | {tipo:'quitarTudo'} | {tipo:'compra'} | {tipo:'editar'}.
export function FichaInterativa({ cliente, risco, titulos, mensagens, hoje }) {
  const [acao, setAcao] = useState(null);
  const [verQuitadas, setVerQuitadas] = useState(false);
  const fechar = () => setAcao(null);

  const abertos = titulos.filter((t) => Number(t.valor_restante) > 0);
  const quitados = titulos.filter((t) => Number(t.valor_restante) <= 0);
  const jaPago = titulos.reduce((s, t) => s + Number(t.valor_pago), 0);
  const totalAberto = abertos.reduce((s, t) => s + Number(t.valor_restante), 0);
  const temVencido = abertos.some((t) => t.status === 'atrasado');
  const primeiroNome = cliente.nome.trim().split(' ')[0];

  return (
    <div>
      <Link
        href="/clientes"
        className="mb-6 inline-flex items-center gap-2 rounded-lg text-base font-bold text-ink-soft hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200"
      >
        <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
        Clientes
      </Link>

      <GlassPanel
        strong
        as="section"
        aria-label="Dados do cliente"
        className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:items-center"
      >
        <div className="flex min-w-0 items-start gap-5">
          <Avatar nome={cliente.nome} nivel={risco.nivel} size="lg" />
          <div className="min-w-0">
            <h1 className="text-4xl font-extrabold tracking-tight text-ink">{cliente.nome}</h1>
            {cliente.segmento && <p className="mt-1 text-lg text-ink-soft">{cliente.segmento}</p>}
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-base text-ink">
              <a
                href={`tel:${cliente.telefone.replace(/\D/g, '')}`}
                className="inline-flex items-center gap-2 rounded-lg font-semibold hover:text-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200"
              >
                <PhoneIcon className="h-4 w-4 text-ink-faint" aria-hidden="true" />
                {cliente.telefone}
              </a>
              {cliente.telefone_reserva && (
                <span className="inline-flex items-center gap-2 text-ink-soft">
                  <PhoneIcon className="h-4 w-4 text-ink-faint" aria-hidden="true" />
                  {cliente.telefone_reserva}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 mt-3"
              icon={<PencilIcon className="h-4 w-4" aria-hidden="true" />}
              onClick={() => setAcao({ tipo: 'editar' })}
            >
              Editar dados
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-5 rounded-3xl bg-white/70 p-5 ring-1 ring-line">
          <RiskRing nota={risco.nota} nivel={risco.nivel} size={104} />
          <div>
            <p className="text-lg font-extrabold text-ink">{ROTULO_NIVEL[risco.nivel]}</p>
            <p className="mt-1 text-base leading-relaxed text-ink-soft">{risco.motivos.join(' ')}</p>
          </div>
        </div>
      </GlassPanel>

      <section aria-label="Resumo e ações" className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <dl className="grid grid-cols-3 gap-6 sm:gap-12">
          <div>
            <dt className="text-base text-ink-soft">Em aberto</dt>
            <dd className={`text-3xl font-extrabold tabular-nums sm:text-4xl ${temVencido ? 'text-brand-700' : 'text-ink'}`}>
              {formatarMoeda(totalAberto)}
            </dd>
          </div>
          <div>
            <dt className="text-base text-ink-soft">Já pagou</dt>
            <dd className="text-3xl font-extrabold tabular-nums text-ink sm:text-4xl">{formatarMoeda(jaPago)}</dd>
          </div>
          <div>
            <dt className="text-base text-ink-soft">Compras abertas</dt>
            <dd className="text-3xl font-extrabold tabular-nums text-ink sm:text-4xl">{abertos.length}</dd>
          </div>
        </dl>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="secondary"
            size="lg"
            icon={<PlusIcon className="h-5 w-5" aria-hidden="true" />}
            onClick={() => setAcao({ tipo: 'compra' })}
          >
            Adicionar nova compra
          </Button>
          <Button
            size="lg"
            icon={<CheckCheckIcon className="h-5 w-5" aria-hidden="true" />}
            disabled={!abertos.length}
            onClick={() => setAcao({ tipo: 'quitarTudo' })}
          >
            Marcar tudo como pago
          </Button>
        </div>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <section aria-labelledby="compras-titulo">
          <h2 id="compras-titulo" className="mb-4 text-2xl font-extrabold tracking-tight text-ink">
            Compras em aberto
          </h2>
          {abertos.length === 0 ? (
            <GlassPanel className="p-8 text-center">
              <p className="text-xl font-extrabold text-ok-700">Tudo pago</p>
              <p className="mt-1 text-ink-soft">{primeiroNome} não tem nenhuma compra em aberto.</p>
            </GlassPanel>
          ) : (
            <div className="grid gap-4">
              {abertos.map((t) => (
                <TituloCard
                  key={t.id}
                  titulo={t}
                  hoje={hoje}
                  onParcial={() => setAcao({ tipo: 'parcial', titulo: t })}
                  onQuitar={() => setAcao({ tipo: 'quitar', titulo: t })}
                />
              ))}
            </div>
          )}

          {quitados.length > 0 && (
            <div className="mt-8">
              <Button variant="ghost" onClick={() => setVerQuitadas((v) => !v)} aria-expanded={verQuitadas}>
                {verQuitadas ? 'Esconder compras quitadas' : `Ver compras quitadas (${quitados.length})`}
              </Button>
              {verQuitadas && (
                <div className="mt-4 grid gap-4">
                  {quitados.map((t) => (
                    <TituloCard key={t.id} titulo={t} hoje={hoje} />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <aside>
          <ConversaWhatsApp nome={primeiroNome} mensagens={mensagens} />
        </aside>
      </div>

      <PagamentoParcialModal
        titulo={acao?.tipo === 'parcial' ? acao.titulo : null}
        clienteId={cliente.id}
        onClose={fechar}
      />

      <QuitarModal
        open={acao?.tipo === 'quitar'}
        action={marcarTituloComoPago}
        campos={acao?.tipo === 'quitar' ? { cliente_id: cliente.id, titulo_id: acao.titulo.id } : {}}
        titulo="Marcar como pago"
        descricao={acao?.tipo === 'quitar' ? `${acao.titulo.produto} · ${formatarMoeda(acao.titulo.valor_restante)} restante` : ''}
        formaInicial={acao?.tipo === 'quitar' ? acao.titulo.forma_pagamento : undefined}
        rotuloConfirmar="Confirmar pagamento"
        onClose={fechar}
      />

      <QuitarModal
        open={acao?.tipo === 'quitarTudo'}
        action={marcarTudoComoPago}
        campos={{ cliente_id: cliente.id }}
        titulo="Marcar tudo como pago"
        descricao={`${abertos.length} ${abertos.length === 1 ? 'compra' : 'compras'} · ${formatarMoeda(totalAberto)} no total`}
        rotuloConfirmar="Quitar tudo"
        onClose={fechar}
      />

      <NovaCompraModal
        open={acao?.tipo === 'compra'}
        clienteId={cliente.id}
        nomeCliente={cliente.nome}
        onClose={fechar}
      />

      <EditarClienteModal open={acao?.tipo === 'editar'} cliente={cliente} onClose={fechar} />
    </div>
  );
}
