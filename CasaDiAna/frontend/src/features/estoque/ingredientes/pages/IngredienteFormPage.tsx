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
    <div className="flex items-center gap-3 mt-6 mb-4">
      <span className="text-xs font-semibold text-stone-400 uppercase tracking-widest whitespace-nowrap">
        {titulo}
      </span>
      <div className="flex-1 border-t border-stone-100" />
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
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-amber-700 mb-6 transition-colors"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Ingredientes
      </Link>

      <h1 className="text-2xl font-semibold text-stone-800 mb-6">
        {modoEdicao ? `Editar: ${ingrediente?.nome ?? ''}` : 'Novo Ingrediente'}
      </h1>

      <form onSubmit={onSubmit} className="bg-white rounded-xl shadow-sm p-6">

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
          <label className="block text-sm font-medium text-stone-700 mb-1">Observações</label>
          <textarea
            rows={3}
            placeholder="Informações adicionais sobre este ingrediente..."
            {...register('observacoes')}
            className={`w-full border rounded-lg px-3 py-2.5 text-sm resize-none
                        focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                        ${errors.observacoes ? 'border-red-300 bg-red-50' : 'border-stone-200'}`}
          />
          {errors.observacoes && (
            <p className="mt-1 text-xs text-red-600">{errors.observacoes.message}</p>
          )}
        </div>

        {/* Rodapé */}
        <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-stone-100">
          <button
            type="button"
            onClick={() => navigate('/estoque/ingredientes')}
            disabled={salvando}
            className="px-4 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-600
                       hover:bg-stone-50 disabled:opacity-50 font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-700 hover:bg-amber-800
                       text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {salvando && <Spinner />}
            {salvando ? 'Salvando...' : 'Salvar Ingrediente'}
          </button>
        </div>
      </form>
    </div>
  )
}
