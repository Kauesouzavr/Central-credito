'use client';

import { useRef, useState } from 'react';
import { formatarCepDigitado, formatarTelefoneDigitado } from '../../../lib/util';
import { TextField } from '../ui/TextField';

// Só busca na ViaCEP e devolve o resultado — não escreve em nada. Quem chama
// decide se ainda vale a pena aplicar (a pessoa pode ter digitado outro CEP
// enquanto essa busca estava no ar).
async function buscarEnderecoPorCep(cepDigitado) {
  const digitos = cepDigitado.replace(/\D/g, '');
  if (digitos.length !== 8) return null;
  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
    const dados = await resposta.json();
    if (dados.erro) return { status: 'nao_encontrado' };
    return { status: 'ok', dados };
  } catch {
    return { status: 'erro' };
  }
}

// Campos com `name` nativo — o form em volta posta direto pra uma Server
// Action, sem estado React no meio (bairro/cidade/endereço continuam assim;
// o preenchimento automático pelo CEP escreve direto no DOM via ref, sem
// virar campo controlado).
export function ClienteFields({ cliente, autoFocus }) {
  const bairroRef = useRef(null);
  const cidadeRef = useRef(null);
  const enderecoRef = useRef(null);
  const [statusCep, setStatusCep] = useState(null); // null | 'buscando' | 'nao_encontrado' | 'erro'
  const buscaIdRef = useRef(0); // conta qual é a busca mais recente, pra ignorar respostas desatualizadas

  async function aoDigitarCep(evento) {
    evento.target.value = formatarCepDigitado(evento.target.value);
    const digitos = evento.target.value.replace(/\D/g, '');
    const minhaBuscaId = ++buscaIdRef.current;
    if (digitos.length < 8) {
      setStatusCep(null);
      return;
    }
    setStatusCep('buscando');
    const resultado = await buscarEnderecoPorCep(evento.target.value);

    // Enquanto essa busca estava no ar, a pessoa pode ter apagado e digitado
    // outro CEP — isso já disparou uma busca mais nova. Se não somos mais a
    // mais recente, ignora: aplicar agora sobrescreveria com um CEP errado.
    if (buscaIdRef.current !== minhaBuscaId) return;

    if (resultado?.status === 'ok') {
      const { dados } = resultado;
      if (bairroRef.current) bairroRef.current.value = dados.bairro || '';
      if (cidadeRef.current) cidadeRef.current.value = dados.localidade || '';
      if (enderecoRef.current && !enderecoRef.current.value) {
        enderecoRef.current.value = dados.logradouro || '';
      }
    }
    setStatusCep(resultado?.status === 'ok' ? null : (resultado?.status ?? null));
  }

  function aoDigitarTelefone(evento) {
    evento.target.value = formatarTelefoneDigitado(evento.target.value);
  }

  const dicaCep =
    statusCep === 'buscando'
      ? 'Buscando endereço...'
      : statusCep === 'nao_encontrado'
        ? 'CEP não encontrado. Preencha o endereço à mão.'
        : statusCep === 'erro'
          ? 'Não deu pra buscar o CEP agora. Preencha à mão.'
          : 'Preenche bairro, cidade e endereço sozinho';

  return (
    <div className="grid gap-5">
      <TextField
        label="Nome"
        name="nome"
        placeholder="Nome completo"
        defaultValue={cliente?.nome}
        required
        autoFocus={autoFocus}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="WhatsApp"
          name="telefone"
          type="tel"
          inputMode="tel"
          placeholder="(24) 99999-9999"
          defaultValue={cliente?.telefone}
          onChange={aoDigitarTelefone}
          required
        />
        <TextField
          label="Outro telefone"
          name="telefone_reserva"
          optional
          type="tel"
          inputMode="tel"
          placeholder="(24) 3333-3333"
          defaultValue={cliente?.telefone_reserva}
          onChange={aoDigitarTelefone}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)]">
        <TextField
          label="CEP"
          name="cep"
          optional
          inputMode="numeric"
          placeholder="27200-000"
          defaultValue={cliente?.cep}
          onChange={aoDigitarCep}
          hint={dicaCep}
        />
        <TextField label="Número" name="numero" optional placeholder="Ex.: 120" defaultValue={cliente?.numero} />
      </div>
      <TextField
        ref={enderecoRef}
        label="Endereço"
        name="endereco"
        optional
        placeholder="Rua, avenida..."
        defaultValue={cliente?.endereco}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          ref={bairroRef}
          label="Bairro"
          name="bairro"
          optional
          placeholder="Ex.: Vila Santa Cecília"
          defaultValue={cliente?.bairro}
        />
        <TextField
          ref={cidadeRef}
          label="Cidade"
          name="cidade"
          optional
          placeholder="Ex.: Volta Redonda"
          defaultValue={cliente?.cidade}
        />
      </div>
    </div>
  );
}
