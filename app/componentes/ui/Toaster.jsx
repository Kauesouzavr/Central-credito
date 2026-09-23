'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Toaster as SonnerToaster, toast } from 'sonner';

// Lê `?ok=`/`?erro=` da URL (é assim que as Server Actions já sinalizam
// sucesso/erro, via redirect) e transforma num toast — sem precisar mudar
// nenhuma action existente. Limpa só esses dois parâmetros da URL depois,
// mantendo os outros (ex.: `?novo=1` de um modal aberto).
function ToastFromParams() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const ok = searchParams.get('ok');
  const erro = searchParams.get('erro');

  useEffect(() => {
    if (!ok && !erro) return;
    if (ok) toast.success(ok);
    if (erro) toast.error(erro);

    const proximos = new URLSearchParams(searchParams);
    proximos.delete('ok');
    proximos.delete('erro');
    const query = proximos.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ok, erro]);

  return null;
}

export function Toaster() {
  return (
    <>
      <Suspense fallback={null}>
        <ToastFromParams />
      </Suspense>
      <SonnerToaster
        position="top-center"
        richColors
        toastOptions={{ style: { fontFamily: 'Manrope, sans-serif', fontSize: '16px', borderRadius: '18px' } }}
      />
    </>
  );
}
