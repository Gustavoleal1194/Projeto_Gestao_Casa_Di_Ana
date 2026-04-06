import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { CampoTexto } from '@/features/estoque/ingredientes/components/CampoTexto'
import { Spinner } from '@/components/form/Spinner'
import type { CategoriaIngrediente } from '@/types/estoque'

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório.').max(100, 'Máximo 100 caracteres.'),
})
type FormValues = z.infer<typeof schema>

interface Props {
  categoria?: CategoriaIngrediente | null
  salvando: boolean
  onSalvar: (nome: string) => void
  onFechar: () => void
}

export function ModalCategoria({ categoria, salvando, onSalvar, onFechar }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { nome: categoria?.nome ?? '' },
  })

  useEffect(() => {
    reset({ nome: categoria?.nome ?? '' })
  }, [categoria, reset])

  const onSubmit = (values: FormValues) => onSalvar(values.nome)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="w-full max-w-sm mx-4 rounded-2xl p-6"
        style={{ background: 'var(--ada-surface)', boxShadow: 'var(--shadow-xl)' }}
      >
        <h2
          className="text-base font-bold mb-5"
          style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
        >
          {categoria ? 'Editar Categoria' : 'Nova Categoria'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CampoTexto
            label="Nome"
            obrigatorio
            placeholder="Ex: Laticínios"
            autoFocus
            {...register('nome')}
            erro={errors.nome?.message}
          />

          <div
            className="flex justify-end gap-2.5 pt-5 mt-5"
            style={{ borderTop: '1px solid var(--ada-border-sub)' }}
          >
            <button
              type="button"
              onClick={onFechar}
              disabled={salvando}
              className="px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[var(--ada-bg)] transition-colors"
              style={{ border: '1px solid var(--ada-border)', color: 'var(--ada-body)', background: 'var(--ada-surface)' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #D4960C 0%, #B87D0A 100%)', boxShadow: '0 3px 10px rgba(196,135,10,0.28)' }}
            >
              {salvando && <Spinner />}
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
