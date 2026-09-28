'use client';

import { useRef, useState } from 'react';
import { formatarCepDigitado, formatarTelefoneDigitado } from '../../../lib/util';
import { TextField } from '../ui/TextField';

// Preenche bairro/cidade/endereço a partir do CEP (ViaCEP). Não sobrescreve
// o que a pessoa já tiver digitado à mão no endereço, só bairro/cidade (que
// vêm certos do CEP e não fazem sentido editar antes de buscar).
async function buscarEnderecoPorCep(cepDigitado, refs) {
  const digitos = cepDigitado.replace(/\D/g, '');
  if (digitos.length !== 8) return null;
  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
    const dados = await resposta.json();
    if (dados.erro) return 'nao_encontrado';
    if (refs.bairro.current) refs.bairro.current.value = dados.bairro || '';
    if (refs.cidade.current) refs.cidade.current.value = dados.localidade || '';
    if (refs.endereco.current && !refs.endereco.current.value) {
      refs.endereco.current.value = dados.logradouro || '';
    }
    return 'ok';
  } catch {
    return 'erro';
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

  async function aoDigitarCep(evento) {
    evento.target.value = formatarCepDigitado(evento.target.value);
    const digitos = evento.target.value.replace(/\D/g, '');
    if (digitos.length < 8) {
      setStatusCep(null);
      return;
    }
    setStatusCep('buscando');
    const resultado = await buscarEnderecoPorCep(evento.target.value, {
      bairro: bairroRef,
      cidade: cidadeRef,
      endereco: enderecoRef,
    });
    setStatusCep(resultado === 'ok' ? null : resultado);
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
