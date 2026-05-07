// frontend/src/features/entradas/pages/EntradaFormPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { entradasService } from '../services/entradasService'
import { fornecedoresService } from '@/features/fornecedores/services/fornecedoresService'
import { ingredientesService } from '@/features/estoque/ingredientes/services/ingredientesService'
import { CampoTexto } from '@/components/form/CampoTexto'
import { SelectCampo } from '@/components/form/SelectCampo'
import { FormSection } from '@/components/form/FormSection'
import { FormActions } from '@/components/form/FormActions'
import { FormCard } from '@/components/form/FormCard'
import { Toast } from '@/components/ui/Toast'
import { ConfirmacaoEntradaModal, type DadosConfirmacaoEntrada } from '../components/ConfirmacaoEntradaModal'
import type { Fornecedor, IngredienteResumo, EntradaFormValues, EntradaMercadoria } from '@/types/estoque'

const entradaSchema = z.object({
  fornecedorId: z.string().min(1, 'Selecione um fornecedor.'),
  dataEntrada: z.string().min(1, 'Informe a data da entrada.'),
  numeroNotaFiscal: z.string().max(60),
  recebidoPor: z.string().min(1, 'Informe quem recebeu os produtos.').max(100),
  observacoes: z.string(),
  itens: z
    .array(
      z.object({
        ingredienteId: z.string().min(1, 'Selecione um ingrediente.'),
        quantidade: z.preprocess(
          (v) => (v === '' || v == null ? undefined : Number(v)),
          z.number()
            .positive('Quantidade deve ser maior que 0.')
        ),
        custoUnitario: z.preprocess(
          (v) => (v === '' || v == null ? undefined : Number(v)),
          z.number()
            .min(0, 'Custo deve ser ≥ 0.')
        ),
      })
    )
    .min(1, 'Adicione pelo menos um item.'),
})

