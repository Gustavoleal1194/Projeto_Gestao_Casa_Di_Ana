import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { inventariosService } from '../services/inventariosService'
import { CampoTexto } from '@/features/estoque/ingredientes/components/CampoTexto'
import { FormTextarea } from '@/components/form/FormTextarea'
import { FormSection } from '@/components/form/FormSection'
import { FormActions } from '@/components/form/FormActions'
import { FormCard } from '@/components/form/FormCard'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'

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
      setToast({ tipo: 'sucesso', mensagem: 'Inventário iniciado.' })
      setTimeout(() => navigate(`/inventarios/${inventario.id}`), 800)
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao iniciar inventário.' })
    }
  }

  return (
    <div className="p-6 max-w-lg">
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}

      <Link
        to="/inventarios"
        className="inline-flex items-center gap-1.5 text-sm font-medium mb-5 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#C4870A]/40 rounded"
        style={{ color: 'var(--ada-muted)' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#C4870A'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ada-muted)'}
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Inventários
      </Link>

      <h1
        className="text-xl font-bold tracking-tight mb-6"
        style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
      >
        Novo Inventário
      </h1>

      <form onSubmit={handleSubmit(onSubmit)}>
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
