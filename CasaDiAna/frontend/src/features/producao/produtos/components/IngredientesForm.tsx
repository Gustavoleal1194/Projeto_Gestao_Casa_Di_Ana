import { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { CampoTexto } from '@/components/form/CampoTexto'
import { SelectCampo } from '@/components/form/SelectCampo'
import { FormCard } from '@/components/form/FormCard'
import { FormSection } from '@/components/form/FormSection'
import { FooterFormulario } from './FooterFormulario'
import type { ItemFichaTecnicaInput } from '@/types/producao'
import type { IngredienteResumo } from '@/types/estoque'

const fichaSchema = z.object({
  itens: z.array(
    z.object({
      ingredienteId: z.string().min(1, 'Selecione um ingrediente.'),
      quantidadePorUnidade: z.preprocess(
        (v) => (v === '' || v == null ? undefined : Number(v)),
        z.number().positive('Deve ser maior que zero'),
      ),
    }),
  ).min(1, 'Adicione pelo menos um ingrediente.'),
})

type FichaFormValues = {
  itens: { ingredienteId: string; quantidadePorUnidade: number | undefined }[]
}

interface Props {
  itensIniciais: ItemFichaTecnicaInput[]
  ingredientes: IngredienteResumo[]
  salvando: boolean
  onSalvar: (itens: ItemFichaTecnicaInput[]) => void
  onVoltar: () => void
}

export function IngredientesForm({ itensIniciais, ingredientes, salvando, onSalvar, onVoltar }: Props) {
  const { register, control, handleSubmit, reset, formState: { errors } } =
    useForm<FichaFormValues>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(fichaSchema) as any,
      defaultValues: { itens: [{ ingredienteId: '', quantidadePorUnidade: undefined }] },
    })

  const { fields, append, remove } = useFieldArray({ control, name: 'itens' })

  useEffect(() => {
    if (itensIniciais.length > 0) {
      reset({ itens: itensIniciais })
    }
  }, [itensIniciais, reset])

  const onSubmit = (values: FichaFormValues) => {
    onSalvar(
      values.itens.map(i => ({
        ingredienteId: i.ingredienteId,
        quantidadePorUnidade: i.quantidadePorUnidade as number,
      })),
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit as any)}>
      <FormCard>
        <FormSection titulo="Ingredientes" />

        {errors.itens && !Array.isArray(errors.itens) && (
          <p className="mb-3 text-xs text-red-600 flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            {(errors.itens as { message?: string }).message}
          </p>
        )}

        <div className="grid grid-cols-[1fr_160px_36px] gap-2 px-1 mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ada-muted)' }}>Ingrediente</span>
          <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ada-muted)' }}>Qtd. por unidade</span>
          <span />
        </div>

        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-[1fr_160px_36px] gap-2 items-start">
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
                {...register(`itens.${index}.quantidadePorUnidade`)}
                erro={errors.itens?.[index]?.quantidadePorUnidade?.message}
              />
              <button
                type="button"
                onClick={() => fields.length > 1 && remove(index)}
                disabled={fields.length === 1}
                className="mt-0.5 p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ color: 'var(--ada-muted)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#DC2626'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ada-muted)'}
                title="Remover ingrediente"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => append({ ingredienteId: '', quantidadePorUnidade: undefined })}
          className="mt-3 flex items-center gap-1.5 text-xs font-semibold transition-colors"
          style={{ color: '#C4870A' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#B87D0A'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#C4870A'}
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Adicionar ingrediente
        </button>

        <FooterFormulario salvando={salvando} onVoltar={onVoltar} labelSalvar="Salvar Ficha Técnica" />
      </FormCard>
    </form>
  )
}
