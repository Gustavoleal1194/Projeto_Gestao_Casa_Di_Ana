import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { perdasService } from '../services/perdasService'
import { produtosService } from '@/features/producao/produtos/services/produtosService'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import { CampoTexto } from '@/features/estoque/ingredientes/components/CampoTexto'
import { SelectCampo } from '@/features/estoque/ingredientes/components/SelectCampo'
import { FormTextarea } from '@/components/form/FormTextarea'
import { Spinner } from '@/components/form/Spinner'
import type { PerdaProduto } from '@/types/producao'
import type { ProdutoResumo } from '@/types/producao'

const perdaSchema = z.object({
  produtoId: z.string().min(1, 'Produto obrigatório.'),
  data: z.string().min(1, 'Data obrigatória.'),
  quantidade: z
    .string()
    .min(1, 'Quantidade obrigatória.')
    .refine(v => Number(v) > 0, 'Deve ser maior que zero.'),
  justificativa: z
    .string()
    .min(1, 'Justificativa obrigatória.')
    .max(500, 'Máximo 500 caracteres.'),
})

type PerdaFormValues = z.infer<typeof perdaSchema>

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

export function PerdasPage() {
  const [perdas, setPerdas] = useState<PerdaProduto[]>([])
  const [produtos, setProdutos] = useState<ProdutoResumo[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [de, setDe] = useState(primeiroDoMes())
  const [ate, setAte] = useState(hoje())

  const { register, handleSubmit, reset: resetForm, formState: { errors: formErrors, isSubmitting } } =
    useForm<PerdaFormValues>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(perdaSchema) as any,
      defaultValues: { produtoId: '', data: hoje(), quantidade: '', justificativa: '' },
    })

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

  const onSubmitPerda = async (values: PerdaFormValues) => {
    try {
      await perdasService.registrar({
        produtoId: values.produtoId,
        data: values.data,
        quantidade: Number(values.quantidade),
        justificativa: values.justificativa.trim(),
      })
      setToast({ tipo: 'sucesso', mensagem: 'Perda registrada com sucesso.' })
      setModalAberto(false)
      resetForm({ produtoId: '', data: hoje(), quantidade: '', justificativa: '' })
      carregar(de, ate)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { erros?: string[] } } })?.response?.data?.erros?.[0]
        ?? 'Erro ao registrar perda.'
      setToast({ tipo: 'erro', mensagem: msg })
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
          onClick={() => { resetForm({ produtoId: '', data: hoje(), quantidade: '', justificativa: '' }); setModalAberto(true) }}
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
          <div
            className="w-full max-w-md mx-4 rounded-2xl p-6"
            style={{ background: 'var(--ada-surface)', boxShadow: 'var(--shadow-xl)' }}
          >
            <h2
              className="text-base font-bold mb-1"
              style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
            >
              Registrar Perda
            </h2>
            <p className="text-sm mb-5" style={{ color: 'var(--ada-muted)' }}>
              Registre produtos perdidos, descartados ou danificados.
            </p>

            <form onSubmit={handleSubmit(onSubmitPerda)} className="space-y-4">
              <SelectCampo
                label="Produto"
                obrigatorio
                opcoes={produtos.filter(p => p.ativo).map(p => ({ valor: p.id, rotulo: p.nome }))}
                {...register('produtoId')}
                erro={formErrors.produtoId?.message}
              />
              <div className="grid grid-cols-2 gap-3">
                <CampoTexto
                  label="Data"
                  obrigatorio
                  type="date"
                  {...register('data')}
                  erro={formErrors.data?.message}
                />
                <CampoTexto
                  label="Quantidade (un.)"
                  obrigatorio
                  type="number"
                  step="1"
                  min="1"
                  placeholder="0"
                  {...register('quantidade')}
                  erro={formErrors.quantidade?.message}
                />
              </div>
              <FormTextarea
                label="Justificativa"
                obrigatorio
                placeholder="Descreva o motivo da perda..."
                rows={3}
                maxLength={500}
                {...register('justificativa')}
                erro={formErrors.justificativa?.message}
              />

              <div
                className="flex justify-end gap-2.5 pt-4"
                style={{ borderTop: '1px solid var(--ada-border-sub)' }}
              >
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 disabled:opacity-50 hover:bg-[var(--ada-bg)]"
                  style={{ border: '1px solid var(--ada-border)', color: 'var(--ada-body)', background: 'var(--ada-surface)' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #D4960C 0%, #B87D0A 100%)', boxShadow: '0 3px 10px rgba(196,135,10,0.28)' }}
                >
                  {isSubmitting && <Spinner />}
                  {isSubmitting ? 'Salvando…' : 'Registrar Perda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}
    </div>
  )
}
