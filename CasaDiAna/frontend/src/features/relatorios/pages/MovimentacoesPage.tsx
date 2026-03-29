import { useEffect, useState } from 'react'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { relatoriosService } from '../services/relatoriosService'
import { ingredientesService } from '@/features/estoque/ingredientes/services/ingredientesService'
import { gerarPdfMovimentacoes } from '@/lib/pdf'
import type { MovimentacaoRelatorio, IngredienteResumo } from '@/types/estoque'

const TIPOS = ['', 'Entrada', 'AjustePositivo', 'AjusteNegativo', 'SaidaProducao']

function hoje(): string { return new Date().toISOString().split('T')[0] }
function ha30Dias(): string {
  const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]
}

function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function MovimentacoesPage() {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoRelatorio[]>([])
  const [ingredientes, setIngredientes] = useState<IngredienteResumo[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [de, setDe] = useState(ha30Dias)
  const [ate, setAte] = useState(hoje)
  const [tipo, setTipo] = useState('')
  const [ingredienteId, setIngredienteId] = useState('')

  useEffect(() => {
    ingredientesService.listar().then(setIngredientes).catch(() => {})
    carregar()
  }, [])

  const carregar = async () => {
    setLoading(true)
    setErro(null)
    try {
      const data = await relatoriosService.movimentacoes(de, ate, tipo || undefined, ingredienteId || undefined)
      setMovimentacoes(data)
    } catch {
      setErro('Erro ao carregar movimentações.')
    } finally {
      setLoading(false)
    }
  }

  const handleFiltrar = (e: React.FormEvent) => { e.preventDefault(); carregar() }

  const inputClass = 'border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'

  return (
    <div className="p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-semibold text-stone-800">Movimentações de Estoque</h1>
        {movimentacoes.length > 0 && (
          <button
            onClick={() => gerarPdfMovimentacoes(movimentacoes, de, ate)}
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
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Tipo</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)} className={`${inputClass} bg-white`}>
            {TIPOS.map(t => <option key={t} value={t}>{t || 'Todos'}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Ingrediente</label>
          <select value={ingredienteId} onChange={e => setIngredienteId(e.target.value)} className={`${inputClass} bg-white`}>
            <option value="">Todos</option>
            {ingredientes.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
          </select>
        </div>
        <button type="submit" className="px-4 py-2 bg-stone-700 hover:bg-stone-800 text-white rounded-lg text-sm font-medium">Filtrar</button>
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
      {!loading && !erro && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {movimentacoes.length === 0 ? (
            <div className="py-16 text-center"><p className="text-stone-500 text-sm">Nenhuma movimentação no período.</p></div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Data/Hora</th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Ingrediente</th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Tipo</th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Quantidade</th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Saldo Após</th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Referência</th>
                </tr>
              </thead>
              <tbody>
                {movimentacoes.map(m => (
                  <tr key={m.id} className="border-b border-stone-100 hover:bg-amber-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-stone-500 whitespace-nowrap">{formatarDataHora(m.criadoEm)}</td>
                    <td className="px-4 py-3 text-sm text-stone-800">
                      {m.ingredienteNome}
                      <span className="text-stone-400 ml-1">({m.unidadeMedidaCodigo})</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-600">{m.tipo}</td>
                    <td className="px-4 py-3 text-sm font-medium text-right">
                      <span className={m.tipo.includes('Saida') || m.tipo.includes('Negativo') ? 'text-red-600' : 'text-green-600'}>
                        {m.tipo.includes('Saida') || m.tipo.includes('Negativo') ? '-' : '+'}{m.quantidade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-600 text-right">{m.saldoApos}</td>
                    <td className="px-4 py-3 text-xs text-stone-500">{m.referenciaTipo ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
