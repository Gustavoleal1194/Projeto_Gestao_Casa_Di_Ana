import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Controller } from 'react-hook-form'
import { PageHeader } from '@/components/ui/PageHeader'
import { useFornecedorForm, fornecedorParaForm, formParaInput, formatarCnpj, formatarTelefone } from '../hooks/useFornecedorForm'
import { fornecedoresService } from '../services/fornecedoresService'
import { CampoTexto } from '@/components/form/CampoTexto'
import { FormTextarea } from '@/components/form/FormTextarea'
import { FormSection } from '@/components/form/FormSection'
import { FormActions } from '@/components/form/FormActions'
import { FormCard } from '@/components/form/FormCard'
import { Toast } from '@/components/ui/Toast'
import { LoadingState } from '@/components/ui/LoadingState'
import type { FornecedorFormValues } from '@/types/estoque'
import { ConfirmacaoFornecedorModal, type DadosConfirmacaoFornecedor } from '../components/ConfirmacaoFornecedorModal'

export function FornecedorFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdicao = Boolean(id)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useFornecedorForm()
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)
  const [carregando, setCarregando] = useState(isEdicao)
  const [confirma, setConfirma] = useState<DadosConfirmacaoFornecedor | null>(null)

  useEffect(() => {
    if (!id) return
    fornecedoresService
      .obterPorId(id)
      .then(f => reset(fornecedorParaForm(f)))
      .catch(() => setToast({ tipo: 'erro', mensagem: 'Erro ao carregar fornecedor.' }))
      .finally(() => setCarregando(false))
  }, [id, reset])

  const onSubmit = async (values: FornecedorFormValues) => {
    try {
      const input = formParaInput(values)
      if (id) {
        await fornecedoresService.atualizar({ id, ...input })
      } else {
        await fornecedoresService.criar(input)
      }
      setConfirma({
        fornecedorNome: values.razaoSocial,
        modo: id ? 'atualizado' : 'criado',
      })
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao salvar fornecedor.' })
    }
  }

  if (carregando) {
    return (
      <div className="ada-page">
        <LoadingState mensagem="Carregando fornecedor…" />
      </div>
    )
  }

  return (
    <div className="ada-page max-w-2xl">
      {confirma && (
        <ConfirmacaoFornecedorModal
          aberto
          dados={confirma}
          onFechar={() => { setConfirma(null); navigate('/fornecedores') }}
          onVerFornecedores={() => { setConfirma(null); navigate('/fornecedores') }}
        />
      )}
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}

      <PageHeader
        titulo={isEdicao ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        breadcrumb={['Cadastros', 'Fornecedores']}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <FormCard>
          <FormSection titulo="Identificação" primeiro />
          <div className="grid grid-cols-2 gap-4">
            <CampoTexto
              label="Razão Social"
              obrigatorio
              placeholder="Nome jurídico completo"
              erro={errors.razaoSocial?.message}
              {...register('razaoSocial')}
            />
            <CampoTexto
              label="Nome Fantasia"
              placeholder="Nome comercial (opcional)"
              erro={errors.nomeFantasia?.message}
              {...register('nomeFantasia')}
            />
          </div>
          <div className="mt-4 max-w-xs">
            <Controller
              name="cnpj"
              control={control}
              render={({ field }) => (
                <CampoTexto
                  label="CNPJ"
                  placeholder="00.000.000/0000-00"
                  inputMode="numeric"
                  name={field.name}
                  ref={field.ref}
                  value={field.value}
                  onChange={e => field.onChange(formatarCnpj(e.target.value))}
                  onBlur={field.onBlur}
                  erro={errors.cnpj?.message}
                />
              )}
            />
          </div>

          <FormSection titulo="Contato" />
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="telefone"
              control={control}
              render={({ field }) => (
                <CampoTexto
                  label="Telefone"
                  placeholder="(11) 99999-9999"
                  inputMode="numeric"
                  name={field.name}
                  ref={field.ref}
                  value={field.value}
                  onChange={e => field.onChange(formatarTelefone(e.target.value))}
                  onBlur={field.onBlur}
                  erro={errors.telefone?.message}
                />
              )}
            />
            <CampoTexto
              label="E-mail"
              type="email"
              placeholder="contato@empresa.com"
              erro={errors.email?.message}
              {...register('email')}
            />
            <div className="col-span-2">
              <CampoTexto
                label="Nome do Contato"
                placeholder="Responsável pelo atendimento"
                erro={errors.contatoNome?.message}
                {...register('contatoNome')}
              />
            </div>
          </div>

          <FormSection titulo="Observações" />
          <FormTextarea
            label="Observações"
            placeholder="Informações adicionais..."
            {...register('observacoes')}
          />

          <FormActions
            salvando={isSubmitting}
            labelSalvar={isEdicao ? 'Salvar Alterações' : 'Criar Fornecedor'}
            onCancelar={() => navigate('/fornecedores')}
          />
        </FormCard>
      </form>
    </div>
  )
}
