import { useEffect, useState, useCallback } from 'react'
import { PlusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { perdasService } from '../services/perdasService'
import { produtosService } from '@/features/producao/produtos/services/produtosService'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import type { PerdaProduto } from '@/types/producao'
import type { ProdutoResumo } from '@/types/producao'

function hoje() {
  return new Date().toISOString().split('T')[0]
}

function primeiroDoMes() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
}

const inputClass =
  'border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'

interface FormState {
  produtoId: string
  data: string
  quantidade: string
  justificativa: string
}

const formVazio: FormState = { produtoId: '', data: hoje(), quantidade: '', justificativa: '' }

export function PerdasPage() {
  const [perdas, setPerdas] = useState<PerdaProduto[]>([])
  const [produtos, setProdutos] = useState<ProdutoResumo[]>([])
  const [loading, setLoading] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState<FormState>(formVazio)
  const [errosForm, setErrosForm] = useState<Partial<Record<keyof FormState, string>>>({})
  const [de, setDe] = useState(primeiroDoMes())
  const [ate, setAte] = useState(hoje())

  const carregar = useCallback(async (filtroDe: string, filtroAte: string) => {
    setLoading(true)
    setErro(null)
    try {
      const data = await perdasService.listar(filtroDe, filtroAte)
      setPerdas(data)
    } catch {
      setErro('Erro ao carregar registros de perda.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    produtosService.listar().then(setProdutos).catch(() => {})
    carregar(primeiroDoMes(), hoje())
  }, [carregar])

  const handleFiltrar = () => carregar(de, ate)

  const validar = () => {
    const erros: typeof errosForm = {}
    if (!form.produtoId) erros.produtoId = 'Produto obrigatório'
    if (!form.data) erros.data = 'Data obrigatória'
    const qtd = Number(form.quantidade)
    if (!form.quantidade || isNaN(qtd) || qtd <= 0) erros.quantidade = 'Quantidade deve ser maior que zero'
    if (!form.justificativa.trim()) erros.justificativa = 'Justificativa obrigatória'
    if (form.justificativa.length > 500) erros.justificativa = 'Máximo 500 caracteres'
    setErrosForm(erros)
    return Object.keys(erros).length === 0
  }

  const handleSalvar = async () => {
    if (!validar()) return
    setSalvando(true)
    try {
      await perdasService.registrar({
        produtoId: form.produtoId,
        data: form.data,
        quantidade: Number(form.quantidade),
        justificativa: form.justificativa.trim(),
      })
      setToast({ tipo: 'sucesso', mensagem: 'Perda registrada com sucesso.' })
      setModalAberto(false)
      setForm(formVazio)
      carregar(de, ate)
    } catch (err: any) {
      const msg = err?.response?.data?.erros?.[0] ?? 'Erro ao registrar perda.'
      setToast({ tipo: 'erro', mensagem: msg })
    } finally {
      setSalvando(false)
    }
  }

  const totalPerdas = perdas.reduce((a, p) => a + p.quantidade, 0)

  return (
    <div className="p-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800">Registro de Perdas</h1>
          <p className="text-sm text-stone-500 mt-1">
            Registre produtos perdidos, descartados ou danificados.
          </p>
        </div>
        <button
          onClick={() => { setForm(formVazio); setErrosForm({}); setModalAberto(true) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Registrar Perda
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">De</label>
          <input type="date" value={de} onChange={e => setDe(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Até</label>
          <input type="date" value={ate} onChange={e => setAte(e.target.value)} className={inputClass} />
        </div>
        <button
          onClick={handleFiltrar}
          className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-sm font-medium"
        >
          Filtrar
        </button>
        {perdas.length > 0 && (
          <span className="ml-auto text-sm text-stone-500">
            {perdas.length} registro(s) — total de{' '}
            <span className="font-semibold text-red-600">{totalPerdas.toFixed(0)} un.</span>
          </span>
        )}
      </div>

      {loading && (
        <div className="bg-white rounded-xl shadow-sm py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-amber-700" />
          <p className="text-stone-500 mt-3 text-sm">Carregando...</p>
        </div>
      )}
      {!loading && erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{erro}</div>
      )}
      {!loading && !erro && perdas.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm py-16 text-center">
          <ExclamationTriangleIcon className="h-10 w-10 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500 text-sm">Nenhuma perda registrada no período.</p>
        </div>
      )}
      {!loading && !erro && perdas.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Data</th>
                <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Produto</th>
                <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Quantidade</th>
                <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Justificativa</th>
              </tr>
            </thead>
            <tbody>
              {perdas.map(p => (
                <tr key={p.id} className="border-b border-stone-100 hover:bg-red-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-stone-700">
                    {new Date(p.data).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-stone-800">{p.produtoNome}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">
                    {p.quantidade.toFixed(0)} un.
                  </td>
                  <td className="px-4 py-3 text-sm text-stone-500 max-w-xs truncate" title={p.justificativa}>
                    {p.justificativa}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold text-stone-800 mb-5">Registrar Perda</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Produto</label>
                <select
                  value={form.produtoId}
                  onChange={e => setForm(f => ({ ...f, produtoId: e.target.value }))}
                  className={`${inputClass} w-full ${errosForm.produtoId ? 'border-red-400' : ''}`}
                >
                  <option value="">Selecione o produto...</option>
                  {produtos.filter(p => p.ativo).map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
                {errosForm.produtoId && <p className="text-xs text-red-500 mt-1">{errosForm.produtoId}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Data</label>
                  <input
                    type="date"
                    value={form.data}
                    onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                    className={`${inputClass} w-full ${errosForm.data ? 'border-red-400' : ''}`}
                  />
                  {errosForm.data && <p className="text-xs text-red-500 mt-1">{errosForm.data}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Quantidade (un.)</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    placeholder="0"
                    value={form.quantidade}
                    onChange={e => setForm(f => ({ ...f, quantidade: e.target.value }))}
                    className={`${inputClass} w-full text-right ${errosForm.quantidade ? 'border-red-400' : ''}`}
                  />
                  {errosForm.quantidade && <p className="text-xs text-red-500 mt-1">{errosForm.quantidade}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Justificativa</label>
                <textarea
                  rows={3}
                  placeholder="Ex: Produto queimado, vencido, contaminado..."
                  value={form.justificativa}
                  onChange={e => setForm(f => ({ ...f, justificativa: e.target.value }))}
                  className={`${inputClass} w-full resize-none ${errosForm.justificativa ? 'border-red-400' : ''}`}
                />
                <div className="flex justify-between mt-1">
                  {errosForm.justificativa
                    ? <p className="text-xs text-red-500">{errosForm.justificativa}</p>
                    : <span />}
                  <p className="text-xs text-stone-400">{form.justificativa.length}/500</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalAberto(false)}
                className="flex-1 px-4 py-2.5 border border-stone-200 text-stone-700 rounded-lg text-sm font-medium hover:bg-stone-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvar}
                disabled={salvando}
                className="flex-1 px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium disabled:opacity-40"
              >
                {salvando ? 'Salvando...' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}
    </div>
  )
}
