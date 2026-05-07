import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageHeader } from '@/components/ui/PageHeader'
import { inventariosService } from '../services/inventariosService'
import { CampoTexto } from '@/components/form/CampoTexto'
import { FormTextarea } from '@/components/form/FormTextarea'
import { FormSection } from '@/components/form/FormSection'
import { FormActions } from '@/components/form/FormActions'
import { FormCard } from '@/components/form/FormCard'
import { Toast } from '@/components/ui/Toast'
import { ConfirmacaoInicioInventarioModal, type DadosConfirmacaoInicioInventario } from '../components/ConfirmacaoInicioInventarioModal'

interface IniciarFormValues {
  dataRealizacao: string
  descricao: string
  observacoes: string
}

const schema = z.object({
  dataRealizacao: z.string().min(1, 'Informe a data de realização.'),
  descricao: z.string().max(200),
  observacoes: z.string(),
})

export function InventarioFormPage() {
  const navigate = useNavigate()
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)
  const [confirma, setConfirma] = useState<DadosConfirmacaoInicioInventario | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<IniciarFormValues>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(schema) as any,
      defaultValues: {
        dataRealizacao: new Date().toISOString().split('T')[0],
        descricao: '',
        observacoes: '',
      },
    })

  const onSubmit = async (values: IniciarFormValues) => {
    try {
      const inventario = await inventariosService.iniciar({
        dataRealizacao: values.dataRealizacao,
        descricao: values.descricao || null,
        observacoes: values.observacoes || null,
      })
      setConfirma({
        dataInicio: new Date(values.dataRealizacao).toLocaleDateString('pt-BR'),
        inventarioId: inventario.id,
      })
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao iniciar inventário.' })
    }
  }

  return (
    <div className="ada-page max-w-lg">
      {confirma && (
        <ConfirmacaoInicioInventarioModal
          aberto
          dados={confirma}
          onFechar={() => { const destino = confirma.inventarioId; setConfirma(null); navigate(`/inventarios/${destino}`) }}
          onVerInventario={() => { const destino = confirma.inventarioId; setConfirma(null); navigate(`/inventarios/${destino}`) }}
        />
      )}
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}

      <PageHeader
        titulo="Novo Inventário"
        breadcrumb={['Movimentações', 'Inventários']}
      />

      <form onSubmit={handleSubmit(onSubmit as any)}>
        <FormCard>
          <FormSection titulo="Dados do Inventário" />
          <div className="grid gap-4">
            <CampoTexto
              label="Data de Realização"
              obrigatorio
              type="date"
              erro={errors.dataRealizacao?.message}
              {...register('dataRealizacao')}
            />
            <CampoTexto
              label="Descrição"
              placeholder="Ex: Inventário mensal de abril"
              maxLength={200}
              {...register('descricao')}
            />
            <FormTextarea
              label="Observações"
              placeholder="Observações gerais..."
              {...register('observacoes')}
            />
          </div>

          <FormActions
            salvando={isSubmitting}
            labelSalvar="Iniciar Inventário"
            onCancelar={() => navigate('/inventarios')}
          />
        </FormCard>
      </form>
    </div>
  )
}
