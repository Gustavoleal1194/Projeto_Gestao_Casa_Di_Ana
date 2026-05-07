import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ChevronLeftIcon } from '@heroicons/react/20/solid'
import { PageHeader } from '@/components/ui/PageHeader'
import { useIngredienteForm, ingredienteParaForm } from '../hooks/useIngredienteForm'
import { ingredientesService } from '../services/ingredientesService'
import { useCategorias } from '@/features/estoque/categorias/hooks/useCategorias'
import { useUnidadesMedida } from '@/features/estoque/unidades/hooks/useUnidadesMedida'
import { CampoTexto } from '@/components/form/CampoTexto'
import { SelectCampo } from '@/components/form/SelectCampo'
import { Toast } from '@/components/ui/Toast'
import { ConfirmacaoIngredienteModal, type DadosConfirmacaoIngrediente } from '../components/ConfirmacaoIngredienteModal'
import { FormSection } from '@/components/form/FormSection'
import { FormTextarea } from '@/components/form/FormTextarea'
import { FormActions } from '@/components/form/FormActions'
import { FormCard } from '@/components/form/FormCard'
import { LoadingState } from '@/components/ui/LoadingState'
import type { Ingrediente } from '@/types/estoque'

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
  const [confirma, setConfirma] = useState<DadosConfirmacaoIngrediente | null>(null)

  const fecharToast = useCallback(() => setToast(null), [])

  const { form, salvar } = useIngredienteForm({ ingredienteExistente: ingrediente })
  const { register, handleSubmit, watch, reset, setValue, clearErrors, formState: { errors } } = form

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

  // Detecta se a unidade selecionada é do tipo Pacote
  const ehPacote = unidades
    .find(u => String(u.id) === unidadeSelecionadaId)
    ?.descricao.toLowerCase()
    .includes('pacote') ?? false

  // Sincroniza flag _ehPacote no form para o superRefine funcionar
  useEffect(() => {
    setValue('_ehPacote', ehPacote)
    if (!ehPacote) {
      setValue('quantidadeEmbalagem', '')
      clearErrors('quantidadeEmbalagem')
    }
  }, [ehPacote, setValue, clearErrors])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = handleSubmit(async (values: any) => {
    setSalvando(true)
    try {
      await salvar(values)
      setConfirma({
        ingredienteNome: values.nome,
        unidade: unidadeAtual,
        modo: modoEdicao ? 'atualizado' : 'criado',
      })
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
      <div className="ada-page">
        <LoadingState mensagem="Carregando ingrediente…" />
      </div>
    )
  }

  if (erroCarregamento) {
    return (
      <div className="ada-page">
        <div className="state-error" role="alert">
          {erroCarregamento}
        </div>
        <Link to="/estoque/ingredientes" className="mt-4 inline-flex items-center gap-1 text-sm" style={{ color: 'var(--ada-muted)' }}>
          <ChevronLeftIcon className="h-4 w-4" />
          Voltar para Ingredientes
        </Link>
      </div>
    )
  }

  return (
    <div className="ada-page max-w-3xl">
      {confirma && (
        <ConfirmacaoIngredienteModal
          aberto
          dados={confirma}
          onFechar={() => { setConfirma(null); navigate('/estoque/ingredientes') }}
          onVerIngredientes={() => { setConfirma(null); navigate('/estoque/ingredientes') }}
        />
      )}
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={fecharToast} />}

      <PageHeader
        titulo={modoEdicao ? `Editar: ${ingrediente?.nome ?? ''}` : 'Novo Ingrediente'}
        breadcrumb={['Cadastros', 'Ingredientes']}
      />

      <form onSubmit={onSubmit}>
        <FormCard>
          <FormSection titulo="Identificação" primeiro />
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

          <FormSection titulo="Classificação" />
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
              placeholderOpcao="Selecione…"
              opcoes={unidades.map(u => ({ valor: u.id, rotulo: `${u.codigo} — ${u.descricao}` }))}
              {...register('unidadeMedidaId')}
              erro={errors.unidadeMedidaId?.message}
            />
          </div>

          <FormSection titulo="Controle de Estoque" />
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

          {ehPacote && (
            <>
              <FormSection titulo="Embalagem" />
              <div className="max-w-xs">
                <CampoTexto
                  label="Quantidade por Embalagem"
                  obrigatorio
                  placeholder="Ex: 500 gramas, 1000 ml, 5 kg"
                  {...register('quantidadeEmbalagem')}
                  erro={errors.quantidadeEmbalagem?.message}
                />
              </div>
            </>
          )}

          <FormSection titulo="Observações" />
          <FormTextarea
            label="Observações"
            placeholder="Informações adicionais sobre este ingrediente…"
            {...register('observacoes')}
            erro={errors.observacoes?.message}
          />

          <FormActions
            salvando={salvando}
            labelSalvar="Salvar Ingrediente"
            onCancelar={() => navigate('/estoque/ingredientes')}
          />
        </FormCard>
      </form>
    </div>
  )
}
