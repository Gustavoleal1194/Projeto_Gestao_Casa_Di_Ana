import type { ComparacaoPrecoIngrediente } from '@/types/estoque'
import { LinhaIngrediente } from './LinhaIngrediente'

interface Props {
  itens: ComparacaoPrecoIngrediente[]
  busca: string
  abertos: ReadonlySet<string>
  foco: { id: string; seq: number } | null
  onToggle: (ingredienteId: string) => void
}

export function TabelaComparacao({ itens, busca, abertos, foco, onToggle }: Props) {
  return (
    <div className="ada-surface-card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="table-head-row">
              <th className="table-th" scope="col">Ingrediente</th>
              <th className="table-th table-th-right" scope="col">Preço anterior</th>
              <th className="table-th table-th-right" scope="col">Último preço</th>
              <th className="table-th table-th-right" scope="col">Variação</th>
              <th className="table-th" scope="col">Tendência</th>
              <th className="table-th" scope="col">Último fornecedor</th>
              <th className="table-th table-th-right" scope="col">Compras</th>
            </tr>
          </thead>
          <tbody>
            {itens.map(item => {
              const emFoco = foco?.id === item.ingredienteId
              return (
                <LinhaIngrediente
                  // Remonta a linha focada a cada navegação para reiniciar a animação de destaque.
                  key={emFoco ? `${item.ingredienteId}-foco-${foco.seq}` : item.ingredienteId}
                  item={item}
                  busca={busca}
                  aberto={abertos.has(item.ingredienteId)}
                  emFoco={emFoco}
                  onToggle={() => onToggle(item.ingredienteId)}
                />
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="px-4 py-2 text-xs" style={{ color: 'var(--ada-placeholder)' }}>
        {itens.length === 0
          ? `Nenhum ingrediente corresponde a “${busca.trim()}”.`
          : 'Clique em um ingrediente para ver o histórico completo e a comparação por fornecedor.'}
      </p>
    </div>
  )
}
