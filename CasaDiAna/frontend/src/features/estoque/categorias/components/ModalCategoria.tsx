import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { XMarkIcon } from '@heroicons/react/24/outline'
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(13,17,23,0.55)', backdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-categoria-titulo"
      onClick={e => { if (e.target === e.currentTarget && !salvando) onFechar() }}
    >
      <div
        className="w-full max-w-sm rounded-2xl"
        style={{
          background: 'var(--ada-surface)',
          border: '1px solid var(--ada-border)',
          boxShadow: '0 24px 48px rgba(13,17,23,0.18), 0 8px 16px rgba(13,17,23,0.10)',
          animation: 'modalIn 200ms cubic-bezier(0.34,1.56,0.64,1) both',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 pt-5 pb-4"
          style={{ borderBottom: '1px solid var(--ada-border-sub)' }}
        >
          <h2
            id="modal-categoria-titulo"
            className="text-[15px] font-semibold"
            style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
          >
            {categoria ? 'Editar Categoria' : 'Nova Categoria'}
          </h2>
          <button
            type="button"
            onClick={onFechar}
            disabled={salvando}
            className="p-1.5 rounded-lg transition-colors duration-150 outline-none
                       focus-visible:ring-2 focus-visible:ring-[#C4870A]/40
                       disabled:opacity-40"
            aria-label="Fechar"
            style={{ color: 'var(--ada-muted)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--ada-bg)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            <XMarkIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6 py-5">
            <CampoTexto
              label="Nome"
              obrigatorio
              placeholder="Ex: Laticínios"
              autoFocus
              {...register('nome')}
              erro={errors.nome?.message}
            />
          </div>

          {/* Footer */}
          <div
            className="flex justify-end gap-2.5 px-6 py-4"
            style={{
              borderTop: '1px solid var(--ada-border-sub)',
              background: 'var(--ada-surface-2)',
              borderRadius: '0 0 16px 16px',
            }}
          >
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

        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: scale(0.95) translateY(8px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
          @media (prefers-reduced-motion: reduce) {
            [role="dialog"] > div { animation: none !important; }
          }
        `}</style>
      </div>
    </div>
  )
}
