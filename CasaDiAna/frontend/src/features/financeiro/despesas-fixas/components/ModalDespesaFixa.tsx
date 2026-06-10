import { useState } from 'react'
import type { DespesaFixa, DespesaFixaInput } from '../services/despesasFixasService'
import {
  CATEGORIA_DESPESA_OPCOES,
  mesParaCompetencia,
  type CategoriaDespesaFixa,
} from '../../shared/competencia'

interface Props {
  mes: string
  despesa: DespesaFixa | null
  onFechar: () => void
  onSalvar: (input: DespesaFixaInput) => Promise<void>
}

export function ModalDespesaFixa({ mes, despesa, onFechar, onSalvar }: Props) {
  const [categoria, setCategoria] = useState<CategoriaDespesaFixa>(despesa?.categoria ?? 1)
  const [descricao, setDescricao] = useState(despesa?.descricao ?? '')
  const [valor, setValor] = useState(despesa ? String(despesa.valor) : '')
  const [observacao, setObservacao] = useState(despesa?.observacao ?? '')
  const [dataLancamento, setDataLancamento] = useState(
    despesa ? despesa.dataLancamento.split('T')[0] : new Date().toISOString().split('T')[0],
  )
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const submeter = async () => {
    const valorNum = Number(valor.replace(',', '.'))
    if (!Number.isFinite(valorNum) || valorNum <= 0) {
      setErro('Informe um valor maior que zero.')
      return
    }
    setSalvando(true)
    setErro(null)
    try {
      await onSalvar({
        competencia: despesa?.competencia ?? mesParaCompetencia(mes),
        categoria,
        descricao: descricao.trim() || null,
        valor: valorNum,
        observacao: observacao.trim() || null,
        dataLancamento,
      })
      onFechar()
    } catch {
      setErro('Erro ao salvar a despesa.')
    } finally {
      setSalvando(false)
    }
  }

  const inputStyle = {
    background: 'var(--ada-bg)',
    borderColor: 'var(--ada-border)',
    color: 'var(--ada-body)',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onFechar}>
      <div className="w-full max-w-md rounded-xl border p-6 space-y-4"
        style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}
        onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--ada-heading)' }}>
          {despesa ? 'Editar despesa' : 'Nova despesa'}
        </h2>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-body)' }}>Categoria</label>
          <select value={categoria} onChange={e => setCategoria(Number(e.target.value) as CategoriaDespesaFixa)}
            className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none" style={inputStyle}>
            {CATEGORIA_DESPESA_OPCOES.map(op => (
              <option key={op.valor} value={op.valor}>{op.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-body)' }}>Descrição</label>
          <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)}
            className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none" style={inputStyle} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-body)' }}>Valor (R$)</label>
            <input type="text" inputMode="decimal" value={valor} onChange={e => setValor(e.target.value)}
              placeholder="0,00" className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-body)' }}>Data lançamento</label>
            <input type="date" value={dataLancamento} onChange={e => setDataLancamento(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none" style={{ ...inputStyle, colorScheme: 'dark' }} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-body)' }}>Observação</label>
          <input type="text" value={observacao} onChange={e => setObservacao(e.target.value)}
            className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none" style={inputStyle} />
        </div>

        {erro && (
          <p className="text-sm rounded-lg px-3 py-2"
            style={{ background: 'var(--ada-error-bg)', color: 'var(--ada-error-text)' }}>{erro}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onFechar}
            className="rounded-lg px-4 py-2 text-sm font-medium border" style={inputStyle}>Cancelar</button>
          <button type="button" onClick={submeter} disabled={salvando}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: 'var(--sb-accent)' }}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
