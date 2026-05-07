// frontend/src/features/producao/vendas-diarias/pages/RegistrarVendaPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageHeader } from '@/components/ui/PageHeader'
import { vendasDiariasService } from '../services/vendasDiariasService'
import { produtosService } from '@/features/producao/produtos/services/produtosService'
import { CampoTexto } from '@/components/form/CampoTexto'
import { SelectCampo } from '@/components/form/SelectCampo'
import { FormSection } from '@/components/form/FormSection'
import { FormActions } from '@/components/form/FormActions'
import { FormCard } from '@/components/form/FormCard'
import { Toast } from '@/components/ui/Toast'
import type { ProdutoResumo, VendaFormValues } from '@/types/producao'
import { useAuthStore } from '@/store/authStore'
import { ConfirmacaoVendaModal, type DadosConfirmacaoVenda } from '../components/ConfirmacaoVendaModal'

const vendaSchema = z.object({
  produtoId: z.string().min(1, 'Selecione um produto.'),
  data: z.string().min(1, 'Informe a data.'),
  quantidadeVendida: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number()
      .int('Deve ser um número inteiro')
      .positive('Deve ser maior que zero')
  ),
})

export function RegistrarVendaPage() {
  const navigate = useNavigate()
  const { usuario } = useAuthStore()
  const [produtos, setProdutos] = useState<ProdutoResumo[]>([])
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)
  const [confirma, setConfirma] = useState<DadosConfirmacaoVenda | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<VendaFormValues>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(vendaSchema) as any,
      defaultValues: {
        produtoId: '',
        data: new Date().toISOString().split('T')[0],
        quantidadeVendida: undefined,
      },
    })

  useEffect(() => {
    produtosService.listar().then(setProdutos).catch(() => {})
  }, [])

  const onSubmit = async (values: VendaFormValues) => {
    try {
      const resultado = await vendasDiariasService.registrar({
        produtoId: values.produtoId,
        data: values.data,
        quantidadeVendida: values.quantidadeVendida!,
      })
      const produto = produtos.find(p => p.id === values.produtoId)
      if (!produto) {
        setToast({ tipo: 'erro', mensagem: 'Produto não encontrado. Recarregue a página.' })
        return
      }
      const valorUnitario = produto.precoVenda
      const quantidade = values.quantidadeVendida!
      setConfirma({
        produtoNome: resultado.produtoNome,
        quantidade,
        valorUnitario,
        total: quantidade * valorUnitario,
        operador: usuario?.nome ?? '—',
        horario: new Date(resultado.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      })
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao registrar venda.' })
    }
  }

  return (
    <div className="ada-page max-w-lg">
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}

      <PageHeader
        titulo="Registrar Venda"
        breadcrumb={['Produção', 'Vendas Diárias']}
      />

      <form onSubmit={handleSubmit(onSubmit as any)}>
        <FormCard>
          <FormSection titulo="Dados da Venda" />
          <div className="grid gap-4">
            <SelectCampo
              label="Produto"
              obrigatorio
              opcoes={produtos.filter(p => p.ativo).map(p => ({ valor: p.id, rotulo: p.nome }))}
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
                label="Quantidade Vendida"
                obrigatorio
                type="number"
                step="1"
                min="1"
                placeholder="Ex: 5"
                {...register('quantidadeVendida')}
                erro={errors.quantidadeVendida?.message}
              />
            </div>
          </div>

          <FormActions
            salvando={isSubmitting}
            labelSalvar="Registrar Venda"
            onCancelar={() => navigate('/producao/vendas')}
          />
        </FormCard>
      </form>

      {confirma && (
        <ConfirmacaoVendaModal
          aberto
          dados={confirma}
          onFechar={() => { setConfirma(null); reset() }}
          onVerRelatorio={() => { setConfirma(null); navigate('/producao/vendas') }}
        />
      )}
    </div>
  )
}
