'use client';

import { useMemo, useState } from 'react';
import { calcularRisco } from '../../../lib/risco';
import { ROTULO_NIVEL } from '../../../lib/risco-ui';
import { salvarAjustes } from '../../ajustes/actions';
import { Button } from '../ui/Button';
import { GlassPanel } from '../ui/GlassPanel';
import { NumberStepper } from '../ui/NumberStepper';

const CORES_NIVEL = { alto: 'bg-brand-500', medio: 'bg-warn-500', baixo: 'bg-ok-500' };
const ORDEM = ['alto', 'medio', 'baixo'];

function valoresDe(config) {
  return {
    limite_atraso: Number(config.limite_atraso),
    peso_mudanca_padrao: Number(config.peso_mudanca_padrao),
    corte_risco_alto: Number(config.corte_risco_alto),
    corte_risco_medio: Number(config.corte_risco_medio),
    dias_antes_aviso: Number(config.dias_antes_aviso),
    dias_repetir_cobranca: Number(config.dias_repetir_cobranca),
    whatsapp_limite_por_hora: Number(config.whatsapp_limite_por_hora),
    whatsapp_limite_por_dia: Number(config.whatsapp_limite_por_dia),
  };
}

// `clientesTitulos` = [{ id, titulos }] (títulos de titulos_com_saldo de cada
// cliente que tem pelo menos um título). `ultimoPagamento` = mesmo mapa que
// lib/carregar-risco.js usa pra saber se um título quitado foi pago em dia.
export function AjustesInterativo({ config, clientesTitulos, ultimoPagamento }) {
  const inicial = useMemo(() => valoresDe(config), [config]);
  const [rascunho, setRascunho] = useState(inicial);
  const [salvando, setSalvando] = useState(false);
  const set = (campo) => (valor) => setRascunho((r) => ({ ...r, [campo]: valor }));

  const alterado = JSON.stringify(rascunho) !== JSON.stringify(inicial);
  const cortesInvalidos = rascunho.corte_risco_medio >= rascunho.corte_risco_alto;

  const previa = useMemo(() => {
    const contagem = { alto: 0, medio: 0, baixo: 0 };
    const configRascunho = { ...config, ...rascunho };
    for (const { titulos } of clientesTitulos) {
      const temAberto = titulos.some((t) => Number(t.valor_restante) > 0);
      if (!temAberto) continue;
      const risco = calcularRisco(titulos, ultimoPagamento, configRascunho);
      contagem[risco.nivel] += 1;
    }
    return contagem;
  }, [clientesTitulos, rascunho, ultimoPagamento, config]);
  const totalPrevia = previa.alto + previa.medio + previa.baixo;

  async function salvar() {
    if (cortesInvalidos) return;
    setSalvando(true);
    await salvarAjustes(rascunho);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <div className="grid gap-8">
        <GlassPanel as="section" aria-labelledby="aj-risco" className="px-6 pt-6 sm:px-8">
          <h2 id="aj-risco" className="text-2xl font-extrabold tracking-tight text-ink">
            Risco
          </h2>
          <div className="divide-y divide-line">
            <NumberStepper
              label="Limite de atraso"
              description="Passou disso, o cliente ganha o maior peso de risco."
              value={rascunho.limite_atraso}
              onChange={set('limite_atraso')}
              min={1}
              max={120}
              unidade="dias"
            />
            <NumberStepper
              label="Peso da mudança"
              description="Quanto pesa quando o cliente atrasa mais do que costuma."
              value={rascunho.peso_mudanca_padrao}
              onChange={set('peso_mudanca_padrao')}
              min={0}
              max={50}
            />
            <NumberStepper
              label="Risco alto a partir de"
              description="Índice de 0 a 100."
              value={rascunho.corte_risco_alto}
              onChange={set('corte_risco_alto')}
              min={2}
              max={100}
            />
            <NumberStepper
              label="Risco médio a partir de"
              description="Abaixo disso, o risco é baixo."
              value={rascunho.corte_risco_medio}
              onChange={set('corte_risco_medio')}
              min={1}
              max={99}
            />
          </div>
          {cortesInvalidos && (
            <p className="pb-5 text-base font-semibold text-brand-700">O risco médio precisa começar abaixo do risco alto.</p>
          )}
        </GlassPanel>

        <GlassPanel as="section" aria-labelledby="aj-cobranca" className="px-6 pt-6 sm:px-8">
          <h2 id="aj-cobranca" className="text-2xl font-extrabold tracking-tight text-ink">
            Cobrança
          </h2>
          <div className="divide-y divide-line">
            <NumberStepper
              label="Avisar antes do vencimento"
              description="Lembrete amigável antes do dia de pagar."
              value={rascunho.dias_antes_aviso}
              onChange={set('dias_antes_aviso')}
              min={1}
              max={15}
              unidade="dias"
            />
            <NumberStepper
              label="Repetir cobrança a cada"
              description="Depois de vencido, até a compra ser quitada."
              value={rascunho.dias_repetir_cobranca}
              onChange={set('dias_repetir_cobranca')}
              min={1}
              max={30}
              unidade="dias"
            />
            <NumberStepper
              label="Máximo por hora"
              description="Mensagens de WhatsApp em uma hora."
              value={rascunho.whatsapp_limite_por_hora}
              onChange={set('whatsapp_limite_por_hora')}
              min={1}
              max={60}
            />
            <NumberStepper
              label="Máximo por dia"
              description="Mensagens de WhatsApp em um dia."
              value={rascunho.whatsapp_limite_por_dia}
              onChange={set('whatsapp_limite_por_dia')}
              min={10}
              max={500}
              step={10}
            />
          </div>
        </GlassPanel>
      </div>

      <GlassPanel strong as="aside" aria-labelledby="aj-previa" className="p-6 lg:sticky lg:top-32">
        <h2 id="aj-previa" className="text-xl font-extrabold tracking-tight text-ink">
          Com esses números
        </h2>
        <p className="mt-1 text-base text-ink-soft">Como ficariam os {totalPrevia} clientes com saldo em aberto.</p>
        <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-line" aria-hidden="true">
          {ORDEM.map((f) => (
            <div key={f} className={CORES_NIVEL[f]} style={{ width: `${totalPrevia ? (previa[f] / totalPrevia) * 100 : 0}%` }} />
          ))}
        </div>
        <ul className="mt-5 grid gap-3">
          {ORDEM.map((f) => (
            <li key={f} className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-3 text-ink">
                <span className={`h-3 w-3 rounded-full ${CORES_NIVEL[f]}`} aria-hidden="true" />
                {ROTULO_NIVEL[f]}
              </span>
              <span className="font-extrabold tabular-nums text-ink">{previa[f]}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 grid gap-3 border-t border-line pt-6">
          <Button size="lg" disabled={!alterado || cortesInvalidos || salvando} onClick={salvar}>
            Salvar ajustes
          </Button>
          <Button variant="ghost" disabled={!alterado || salvando} onClick={() => setRascunho(inicial)}>
            Desfazer mudanças
          </Button>
        </div>
      </GlassPanel>
    </div>
  );
}
