// frontend/src/components/ui/StatusBadge2Fa.tsx
import { ShieldCheckIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline'

interface Props {
  status: 'ativo' | 'inativo'
}

export function StatusBadge2Fa({ status }: Props) {
  if (status === 'ativo') {
    return (
      <span className="inline-flex items-center gap-1 badge badge-active">
        <ShieldCheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
        Ativo
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center gap-1 badge badge-inactive"
      title="O usuário deve ativar em Minha Conta"
      style={{ cursor: 'help' }}
    >
      <ShieldExclamationIcon className="h-3.5 w-3.5" aria-hidden="true" />
      Inativo
    </span>
  )
}
