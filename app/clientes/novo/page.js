import { criarCliente } from './actions';

export default async function NovoCliente({ searchParams }) {
  const params = await searchParams;
  const erro = params?.erro;

  return (
    <main className="pagina">
      <h1>Novo cliente</h1>

      {erro && <p className="erro">{erro}</p>}

      <form action={criarCliente} className="formulario">
        <h2>Dados do cliente</h2>

        <label>
          Nome *
          <input type="text" name="nome" required />
        </label>

        <label>
          Telefone *
          <input type="tel" name="telefone" required placeholder="(00) 00000-0000" />
        </label>

        <label>
          Telefone reserva
          <input type="tel" name="telefone_reserva" placeholder="opcional" />
        </label>

        <label>
          Segmento / cidade
          <input type="text" name="segmento" placeholder="opcional" />
        </label>

        <h2>Primeira compra</h2>

        <label>
          Produto *
          <input type="text" name="produto" required placeholder="ex: Sapato social preto" />
        </label>

        <label>
          Valor (R$) *
          <input type="number" name="valor" required min="0.01" step="0.01" />
        </label>

        <label>
          Data de vencimento *
          <input type="date" name="data_vencimento" required />
        </label>

        <label>
          Forma de pagamento *
          <select name="forma_pagamento" required defaultValue="">
            <option value="" disabled>
              Selecione
            </option>
            <option value="PIX">PIX</option>
            <option value="Boleto">Boleto</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Cartão">Cartão</option>
            <option value="Cheque">Cheque</option>
            <option value="A combinar">A combinar</option>
          </select>
        </label>

        <button type="submit">Salvar cliente</button>
      </form>
    </main>
  );
}
