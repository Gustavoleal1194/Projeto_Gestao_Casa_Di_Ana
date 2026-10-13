import { useFieldArray, useFormContext } from 'react-hook-form'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { CampoTexto } from '@/components/form/CampoTexto'
import type { CabecalhoEntradaValues } from '@/types/estoque'

export function SecaoBoletos() {
  const { control, register, watch, setValue, formState: { errors } } = useFormContext<CabecalhoEntradaValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'boletos' })
  const temBoleto = watch('temBoleto')

  const alternarBoleto = (marcado: boolean) => {
    setValue('temBoleto', marcado)
    if (marcado && fields.length === 0) append({ dataVencimento: '' })
    if (!marcado) remove()
  }

  return (
    <>
      <div className="col-span-2">
        <label className="flex items-center gap-3 cursor-pointer select-none" htmlFor="temBoleto">
          <input
            id="temBoleto"
            type="checkbox"
            checked={temBoleto}
            onChange={e => alternarBoleto(e.target.checked)}
            className="h-4 w-4 rounded"
            style={{ accentColor: 'var(--color-ada-accent)' }}
          />
          <span className="text-sm font-medium" style={{ color: 'var(--ada-body)' }}>
            Pagamento via boleto
          </span>
        </label>
      </div>

      {temBoleto && (
        <div className="col-span-2 flex flex-col gap-3">
          {fields.map((field, index) => (
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
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="mt-0.5 p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--ada-muted)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--ada-error-text)'}
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
            onClick={() => append({ dataVencimento: '' })}
            className="flex items-center gap-1.5 text-xs font-semibold self-start transition-opacity hover:opacity-80"
            style={{ color: 'var(--color-ada-accent)' }}
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Adicionar outro boleto
          </button>
        </div>
      )}
    </>
  )
}
