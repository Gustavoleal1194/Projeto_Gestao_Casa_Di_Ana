import { useMemo, useState } from 'react'
import { ScaleIcon } from '@heroicons/react/24/outline'
import { EmptyState } from '@/components/ui/EmptyState'
import { KpiCard } from '@/components/ui/KpiCard'
import { FiltrosBuscaCadastro } from '@/components/ui/FiltrosBuscaCadastro'
import { contemTexto } from '@/utils/texto'
import type { ComparacaoPreco } from '@/types/estoque'
import { useNavegacaoIngrediente } from '../../hooks/useNavegacaoIngrediente'
import { TabelaDestaque } from './TabelaDestaque'
import { TabelaComparacao } from './TabelaComparacao'

/** Conteúdo da comparação já carregada. Remontado (via key) a cada nova consulta. */
export function ResultadoComparacao({ dados }: { dados: ComparacaoPreco }) {
  const [busca, setBusca] = useState('')
  const { abertos, foco, alternar, focar } = useNavegacaoIngrediente()

  const visiveis = useMemo(
    () => dados.ingredientes.filter(i => contemTexto(i.ingredienteNome, busca)),
    [dados.ingredientes, busca],
  )

  const irParaIngrediente = (id: string) => {
    if (!visiveis.some(i => i.ingredienteId === id)) setBusca('')
    focar(id)
  }

  if (dados.ingredientes.length === 0) {
    return (
      <EmptyState
        icon={<ScaleIcon className="w-7 h-7" />}
        titulo="Nenhum ingrediente encontrado"
        descricao="Não há entradas de mercadoria confirmadas no período selecionado."
      />
    )
  }

  const contar = (t: string) => dados.ingredientes.filter(i => i.tendenciaPreco === t).length

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Ingredientes comparados" valor={String(dados.ingredientes.length)} variante="amber" />
        <KpiCard label="Com aumento de preço" valor={String(contar('aumento'))} variante="red" />
        <KpiCard label="Com redução de preço" valor={String(contar('reducao'))} variante="green" />
      </div>

      {(dados.maioresAumentos.length > 0 || dados.maioresReducoes.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <TabelaDestaque titulo="Maiores aumentos" itens={dados.maioresAumentos} onSelecionar={irParaIngrediente} />
          <TabelaDestaque titulo="Maiores reduções" itens={dados.maioresReducoes} onSelecionar={irParaIngrediente} />
        </div>
      )}

      <FiltrosBuscaCadastro
        id="busca-ingrediente-comparacao"
        rotulo="Buscar ingrediente"
        placeholder="Buscar ingrediente…"
        busca={busca}
        onBuscaChange={setBusca}
      />

      <TabelaComparacao itens={visiveis} busca={busca} abertos={abertos} foco={foco} onToggle={alternar} />
    </>
  )
}
