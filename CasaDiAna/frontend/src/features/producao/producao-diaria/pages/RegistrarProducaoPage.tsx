// frontend/src/features/producao/producao-diaria/pages/RegistrarProducaoPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageHeader } from '@/components/ui/PageHeader'
import { producaoDiariaService } from '../services/producaoDiariaService'
import { produtosService } from '@/features/producao/produtos/services/produtosService'
import { CampoTexto } from '@/features/estoque/ingredientes/components/CampoTexto'
import { SelectCampo } from '@/features/estoque/ingredientes/components/SelectCampo'
import { FormTextarea } from '@/components/form/FormTextarea'
import { FormSection } from '@/components/form/FormSection'
import { FormActions } from '@/components/form/FormActions'
import { FormCard } from '@/components/form/FormCard'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import type { ProdutoResumo, ProducaoFormValues } from '@/types/producao'

const producaoSchema = z.object({
  produtoId: z.string().min(1, 'Selecione um produto.'),
  data: z.string().min(1, 'Informe a data.'),
  quantidadeProduzida: z
    .string()
    .min(1, 'Informe a quantidade.')
    .refine(v => Number(v) > 0, 'Quantidade deve ser maior que 0.'),
  observacoes: z.string(),
})

export function RegistrarProducaoPage() {
  const navigate = useNavigate()
  const [produtos, setProdutos] = useState<ProdutoResumo[]>([])
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<ProducaoFormValues>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(producaoSchema) as any,
      defaultValues: {
        produtoId: '',
        data: new Date().toISOString().split('T')[0],
        quantidadeProduzida: '',
        observacoes: '',
      },
    })

  useEffect(() => {
    produtosService.listar().then(setProdutos).catch(() => {})
  }, [])

  const onSubmit = async (values: ProducaoFormValues) => {
    try {
      await producaoDiariaService.registrar({
        produtoId: values.produtoId,
        data: values.data,
        quantidadeProduzida: Number(values.quantidadeProduzida),
        observacoes: values.observacoes || null,
      })
      setToast({ tipo: 'sucesso', mensagem: 'Produção registrada com sucesso.' })
      setTimeout(() => navigate('/producao/diaria'), 1200)
    } catch (err: unknown) {
      const erros = (err as { response?: { data?: { erros?: string[] } } })?.response?.data?.erros
      setToast({ tipo: 'erro', mensagem: erros?.[0] ?? 'Erro ao registrar produção.' })
    }
  }

  return (
    <div className="ada-page max-w-lg">
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}

      <PageHeader
        titulo="Registrar Produção"
        breadcrumb={['Produção', 'Produção Diária']}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <FormCard>
          <FormSection titulo="Dados da Produção" />
          <div className="grid gap-4">
            <SelectCampo
              label="Produto"
              obrigatorio
              opcoes={produtos.map(p => ({ valor: p.id, rotulo: p.nome }))}
              {...register('produtoId')}
              erro={errors.produtoId?.message}
            />
            <div className="grid grid-cols-2 gap-4">
              <CampoTexto
                label="Data"
                obrigatorio
                type="date"
                {...register('data')}
                erro={errors.data?.message}
              />
              <CampoTexto
                label="Quantidade Produzida"
                obrigatorio
                type="number"
                step="0.001"
                min="0.001"
                placeholder="Ex: 10"
                {...register('quantidadeProduzida')}
                erro={errors.quantidadeProduzida?.message}
              />
            </div>
            <FormTextarea
              label="Observações"
              placeholder="Observações (opcional)"
              rows={2}
              {...register('observacoes')}
            />
          </div>

          <div
            className="mt-4 rounded-lg px-4 py-3 text-xs"
            style={{ background: 'var(--ada-warning-bg)', border: '1px solid var(--ada-warning-border)', color: 'var(--ada-warning-text)' }}
          >
            O estoque dos ingredientes da ficha técnica será debitado automaticamente ao registrar a produção.
          </div>

          <FormActions
            salvando={isSubmitting}
            labelSalvar="Registrar Produção"
            onCancelar={() => navigate('/producao/diaria')}
          />
        </FormCard>
      </form>
    </div>
  )
}
