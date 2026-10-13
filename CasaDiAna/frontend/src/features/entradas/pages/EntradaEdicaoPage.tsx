import { Link, useParams } from 'react-router-dom'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { LoadingState } from '@/components/ui/LoadingState'
import { PageHeader } from '@/components/ui/PageHeader'
import { useEntradaEdicao } from '../hooks/useEntradaEdicao'
import { FormularioEdicaoEntrada } from '../components/FormularioEdicaoEntrada'
import type { EntradaMercadoria } from '@/types/estoque'

function motivoBloqueio(entrada: EntradaMercadoria | null, erro: string | null): string | null {
  if (erro) return erro
  if (!entrada) return 'Entrada não encontrada.'
  if (entrada.status !== 'Confirmada') return 'Entradas canceladas não podem ser editadas.'
  return null
}

export function EntradaEdicaoPage() {
  const { id } = useParams<{ id: string }>()
  const { entrada, fornecedores, loading, erro } = useEntradaEdicao(id)
  const mensagemBloqueio = motivoBloqueio(entrada, erro)

  return (
    <div className="ada-page max-w-3xl">
      <Link to={id ? `/entradas/${id}` : '/entradas'} className="back-link">
        <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
        Voltar para a entrada
      </Link>
      <PageHeader titulo="Editar Entrada" />
      {loading ? (
        <LoadingState mensagem="Carregando entrada…" />
      ) : mensagemBloqueio || !entrada ? (
        <div className="state-error" role="alert">{mensagemBloqueio}</div>
      ) : (
        <FormularioEdicaoEntrada entrada={entrada} fornecedores={fornecedores} />
      )}
    </div>
  )
}
