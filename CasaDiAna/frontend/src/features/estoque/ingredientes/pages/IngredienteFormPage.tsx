import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ChevronLeftIcon } from '@heroicons/react/20/solid'
import { useIngredienteForm, ingredienteParaForm } from '../hooks/useIngredienteForm'
import { ingredientesService } from '../services/ingredientesService'
import { useCategorias } from '@/features/estoque/categorias/hooks/useCategorias'
import { useUnidadesMedida } from '@/features/estoque/unidades/hooks/useUnidadesMedida'
import { CampoTexto } from '../components/CampoTexto'
import { SelectCampo } from '../components/SelectCampo'
import { Toast } from '../components/Toast'
import type { Ingrediente } from '@/types/estoque'

function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin h-4 w-4 ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

function SecaoFormulario({ titulo }: { titulo: string }) {
  return (
    <div className="flex items-center gap-3 mt-7 mb-4">
      <span
        className="text-[10.5px] font-semibold uppercase tracking-[0.10em] whitespace-nowrap"
        style={{ color: 'var(--ada-placeholder)', fontFamily: 'Sora, system-ui, sans-serif' }}
      >
        {titulo}
      </span>
      <div className="flex-1" style={{ borderTop: '1px solid var(--ada-border-sub)' }} aria-hidden="true" />
    </div>
  )
}

