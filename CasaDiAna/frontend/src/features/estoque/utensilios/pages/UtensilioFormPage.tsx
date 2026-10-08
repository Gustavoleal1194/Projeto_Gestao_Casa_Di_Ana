import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ChevronLeftIcon } from '@heroicons/react/20/solid'
import { PageHeader } from '@/components/ui/PageHeader'
import { useUtensilioForm, utensilioParaForm } from '../hooks/useUtensilioForm'
import { utensiliosService } from '../services/utensiliosService'
import { useCategoriasUtensilio } from '@/features/estoque/categorias-utensilio/hooks/useCategoriasUtensilio'
import { useUnidadesMedida } from '@/features/estoque/unidades/hooks/useUnidadesMedida'
import { CampoTexto } from '@/components/form/CampoTexto'
import { SelectCampo } from '@/components/form/SelectCampo'
import { ComboboxCampo } from '@/components/form/ComboboxCampo'
import { Toast } from '@/components/ui/Toast'
import { ConfirmacaoCadastroModal, type DadosConfirmacaoCadastro } from '@/components/ui/ConfirmacaoCadastroModal'
import { FormSection } from '@/components/form/FormSection'
import { FormActions } from '@/components/form/FormActions'
import { FormCard } from '@/components/form/FormCard'
import { LoadingState } from '@/components/ui/LoadingState'
import type { Utensilio } from '@/types/estoque'

export function UtensilioFormPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const modoEdicao = !!id

  const [utensilio, setUtensilio] = useState<Utensilio | null>(null)
  const [carregando, setCarregando] = useState(modoEdicao)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    utensiliosService
      .obterPorId(id)
      .then(setUtensilio)
      .catch(() => setErroCarregamento('Utensílio não encontrado.'))
      .finally(() => setCarregando(false))
  }, [id])

  const { categorias } = useCategoriasUtensilio()
  const { unidades } = useUnidadesMedida()

  const [unidadeAtual, setUnidadeAtual] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)
  const [confirma, setConfirma] = useState<DadosConfirmacaoCadastro | null>(null)

  const fecharToast = useCallback(() => setToast(null), [])

  const { form, salvar } = useUtensilioForm({ utensilioExistente: utensilio })
  const { register, handleSubmit, watch, reset, control, formState: { errors } } = form

  useEffect(() => {
    if (utensilio) {
      reset(utensilioParaForm(utensilio))
    }
  }, [utensilio, reset])

  const unidadeSelecionadaId = watch('unidadeMedidaId')
  useEffect(() => {
    const unidade = unidades.find(u => String(u.id) === unidadeSelecionadaId)
    setUnidadeAtual(unidade?.codigo ?? '')
  }, [unidadeSelecionadaId, unidades])

  const onSubmit = handleSubmit(async (values) => {
    setSalvando(true)
    try {
      await salvar(values)
      setConfirma({
        nome: values.nome,
        unidade: unidadeAtual,
        modo: modoEdicao ? 'atualizado' : 'criado',
      })
    } catch (e: unknown) {
      const erros = (e as { response?: { data?: { erros?: string[] } } })?.response?.data?.erros
      setToast({
        tipo: 'erro',
        mensagem: erros?.length ? erros.join(' ') : 'Erro ao salvar utensílio.',
      })
    } finally {
      setSalvando(false)
    }
  })

  if (carregando) {
    return (
      <div className="ada-page">
        <LoadingState mensagem="Carregando utensílio…" />
      </div>
    )
  }

  if (erroCarregamento) {
    return (
      <div className="ada-page">
        <div className="state-error" role="alert">
          {erroCarregamento}
        </div>
        <Link to="/estoque/utensilios" className="mt-4 inline-flex items-center gap-1 text-sm" style={{ color: 'var(--ada-muted)' }}>
          <ChevronLeftIcon className="h-4 w-4" />
          Voltar para Utensílios
        </Link>
      </div>
    )
  }

  return (
    <div className="ada-page max-w-3xl">
      {confirma && (
        <ConfirmacaoCadastroModal
          aberto
          dados={confirma}
          entidadeLabel="Utensílio"
          entidadeLabelPlural="Utensílios"
          onFechar={() => { setConfirma(null); navigate('/estoque/utensilios') }}
          onVerLista={() => { setConfirma(null); navigate('/estoque/utensilios') }}
        />
      )}
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={fecharToast} />}

      <PageHeader
        titulo={modoEdicao ? `Editar: ${utensilio?.nome ?? ''}` : 'Novo Utensílio'}
        breadcrumb={['Cadastros', 'Utensílios']}
      />

      <form onSubmit={onSubmit}>
        <FormCard>
          <FormSection titulo="Identificação" primeiro />
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <CampoTexto
                label="Nome"
                obrigatorio
                placeholder="Ex: Detergente Neutro"
                {...register('nome')}
                erro={errors.nome?.message}
              />
            </div>
            <div className="col-span-1">
              <CampoTexto
                label="Código Interno"
                placeholder="Ex: DET-001"
                {...register('codigoInterno')}
                erro={errors.codigoInterno?.message}
              />
            </div>
          </div>

          <FormSection titulo="Classificação" />
          <div className="grid grid-cols-2 gap-4">
            <ComboboxCampo
              control={control}
              name="categoriaUtensilioId"
              label="Categoria"
              placeholder="Buscar categoria…"
              opcoes={categorias.map(c => ({ valor: c.id, rotulo: c.nome }))}
              erro={errors.categoriaUtensilioId?.message}
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

          <FormActions
            salvando={salvando}
            labelSalvar="Salvar Utensílio"
            onCancelar={() => navigate('/estoque/utensilios')}
          />
        </FormCard>
      </form>
    </div>
  )
}
