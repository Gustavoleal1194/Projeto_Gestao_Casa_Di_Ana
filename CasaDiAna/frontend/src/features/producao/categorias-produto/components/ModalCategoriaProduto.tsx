import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { CampoTexto } from '@/components/form/CampoTexto'
import { Spinner } from '@/components/form/Spinner'
import type { CategoriaProduto } from '@/types/producao'

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório.').max(100, 'Máximo 100 caracteres.'),
})
type FormValues = z.infer<typeof schema>

interface Props {
  categoria?: CategoriaProduto | null
  salvando: boolean
  onSalvar: (nome: string) => void
  onFechar: () => void
}

export function ModalCategoriaProduto({ categoria, salvando, onSalvar, onFechar }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { nome: categoria?.nome ?? '' },
  })

  useEffect(() => {
    reset({ nome: categoria?.nome ?? '' })
  }, [categoria, reset])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !salvando) onFechar()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [salvando, onFechar])

  const onSubmit = (values: FormValues) => onSalvar(values.nome)

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-cat-prod-titulo"
      onClick={e => { if (e.target === e.currentTarget && !salvando) onFechar() }}
    >
      <div className="modal-card max-w-sm">
        <div className="modal-header">
          <h2
            id="modal-cat-prod-titulo"
            className="text-[15px] font-semibold"
            style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
          >
            {categoria ? 'Editar Categoria' : 'Nova Categoria de Produto'}
          </h2>
          <button
            type="button"
            onClick={onFechar}
            disabled={salvando}
            className="p-1.5 rounded-lg transition-colors duration-150 outline-none
                       focus-visible:ring-2 focus-visible:ring-[#C4870A]/40 disabled:opacity-40"
            aria-label="Fechar"
            style={{ color: 'var(--ada-muted)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--ada-bg)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            <XMarkIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6 py-5">
            <CampoTexto
              label="Nome"
              obrigatorio
              placeholder="Ex: Bolos"
              autoFocus
              {...register('nome')}
              erro={errors.nome?.message}
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onFechar}
              disabled={salvando}
              className="btn-secondary disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="btn-primary disabled:opacity-60"
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
