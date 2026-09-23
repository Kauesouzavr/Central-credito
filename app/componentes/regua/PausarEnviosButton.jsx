'use client';

import { PauseIcon, PlayIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { alternarEnvio } from '../../cobranca/actions';

export function PausarEnviosButton({ pausado }) {
  return (
    <form action={alternarEnvio}>
      <Button
        type="submit"
        size="lg"
        variant={pausado ? 'primary' : 'secondary'}
        icon={
          pausado ? (
            <PlayIcon className="h-5 w-5" aria-hidden="true" />
          ) : (
            <PauseIcon className="h-5 w-5" aria-hidden="true" />
          )
        }
      >
        {pausado ? 'Retomar envios' : 'Pausar envios'}
      </Button>
    </form>
  );
}
