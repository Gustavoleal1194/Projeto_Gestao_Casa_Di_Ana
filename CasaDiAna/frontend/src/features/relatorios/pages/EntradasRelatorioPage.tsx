import { useState } from 'react'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { relatoriosService } from '../services/relatoriosService'
import { gerarPdfEntradas } from '@/lib/pdf'
import type { EntradaRelatorioResumo } from '@/types/estoque'

function hoje(): string { return new Date().toISOString().split('T')[0] }
function primeiroDiaMes(): string {
  const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function EntradasRelatorioPage() {
  const [resumo, setResumo] = useState<EntradaRelatorioResumo | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [de, setDe] = useState(primeiroDiaMes)
  const [ate, setAte] = useState(hoje)

  const carregar = async () => {
    setLoading(true)
    setErro(null)
    try {
      const data = await relatoriosService.entradas(de, ate)
      setResumo(data)
    } catch {
      setErro('Erro ao carregar relatório de entradas.')
    } finally {
      setLoading(false)
    }
  }

  const handleFiltrar = (e: React.FormEvent) => { e.preventDefault(); carregar() }

  const inputClass = 'border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-stone-800">Relatório de Entradas</h1>
        {resumo && resumo.entradas.length > 0 && (
          <button
            onClick={() => gerarPdfEntradas(resumo, de, ate)}
            className="flex items-center gap-2 px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 font-medium"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Baixar PDF
          </button>
        )}
      </div>

      <form onSubmit={handleFiltrar} className="bg-white rounded-xl shadow-sm border border-stone-100 p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">De</label>
          <input type="date" value={de} onChange={e => setDe(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Até</label>
          <input type="date" value={ate} onChange={e => setAte(e.target.value)} className={inputClass} />
        </div>
        <button type="submit" className="px-4 py-2 bg-stone-700 hover:bg-stone-800 text-white rounded-lg text-sm font-medium">Gerar Relatório</button>
      </form>

      {loading && (
        <div className="bg-white rounded-xl shadow-sm py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-amber-700" />
          <p className="text-stone-500 mt-3 text-sm">Carregando...</p>
        </div>
      )}
      {!loading && erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{erro}</div>
      )}
      {!loading && resumo && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-5">
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Total de Entradas</p>
              <p className="text-2xl font-bold text-stone-800">{resumo.totalEntradas}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-5">
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Confirmadas</p>
              <p className="text-2xl font-bold text-green-700">{resumo.totalEntradasConfirmadas}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-5">
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Custo Total (Confirmadas)</p>
              <p className="text-2xl font-bold text-stone-800">{formatarMoeda(resumo.custoTotalConfirmadas)}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {resumo.entradas.length === 0 ? (
              <div className="py-16 text-center"><p className="text-stone-500 text-sm">Nenhuma entrada no período.</p></div>
            ) : (
              <table className="w-full">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Fornecedor</th>
                    <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Nota Fiscal</th>
                    <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Data</th>
                    <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Status</th>
                    <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Itens</th>
                    <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Custo Total</th>
                  </tr>
                </thead>
                <tbody>
                  {resumo.entradas.map(e => (
                    <tr key={e.id} className="border-b border-stone-100 hover:bg-amber-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-stone-800">{e.fornecedorNome}</td>
                      <td className="px-4 py-3 text-sm text-stone-600 font-mono">{e.numeroNotaFiscal ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-stone-600">{formatarData(e.dataEntrada)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          e.status === 'Confirmada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-600 text-right">{e.totalItens}</td>
                      <td className="px-4 py-3 text-sm font-medium text-stone-800 text-right">{formatarMoeda(e.custoTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