export function EntradaFormPage() {
  const navigate = useNavigate()
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [ingredientes, setIngredientes] = useState<IngredienteResumo[]>([])
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)
  const [confirma, setConfirma] = useState<DadosConfirmacaoEntrada | null>(null)

  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<EntradaFormValues>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(entradaSchema) as any,
      defaultValues: {
        fornecedorId: '',
        dataEntrada: new Date().toISOString().split('T')[0],
        numeroNotaFiscal: '',
        recebidoPor: '',
        observacoes: '',
        itens: [{ ingredienteId: '', quantidade: undefined, custoUnitario: undefined }],
      },
    })

  const { fields, append, remove } = useFieldArray({ control, name: 'itens' })

  useEffect(() => {
    fornecedoresService.listar().then(setFornecedores).catch(() => {})
    ingredientesService.listar().then(setIngredientes).catch(() => {})
  }, [])

  const onSubmit = async (values: EntradaFormValues) => {
    try {
      const resultado: EntradaMercadoria = await entradasService.registrar({
        fornecedorId: values.fornecedorId,
        dataEntrada: values.dataEntrada,
        recebidoPor: values.recebidoPor,
        numeroNotaFiscal: values.numeroNotaFiscal || null,
        observacoes: values.observacoes || null,
        itens: values.itens.map(item => ({
          ingredienteId: item.ingredienteId,
          quantidade: item.quantidade!,
          custoUnitario: item.custoUnitario!,
        })),
      })
      setConfirma({
        fornecedorNome: resultado.fornecedorNome,
        numeroNotaFiscal: resultado.numeroNotaFiscal,
        custoTotal: resultado.custoTotal,
        horario: new Date(resultado.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        itens: resultado.itens.map(item => ({
          ingredienteNome: item.ingredienteNome,
          unidadeMedidaCodigo: item.unidadeMedidaCodigo,
          quantidade: item.quantidade,
          custoTotal: item.custoTotal,
        })),
      })
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao registrar entrada.' })
    }
  }

  return (
    <div className="ada-page max-w-3xl">
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}

      <Link to="/entradas" className="back-link">
        <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
        Entradas
      </Link>

      <h1
        className="text-xl font-bold tracking-tight mb-6"
        style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
      >
        Nova Entrada de Mercadoria
      </h1>

      <form onSubmit={handleSubmit(onSubmit as any)}>
        <FormCard>
          <FormSection titulo="Dados da Entrada" />
          <div className="grid grid-cols-2 gap-4">
            <SelectCampo
              label="Fornecedor"
              obrigatorio
              opcoes={fornecedores.map(f => ({ valor: f.id, rotulo: f.razaoSocial }))}
              {...register('fornecedorId')}
              erro={errors.fornecedorId?.message}
            />
            <CampoTexto
              label="Data da Entrada"
              obrigatorio
              type="date"
              {...register('dataEntrada')}
              erro={errors.dataEntrada?.message}
            />
            <CampoTexto
              label="Nota Fiscal"
              placeholder="Número da NF (opcional)"
              {...register('numeroNotaFiscal')}
            />
            <CampoTexto
              label="Recebido por"
              obrigatorio
              placeholder="Nome do funcionário que recebeu"
              {...register('recebidoPor')}
              erro={errors.recebidoPor?.message}
            />
            <CampoTexto
              label="Observações"
              placeholder="Observações (opcional)"
              {...register('observacoes')}
            />
          </div>

          <FormSection titulo="Itens da Entrada" />

          {errors.itens && !Array.isArray(errors.itens) && (
            <p className="mb-3 text-xs text-red-600 flex items-center gap-1">
              <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              {(errors.itens as { message?: string }).message}
            </p>
          )}

          {/* Cabeçalho da tabela de itens */}
          <div
            className="grid grid-cols-[1fr_110px_130px_36px] gap-2 px-1 mb-1.5"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ada-muted)' }}>Ingrediente</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ada-muted)' }}>Quantidade</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ada-muted)' }}>Custo Unit. (R$)</span>
            <span />
          </div>

          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[1fr_110px_130px_36px] gap-2 items-start">
                <SelectCampo
                  label=" "
                  opcoes={ingredientes.map(ing => ({
                    valor: ing.id,
                    rotulo: `${ing.nome} (${ing.unidadeMedidaCodigo})`,
                  }))}
                  {...register(`itens.${index}.ingredienteId`)}
                  erro={errors.itens?.[index]?.ingredienteId?.message}
                />
                <CampoTexto
                  label=" "
                  type="number"
                  step="0.001"
                  min="0.001"
                  placeholder="0.000"
                  {...register(`itens.${index}.quantidade`)}
                  erro={errors.itens?.[index]?.quantidade?.message}
                />
                <CampoTexto
                  label=" "
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register(`itens.${index}.custoUnitario`)}
                  erro={errors.itens?.[index]?.custoUnitario?.message}
                />
                <button
                  type="button"
                  onClick={() => fields.length > 1 && remove(index)}
                  disabled={fields.length === 1}
                  className="mt-0.5 p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ color: 'var(--ada-muted)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#DC2626'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ada-muted)'}
                  title="Remover item"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => append({ ingredienteId: '', quantidade: undefined, custoUnitario: undefined })}
            className="mt-3 flex items-center gap-1.5 text-xs font-semibold transition-colors"
            style={{ color: '#C4870A' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#B87D0A'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#C4870A'}
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Adicionar item
          </button>

          <FormActions
            salvando={isSubmitting}
            labelSalvar="Registrar Entrada"
            onCancelar={() => navigate('/entradas')}
          />
        </FormCard>
      </form>

      {confirma && (
        <ConfirmacaoEntradaModal
          aberto
          dados={confirma}
          onFechar={() => { setConfirma(null); reset() }}
          onVerEntradas={() => { setConfirma(null); navigate('/entradas') }}
        />
      )}
    </div>
  )
}
