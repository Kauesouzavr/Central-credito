import { getSupabaseServerClient } from '../../../lib/supabase-server';
import { buscarTudo } from '../../../lib/carregar-risco';
import { gerarCsvClientes } from '../../../lib/csv';

export async function GET() {
  const supabase = getSupabaseServerClient();

  const [clientes, titulos] = await Promise.all([
    buscarTudo(() => supabase.from('clientes').select('id, nome, telefone, segmento').order('nome', { ascending: true })),
    buscarTudo(() => supabase.from('titulos_com_saldo').select('*').order('data_vencimento', { ascending: true })),
  ]);

  const csv = gerarCsvClientes(clientes, titulos);
  const dataArquivo = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="central-de-credito-${dataArquivo}.csv"`,
    },
  });
}
