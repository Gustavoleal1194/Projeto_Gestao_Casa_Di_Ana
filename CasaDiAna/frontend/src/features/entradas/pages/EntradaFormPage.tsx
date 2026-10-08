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
import { utensiliosService } from '@/features/estoque/utensilios/services/utensiliosService'
import { CampoTexto } from '@/components/form/CampoTexto'
import { SelectCampo } from '@/components/form/SelectCampo'
import { ComboboxCampo } from '@/components/form/ComboboxCampo'
import { FormSection } from '@/components/form/FormSection'
import { FormActions } from '@/components/form/FormActions'
import { FormCard } from '@/components/form/FormCard'
import { Toast } from '@/components/ui/Toast'
import { ConfirmacaoEntradaModal, type DadosConfirmacaoEntrada } from '../components/ConfirmacaoEntradaModal'
import type { Fornecedor, IngredienteResumo, UtensilioResumo, EntradaFormValues, EntradaMercadoria } from '@/types/estoque'

const boletoSchema = z.object({
  dataVencimento: z.string().min(1, 'Informe a data de vencimento.'),
})

const entradaSchema = z.object({
  fornecedorId: z.string().min(1, 'Selecione um fornecedor.'),
  dataEntrada: z.string().min(1, 'Informe a data da entrada.'),
  numeroNotaFiscal: z.string().max(60),
  recebidoPor: z.string().min(1, 'Informe quem recebeu os produtos.').max(100),
  observacoes: z.string(),
  temBoleto: z.boolean().default(false),
  boletos: z.array(boletoSchema).default([]),
  itens: z
    .array(
      z.object({
        tipo: z.enum(['ingrediente', 'utensilio']),
        itemId: z.string().min(1, 'Selecione um item.'),
        quantidade: z.preprocess(
          (v) => (v === '' || v == null ? undefined : Number(v)),
          z.number().positive('Quantidade deve ser maior que 0.')
        ),
        custoUnitario: z.preprocess(
          (v) => (v === '' || v == null ? undefined : Number(v)),
          z.number().min(0, 'Custo deve ser ≥ 0.')
        ),
      })
    )
    .min(1, 'Adicione pelo menos um item.'),
}).refine(
  (data) => !data.temBoleto || data.boletos.length > 0,
  { message: 'Adicione pelo menos um boleto.', path: ['boletos'] }
)