export function IngredienteFormPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const modoEdicao = !!id

  const [ingrediente, setIngrediente] = useState<Ingrediente | null>(null)
  const [carregando, setCarregando] = useState(modoEdicao)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    ingredientesService
      .obterPorId(id)
      .then(setIngrediente)
      .catch(() => setErroCarregamento('Ingrediente não encontrado.'))
      .finally(() => setCarregando(false))
  }, [id])

  const { categorias } = useCategorias()
  const { unidades } = useUnidadesMedida()

  const [unidadeAtual, setUnidadeAtual] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)

  const fecharToast = useCallback(() => setToast(null), [])

  const { form, salvar } = useIngredienteForm({ ingredienteExistente: ingrediente })
  const { register, handleSubmit, watch, reset, formState: { errors } } = form

  // Ao carregar ingrediente no modo edição, resetar o form com os dados
  useEffect(() => {
    if (ingrediente) {
      reset(ingredienteParaForm(ingrediente))
    }
  }, [ingrediente, reset])

  // Atualizar sufixo de unidade
  const unidadeSelecionadaId = watch('unidadeMedidaId')
  useEffect(() => {
    const unidade = unidades.find(u => String(u.id) === unidadeSelecionadaId)
    setUnidadeAtual(unidade?.codigo ?? '')
  }, [unidadeSelecionadaId, unidades])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = handleSubmit(async (values: any) => {
    setSalvando(true)
    try {
      await salvar(values)
      setToast({ tipo: 'sucesso', mensagem: 'Ingrediente salvo com sucesso!' })
      setTimeout(() => navigate('/estoque/ingredientes'), 1500)
    } catch (e: unknown) {
      const erros = (e as { response?: { data?: { erros?: string[] } } })?.response?.data?.erros
      setToast({
        tipo: 'erro',
        mensagem: erros?.length ? erros.join(' ') : 'Erro ao salvar ingrediente.',
      })
    } finally {
      setSalvando(false)
    }
  })

  if (carregando) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Spinner className="text-amber-700 h-8 w-8" />
      </div>
    )
  }

  if (erroCarregamento) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {erroCarregamento}
        </div>
        <Link
          to="/estoque/ingredientes"
          className="mt-4 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-amber-700"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Voltar para Ingredientes
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl">
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={fecharToast} />}

      {/* Breadcrumb */}
      <Link
        to="/estoque/ingredientes"
        className="inline-flex items-center gap-1.5 text-sm font-medium mb-5 transition-colors duration-150 outline-none
                   focus-visible:ring-2 focus-visible:ring-[#C4870A]/40 rounded"
        style={{ color: 'var(--ada-muted)' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#C4870A'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ada-muted)'}
      >
        <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
        Ingredientes
      </Link>

      <h1
        className="text-xl font-bold tracking-tight mb-6"
        style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
      >
        {modoEdicao ? `Editar: ${ingrediente?.nome ?? ''}` : 'Novo Ingrediente'}
      </h1>

      <form
        onSubmit={onSubmit}
        className="rounded-xl p-6"
        style={{
          background: 'var(--ada-surface)',
          border: '1px solid var(--ada-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >

        <SecaoFormulario titulo="Identificação" />
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <CampoTexto
              label="Nome"
              obrigatorio
              placeholder="Ex: Farinha de Trigo Especial"
              {...register('nome')}
              erro={errors.nome?.message}
            />
          </div>
          <div className="col-span-1">
            <CampoTexto
              label="Código Interno"
              placeholder="Ex: FA-001"
              {...register('codigoInterno')}
              erro={errors.codigoInterno?.message}
            />
          </div>
        </div>

        <SecaoFormulario titulo="Classificação" />
        <div className="grid grid-cols-2 gap-4">
          <SelectCampo
            label="Categoria"
            placeholderOpcao="Sem categoria"
            opcoes={categorias.map(c => ({ valor: c.id, rotulo: c.nome }))}
            {...register('categoriaId')}
            erro={errors.categoriaId?.message}
          />
          <SelectCampo
            label="Unidade de Medida"
            obrigatorio
            placeholderOpcao="Selecione..."
            opcoes={unidades.map(u => ({ valor: u.id, rotulo: `${u.codigo} — ${u.descricao}` }))}
            {...register('unidadeMedidaId')}
            erro={errors.unidadeMedidaId?.message}
          />
        </div>

        <SecaoFormulario titulo="Controle de Estoque" />
        <div className="grid grid-cols-2 gap-4">
          <CampoTexto
            label="Estoque Mínimo"
            obrigatorio
            type="number"
            step="0.001"
            min="0"
            placeholder="0"
            sufixo={unidadeAtual}
            {...register('estoqueMinimo')}
            erro={errors.estoqueMinimo?.message}
          />
          <CampoTexto
            label="Estoque Máximo"
            type="number"
            step="0.001"
            min="0"
            placeholder="Opcional"
            sufixo={unidadeAtual}
            {...register('estoqueMaximo')}
            erro={errors.estoqueMaximo?.message}
          />
        </div>

        <SecaoFormulario titulo="Observações" />
        <div>
          <label
            htmlFor="observacoes"
            className="block text-[13px] font-medium mb-1.5"
            style={{ color: 'var(--ada-body)', fontFamily: 'DM Sans, system-ui, sans-serif' }}
          >
            Observações
          </label>
          <textarea
            id="observacoes"
            rows={3}
            placeholder="Informações adicionais sobre este ingrediente…"
            {...register('observacoes')}
            className="w-full rounded-lg px-3.5 py-2.5 text-sm resize-none outline-none transition-all duration-200
                       focus-visible:ring-2 focus-visible:ring-[#C4870A]/25 focus-visible:border-[#C4870A]"
            style={{
              border: errors.observacoes ? '1px solid #FCA5A5' : '1px solid var(--ada-border)',
              background: errors.observacoes ? 'var(--ada-error-bg)' : 'var(--ada-surface)',
              color: 'var(--ada-heading)',
              boxShadow: 'var(--shadow-xs)',
            }}
          />
          {errors.observacoes && (
            <p className="mt-1.5 text-xs text-red-600">{String(errors.observacoes.message)}</p>
          )}
        </div>

        {/* Rodapé */}
        <div
          className="flex justify-end gap-2.5 pt-5 mt-6"
          style={{ borderTop: '1px solid var(--ada-border-sub)' }}
        >
          <button
            type="button"
            onClick={() => navigate('/estoque/ingredientes')}
            disabled={salvando}
            className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 outline-none
                       focus-visible:ring-2 focus-visible:ring-[#C4870A]/40 disabled:opacity-50"
            style={{ border: '1px solid var(--ada-border)', color: 'var(--ada-body)', background: 'var(--ada-surface)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--ada-bg)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--ada-surface)'}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white
                       transition-all duration-200 outline-none
                       focus-visible:ring-2 focus-visible:ring-[#C4870A]/40
                       disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #D4960C 0%, #B87D0A 100%)',
              boxShadow: '0 3px 10px rgba(196,135,10,0.28)',
              fontFamily: 'Sora, system-ui, sans-serif',
            }}
          >
            {salvando && <Spinner />}
            {salvando ? 'Salvando…' : 'Salvar Ingrediente'}
          </button>
        </div>
      </form>
    </div>
  )
}
