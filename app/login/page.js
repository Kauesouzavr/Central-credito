import { GaugeIcon } from 'lucide-react';
import { entrar } from './actions';
import { TextField } from '../componentes/ui/TextField';
import { Button } from '../componentes/ui/Button';
import { GlassPanel } from '../componentes/ui/GlassPanel';

export const metadata = {
  title: 'Entrar — Central de Crédito',
};

export default function Login() {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center">
      <GlassPanel strong className="w-full p-8 sm:p-10">
        <div className="flex items-center gap-3">
          <span className="brand-mark flex h-11 w-11 items-center justify-center rounded-2xl text-white">
            <GaugeIcon className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-ink">Central de Crédito</span>
        </div>
        <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-ink">Entrar</h1>
        <p className="mt-1 text-ink-soft">Use o e-mail e a senha da sua conta.</p>
        <form action={entrar} className="mt-6 grid gap-5">
          <TextField label="E-mail" name="email" type="email" inputMode="email" required autoFocus />
          <TextField label="Senha" name="senha" type="password" required />
          <Button type="submit" size="lg">
            Entrar
          </Button>
        </form>
      </GlassPanel>
    </div>
  );
}