export function EntradaFormPage() {
  const navigate = useNavigate()
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [ingredientes, setIngredientes] = useState<IngredienteResumo[]>([])
  const [utensilios, setUtensilios] = useState<UtensilioResumo[]>([])
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)
  const [confirma, setConfirma] = useState<DadosConfirmacaoEntrada | null>(null)

  const { register, control, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<EntradaFormValues>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(entradaSchema) as any,
      defaultValues: {
        fornecedorId: '',
        dataEntrada: new Date().toISOString().split('T')[0],
        numeroNotaFiscal: '',
        recebidoPor: '',
        observacoes: '',
        temBoleto: false,
        boletos: [],
        itens: [{ tipo: 'ingrediente', itemId: '', quantidade: undefined, custoUnitario: undefined }],
      },
    })

  const temBoleto = watch('temBoleto')
  const itensAtuais = watch('itens')

  const { fields, append, remove } = useFieldArray({ control, name: 'itens' })
  const { fields: boletoFields, append: appendBoleto, remove: removeBoleto } = useFieldArray({ control, name: 'boletos' })

  useEffect(() => {
    fornecedoresService.listar().then(setFornecedores).catch(() => {})
    ingredientesService.listar().then(setIngredientes).catch(() => {})
    utensiliosService.listar().then(setUtensilios).catch(() => {})
  }, [])

  const handleToggleBoleto = (checked: boolean) => {
    setValue('temBoleto', checked)
    if (checked && boletoFields.length === 0) {
      appendBoleto({ dataVencimento: '' })
    }
    if (!checked) {
      for (let i = boletoFields.length - 1; i >= 0; i--) removeBoleto(i)
    }
  }

  const onSubmit = async (values: EntradaFormValues) => {
    try {
      const itensIngrediente = values.itens.filter(i => i.tipo === 'ingrediente')
      const itensUtensilio = values.itens.filter(i => i.tipo === 'utensilio')

      const resultado: EntradaMercadoria = await entradasService.registrar({
        fornecedorId: values.fornecedorId,
        dataEntrada: values.dataEntrada,
        recebidoPor: values.recebidoPor,
        numeroNotaFiscal: values.numeroNotaFiscal || null,
        observacoes: values.observacoes || null,
        datasVencimentoBoleto: values.temBoleto
          ? values.boletos.map(b => b.dataVencimento)
          : undefined,
        itens: itensIngrediente.map(item => ({
          ingredienteId: item.itemId,
          quantidade: item.quantidade!,
          custoUnitario: item.custoUnitario!,
        })),
        itensUtensilio: itensUtensilio.map(item => ({
          utensilioId: item.itemId,
          quantidade: item.quantidade!,
          custoUnitario: item.custoUnitario!,
        })),
      })
      setConfirma({
        fornecedorNome: resultado.fornecedorNome,
        numeroNotaFiscal: resultado.numeroNotaFiscal,
        custoTotal: resultado.custoTotal,
        horario: new Date(resultado.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        itens: [
          ...resultado.itens.map(item => ({
            nome: item.ingredienteNome,
            unidadeMedidaCodigo: item.unidadeMedidaCodigo,
            quantidade: item.quantidade,
            custoTotal: item.custoTotal,
          })),
          ...resultado.itensUtensilio.map(item => ({
            nome: item.utensilioNome,
            unidadeMedidaCodigo: item.unidadeMedidaCodigo,
            quantidade: item.quantidade,
            custoTotal: item.custoTotal,
          })),
        ],
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
            <ComboboxCampo
              control={control}
              name="fornecedorId"
              label="Fornecedor"
              obrigatorio
              placeholder="Buscar fornecedor…"
              opcoes={fornecedores.map(f => ({ valor: f.id, rotulo: f.razaoSocial }))}
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

            <div className="col-span-2">
              <label
                className="flex items-center gap-3 cursor-pointer select-none"
                htmlFor="temBoleto"
              >
                <input
                  id="temBoleto"
                  type="checkbox"
                  checked={temBoleto}
                  onChange={e => handleToggleBoleto(e.target.checked)}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: '#C4870A' }}
                />
                <span className="text-sm font-medium" style={{ color: 'var(--ada-body)' }}>
                  Pagamento via boleto
                </span>
              </label>
            </div>

            {temBoleto && (
              <div className="col-span-2 flex flex-col gap-3">
                {boletoFields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-2">
                    <div className="flex-1">
                      <CampoTexto
                        label={`Vencimento do boleto ${index + 1}`}
                        obrigatorio
                        type="date"
                        {...register(`boletos.${index}.dataVencimento`)}
                        erro={errors.boletos?.[index]?.dataVencimento?.message}
                      />
                    </div>
                    {boletoFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBoleto(index)}
                        className="mt-0.5 p-2 rounded-lg transition-colors"
                        style={{ color: 'var(--ada-muted)' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#DC2626'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ada-muted)'}
                        title="Remover boleto"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}

                {errors.boletos?.message && (
                  <p className="text-xs" style={{ color: 'var(--ada-error-text)' }} role="alert">
                    {errors.boletos.message}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => appendBoleto({ dataVencimento: '' })}
                  className="flex items-center gap-1.5 text-xs font-semibold self-start transition-colors"
                  style={{ color: '#C4870A' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#B87D0A'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#C4870A'}
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Adicionar outro boleto
                </button>
              </div>
            )}
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

          <div
            className="grid grid-cols-[110px_1fr_110px_130px_36px] gap-2 px-1 mb-1.5"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ada-muted)' }}>Tipo</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ada-muted)' }}>Item</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ada-muted)' }}>Quantidade</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ada-muted)' }}>Custo Unit. (R$)</span>
            <span />
          </div>

          <div className="space-y-2">
            {fields.map((field, index) => {
              const tipoLinha = itensAtuais?.[index]?.tipo ?? 'ingrediente'
              const opcoesItem = tipoLinha === 'ingrediente'
                ? ingredientes.map(ing => ({ valor: ing.id, rotulo: `${ing.nome} (${ing.unidadeMedidaCodigo})` }))
                : utensilios.map(ute => ({ valor: ute.id, rotulo: `${ute.nome} (${ute.unidadeMedidaCodigo})` }))

              return (
                <div key={field.id} className="grid grid-cols-[110px_1fr_110px_130px_36px] gap-2 items-start">
                  <SelectCampo
                    label=" "
                    opcoes={[
                      { valor: 'ingrediente', rotulo: 'Ingrediente' },
                      { valor: 'utensilio', rotulo: 'Utensílio' },
                    ]}
                    value={tipoLinha}
                    onChange={(e) => {
                      setValue(`itens.${index}.tipo`, e.target.value as 'ingrediente' | 'utensilio')
                      setValue(`itens.${index}.itemId`, '')
                    }}
                  />
                  <ComboboxCampo
                    control={control}
                    name={`itens.${index}.itemId`}
                    label=" "
                    placeholder="Buscar item…"
                    opcoes={opcoesItem}
                    erro={errors.itens?.[index]?.itemId?.message}
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
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => append({ tipo: 'ingrediente', itemId: '', quantidade: undefined, custoUnitario: undefined })}
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
