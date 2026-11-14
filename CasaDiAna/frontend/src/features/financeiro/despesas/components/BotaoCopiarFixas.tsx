import { useState } from 'react'
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline'
import { despesasService } from '../services/despesasService'
import { mesParaCompetencia, nomeMesAnterior } from '../../shared/competencia'

interface Props {
  mes: string
  onConcluido: (resultado: { tipo: 'sucesso' | 'aviso' | 'erro'; mensagem: string }) => void
}

/** Repete no mês exibido as despesas fixas do mês anterior (sem duplicar as já lançadas). */
export function BotaoCopiarFixas({ mes, onConcluido }: Props) {
  const [copiando, setCopiando] = useState(false)
  const origem = nomeMesAnterior(mes)

  const copiar = async () => {
    setCopiando(true)
    try {
      const { copiadas, jaExistentes } = await despesasService.replicarFixas(mesParaCompetencia(mes))
      if (copiadas > 0)
        onConcluido({ tipo: 'sucesso', mensagem: `${copiadas} despesa(s) fixa(s) copiada(s) de ${origem}. Confira os valores.` })
      else
        onConcluido({ tipo: 'aviso', mensagem: jaExistentes > 0
          ? `As despesas fixas de ${origem} já estão neste mês.`
          : `Nenhuma despesa fixa em ${origem} para copiar.` })
    } catch {
      onConcluido({ tipo: 'erro', mensagem: 'Erro ao copiar despesas fixas.' })
    } finally { setCopiando(false) }
  }

  return (
    <button type="button" onClick={copiar} disabled={copiando} title={`Repete aqui as despesas fixas de ${origem}`}
      className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium border disabled:opacity-60"
      style={{ background: 'var(--ada-bg)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)' }}>
      <DocumentDuplicateIcon className="h-4 w-4" /> {copiando ? 'Copiando…' : 'Copiar do mês anterior'}
    </button>
  )
}
