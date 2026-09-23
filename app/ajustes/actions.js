'use server';

import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '../../lib/supabase-server';

// Chamada direto (não via <form>), com os números do rascunho já validados
// no cliente — por isso recebe um objeto, não FormData.
export async function salvarAjustes(dados) {
  const supabase = getSupabaseServerClient();

  const { error } = await supabase
    .from('configuracoes')
    .update({
      limite_atraso: dados.limite_atraso,
      peso_mudanca_padrao: dados.peso_mudanca_padrao,
      corte_risco_alto: dados.corte_risco_alto,
      corte_risco_medio: dados.corte_risco_medio,
      dias_antes_aviso: dados.dias_antes_aviso,
      dias_repetir_cobranca: dados.dias_repetir_cobranca,
      whatsapp_limite_por_hora: dados.whatsapp_limite_por_hora,
      whatsapp_limite_por_dia: dados.whatsapp_limite_por_dia,
    })
    .eq('id', 1);

  if (error) {
    redirect(`/ajustes?erro=${encodeURIComponent('Erro ao salvar: ' + error.message)}`);
    return;
  }

  redirect(`/ajustes?ok=${encodeURIComponent('Ajustes salvos. Os riscos e a régua já usam os números novos.')}`);
}
