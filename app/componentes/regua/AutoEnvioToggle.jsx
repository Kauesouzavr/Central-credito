'use client';

import { BotIcon, UserCheckIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { alternarEnvioAutomatico } from '../../cobranca/actions';

export function AutoEnvioToggle({ automatico }) {
  return (
    <form action={alternarEnvioAutomatico}>
      <Button
        type="submit"
        size="lg"
        variant="secondary"
        icon={
          automatico ? (
            <BotIcon className="h-5 w-5" aria-hidden="true" />
          ) : (
            <UserCheckIcon className="h-5 w-5" aria-hidden="true" />
          )
        }
      >
        {automatico ? '100% automático' : 'Aprovação manual'}
      </Button>
    </form>
  );
}
