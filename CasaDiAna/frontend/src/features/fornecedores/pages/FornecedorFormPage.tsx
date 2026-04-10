// frontend/src/features/fornecedores/pages/FornecedorFormPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { useFornecedorForm, fornecedorParaForm, formParaInput } from '../hooks/useFornecedorForm'
import { fornecedoresService } from '../services/fornecedoresService'
import { CampoTexto } from '@/features/estoque/ingredientes/components/CampoTexto'
import { FormTextarea } from '@/components/form/FormTextarea'
import { FormSection } from '@/components/form/FormSection'
import { FormActions } from '@/components/form/FormActions'
import { FormCard } from '@/components/form/FormCard'
import { Spinner } from '@/components/form/Spinner'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import type { FornecedorFormValues } from '@/types/estoque'

export function FornecedorFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdicao = Boolean(id)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useFornecedorForm()
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)
  const [carregando, setCarregando] = useState(isEdicao)

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
        setToast({ tipo: 'sucesso', mensagem: 'Fornecedor atualizado com sucesso.' })
      } else {
        await fornecedoresService.criar(input)
        setToast({ tipo: 'sucesso', mensagem: 'Fornecedor criado com sucesso.' })
      }
      setTimeout(() => navigate('/fornecedores'), 1200)
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao salvar fornecedor.' })
    }
  }

  if (carregando) {
    return (
      <div className="ada-page">
        <div className="state-loading py-32">
          <div
            className="inline-block h-9 w-9 animate-spin rounded-full mb-4"
            style={{ border: '3px solid var(--ada-border-sub)', borderTopColor: '#C4870A' }}
            role="status" aria-label="Carregando…"
          />
          <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>Carregando fornecedor…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="ada-page max-w-2xl">
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}

      <Link
        to="/fornecedores"
        className="inline-flex items-center gap-1.5 text-sm font-medium mb-5 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#C4870A]/40 rounded"
        style={{ color: 'var(--ada-muted)' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#C4870A'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ada-muted)'}
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Fornecedores
      </Link>

      <h1
        className="text-xl font-bold tracking-tight mb-6"
        style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
      >
        {isEdicao ? 'Editar Fornecedor' : 'Novo Fornecedor'}
      </h1>

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
            <CampoTexto
              label="CNPJ"
              placeholder="14 dígitos sem pontuação"
              erro={errors.cnpj?.message}
              {...register('cnpj')}
            />
          </div>

          <FormSection titulo="Contato" />
          <div className="grid grid-cols-2 gap-4">
            <CampoTexto
              label="Telefone"
              placeholder="(11) 99999-9999"
              erro={errors.telefone?.message}
              {...register('telefone')}
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
