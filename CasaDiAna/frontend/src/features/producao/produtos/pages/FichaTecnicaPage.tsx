import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { produtosService } from '../services/produtosService'
import { ingredientesService } from '@/features/estoque/ingredientes/services/ingredientesService'
import { CampoTexto } from '@/components/form/CampoTexto'
import { SelectCampo } from '@/components/form/SelectCampo'
import { FormSection } from '@/components/form/FormSection'
import { FormCard } from '@/components/form/FormCard'
import { Spinner } from '@/components/form/Spinner'
import { Toast } from '@/components/ui/Toast'
import { LoadingState } from '@/components/ui/LoadingState'
import type { FichaTecnica } from '@/types/producao'
import type { IngredienteResumo } from '@/types/estoque'
import { ConfirmacaoFichaTecnicaModal, type DadosConfirmacaoFichaTecnica } from '../components/ConfirmacaoFichaTecnicaModal'

const fichaSchema = z.object({
  itens: z.array(
    z.object({
      ingredienteId: z.string().min(1, 'Selecione um ingrediente.'),
      quantidadePorUnidade: z.preprocess(
        (v) => (v === '' || v == null ? undefined : Number(v)),
        z.number({ required_error: 'Campo obrigatório', invalid_type_error: 'Deve ser um número' })
          .positive('Deve ser maior que zero')
      ),
    })
  ).min(1, 'Adicione pelo menos um ingrediente.'),
})

type FichaFormValues = {
  itens: { ingredienteId: string; quantidadePorUnidade: number | undefined }[]
}

export function FichaTecnicaPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [ficha, setFicha] = useState<FichaTecnica | null>(null)
  const [ingredientes, setIngredientes] = useState<IngredienteResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)
  const [confirma, setConfirma] = useState<DadosConfirmacaoFichaTecnica | null>(null)

  const { register, control, handleSubmit, reset, formState: { errors } } =
    useForm<FichaFormValues>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(fichaSchema) as any,
      defaultValues: { itens: [{ ingredienteId: '', quantidadePorUnidade: undefined }] },
    })

  const { fields, append, remove } = useFieldArray({ control, name: 'itens' })

  useEffect(() => {
    if (!id) return
    Promise.all([
      produtosService.obterFichaTecnica(id).catch(() => null),
      ingredientesService.listar(),
    ])
      .then(([fichaData, ingsData]) => {
        setIngredientes(ingsData)
        if (fichaData && fichaData.itens.length > 0) {
          setFicha(fichaData)
          reset({
            itens: fichaData.itens.map(i => ({
              ingredienteId: i.ingredienteId,
              quantidadePorUnidade: String(i.quantidadePorUnidade),
            })),
          })
        }
      })
      .catch(() => setToast({ tipo: 'erro', mensagem: 'Erro ao carregar ficha técnica.' }))
      .finally(() => setCarregando(false))
  }, [id, reset])

  const onSubmit = async (values: FichaFormValues) => {
    if (!id) return
    setSalvando(true)
    try {
      const fichaAtualizada = await produtosService.definirFichaTecnica(id, {
        itens: values.itens.map(i => ({
          ingredienteId: i.ingredienteId,
          quantidadePorUnidade: i.quantidadePorUnidade as number,
        })),
      })
      setFicha(fichaAtualizada)
      setConfirma({
        produtoNome: fichaAtualizada.produtoNome,
        totalIngredientes: fichaAtualizada.itens.length,
        custoTotal: fichaAtualizada.custoTotal,
      })
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao salvar ficha técnica.' })
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <div className="ada-page">
        <LoadingState mensagem="Carregando ficha técnica…" />
      </div>
    )
  }

  return (
    <div className="ada-page max-w-3xl">
      {confirma && (
        <ConfirmacaoFichaTecnicaModal
          aberto
          dados={confirma}
          onFechar={() => setConfirma(null)}
        />
      )}
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}

      <Link to="/producao/produtos" className="back-link">
        <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
        Produtos
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
          >
            Ficha Técnica
          </h1>
          {ficha && (
            <p className="text-sm mt-1" style={{ color: 'var(--ada-muted)' }}>
              {ficha.produtoNome} · Preço:{' '}
              {ficha.precoVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          )}
        </div>
        {ficha && ficha.custoTotal > 0 && (
          <div
            className="rounded-xl px-5 py-3 text-right"
            style={{ background: 'var(--ada-surface)', border: '1px solid var(--ada-border)', boxShadow: 'var(--shadow-sm)' }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ada-muted)' }}>Custo Total</p>
            <p className="text-lg font-bold" style={{ color: 'var(--ada-heading)' }}>
              {ficha.custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            {ficha.margemLucro != null && (
              <p className={`text-xs font-medium mt-0.5 ${ficha.margemLucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Margem: {ficha.margemLucro.toFixed(1)}%
              </p>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <FormCard>
          <FormSection titulo="Ingredientes" />

          {errors.itens && !Array.isArray(errors.itens) && (
            <p className="mb-3 text-xs text-red-600 flex items-center gap-1">
              <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              {(errors.itens as { message?: string }).message}
            </p>
          )}

          <div className="grid grid-cols-[1fr_160px_36px] gap-2 px-1 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ada-muted)' }}>Ingrediente</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ada-muted)' }}>Qtd. por unidade</span>
            <span />
          </div>

          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[1fr_160px_36px] gap-2 items-start">
                <SelectCampo
                  label=" "
                  opcoes={ingredientes.map(ing => ({
                    valor: ing.id,
                    rotulo: `${ing.nome} (${ing.unidadeMedidaCodigo})`,
                  }))}
                  {...register(`itens.${index}.ingredienteId`)}
                  erro={errors.itens?.[index]?.ingredienteId?.message}
                />
                <CampoTexto
                  label=" "
                  type="number"
                  step="0.001"
                  min="0.001"
                  placeholder="0.000"
                  {...register(`itens.${index}.quantidadePorUnidade`)}
                  erro={errors.itens?.[index]?.quantidadePorUnidade?.message}
                />
                <button
                  type="button"
                  onClick={() => fields.length > 1 && remove(index)}
                  disabled={fields.length === 1}
                  className="mt-0.5 p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ color: 'var(--ada-muted)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#DC2626'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ada-muted)'}
                  title="Remover ingrediente"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => append({ ingredienteId: '', quantidadePorUnidade: undefined })}
            className="mt-3 flex items-center gap-1.5 text-xs font-semibold transition-colors"
            style={{ color: '#C4870A' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#B87D0A'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#C4870A'}
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Adicionar ingrediente
          </button>

          <div
            className="flex justify-end gap-2.5 pt-5 mt-6"
            style={{ borderTop: '1px solid var(--ada-border-sub)' }}
          >
            <button
              type="button"
              onClick={() => navigate('/producao/produtos')}
              disabled={salvando}
              className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 hover:bg-[var(--ada-bg)]"
              style={{ border: '1px solid var(--ada-border)', color: 'var(--ada-body)', background: 'var(--ada-surface)' }}
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #D4960C 0%, #B87D0A 100%)', boxShadow: '0 3px 10px rgba(196,135,10,0.28)' }}
            >
              {salvando && <Spinner />}
              {salvando ? 'Salvando…' : 'Salvar Ficha Técnica'}
            </button>
          </div>
        </FormCard>
      </form>
    </div>
  )
}
