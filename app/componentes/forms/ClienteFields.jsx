import { TextField } from '../ui/TextField';

// Campos com `name` nativo — o form em volta posta direto pra uma Server
// Action, sem estado React no meio.
export function ClienteFields({ cliente, autoFocus }) {
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
          placeholder="(11) 99999-9999"
          defaultValue={cliente?.telefone}
          required
        />
        <TextField
          label="Outro telefone"
          name="telefone_reserva"
          optional
          type="tel"
          inputMode="tel"
          placeholder="(11) 3333-3333"
          defaultValue={cliente?.telefone_reserva}
        />
      </div>
      <TextField
        label="Bairro ou cidade"
        name="segmento"
        placeholder="Ex.: Vila Nova"
        defaultValue={cliente?.segmento}
      />
    </div>
  );
}
