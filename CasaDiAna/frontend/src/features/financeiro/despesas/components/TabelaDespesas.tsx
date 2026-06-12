import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { Despesa } from '../services/despesasService'
import { CATEGORIA_DESPESA_LABELS, formatarBRL } from '../../shared/competencia'

interface Props { itens: Despesa[]; onEditar: (d: Despesa) => void; onRemover: (d: Despesa) => void }

export function TabelaDespesas({ itens, onEditar, onRemover }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left" style={{ color: 'var(--ada-muted)' }}>
            <th className="py-2 pr-4 font-medium">Categoria</th>
            <th className="py-2 pr-4 font-medium">Descrição</th>
            <th className="py-2 pr-4 font-medium">Data</th>
            <th className="py-2 pr-4 font-medium text-right">Valor</th>
            <th className="py-2 pl-4 font-medium text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {itens.map(d => (
            <tr key={d.id} style={{ borderTop: '1px solid var(--ada-border)' }}>
              <td className="py-2.5 pr-4" style={{ color: 'var(--ada-body)' }}>{CATEGORIA_DESPESA_LABELS[d.categoria]}</td>
              <td className="py-2.5 pr-4" style={{ color: 'var(--ada-muted)' }}>{d.descricao ?? '—'}</td>
              <td className="py-2.5 pr-4" style={{ color: 'var(--ada-muted)' }}>{new Date(d.dataLancamento).toLocaleDateString('pt-BR')}</td>
              <td className="py-2.5 pr-4 text-right tabular-nums" style={{ color: 'var(--ada-body)' }}>{formatarBRL(d.valor)}</td>
              <td className="py-2.5 pl-4">
                <div className="flex items-center justify-end gap-2">
                  <button type="button" onClick={() => onEditar(d)} title="Editar" className="p-1.5 rounded-lg hover:opacity-80" style={{ color: 'var(--ada-muted)' }}><PencilSquareIcon className="h-4 w-4" /></button>
                  <button type="button" onClick={() => onRemover(d)} title="Remover" className="p-1.5 rounded-lg hover:opacity-80" style={{ color: '#F87171' }}><TrashIcon className="h-4 w-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
