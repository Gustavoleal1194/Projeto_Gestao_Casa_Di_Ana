import { useCallback, useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { KpiCard } from '@/components/ui/KpiCard'
import { fechamentoService, type FechamentoMensal } from '../services/fechamentoService'
import {
  competenciaInicial,
  mesParaCompetencia,
  formatarBRL,
  formatarPercentual,
  CATEGORIA_DESPESA_LABELS,
} from '../../shared/competencia'

export function FechamentoMensalPage() {
  const [mes, setMes] = useState(competenciaInicial())
  const [dados, setDados] = useState<FechamentoMensal | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [faturamentoManual, setFaturamentoManual] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erroSalvar, setErroSalvar] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const data = await fechamentoService.obter(mesParaCompetencia(mes))
      setDados(data)
      setFaturamentoManual(data.faturamentoManual != null ? String(data.faturamentoManual) : '')
    } catch {
      setErro('Erro ao carregar o fechamento mensal.')
    } finally {
      setLoading(false)
    }
  }, [mes])

  useEffect(() => { carregar() }, [carregar])

  const salvarFaturamento = async () => {
    setErroSalvar(null)
    setSalvando(true)
    try {
      const txt = faturamentoManual.trim().replace(',', '.')
      const valor = txt === '' ? null : Number(txt)
      if (valor !== null && (!Number.isFinite(valor) || valor <= 0)) return
      await fechamentoService.definirFaturamentoManual(mesParaCompetencia(mes), valor)
      await carregar()
    } catch {
      setErroSalvar('Erro ao salvar o faturamento.')
    } finally {
      setSalvando(false)
    }
  }

  const semFaturamento = !!dados && dados.faturamentoUsado <= 0
  const usandoManual = !!dados && dados.faturamentoManual != null

  return (
    <div className="ada-page space-y-6">
      <PageHeader titulo="Fechamento Mensal"
        subtitulo="Consolidação de faturamento, custo direto e despesas fixas da competência" />

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-body)' }}>Competência</label>
        <input type="month" value={mes} onChange={e => setMes(e.target.value)}
          className="rounded-lg px-3 py-2.5 text-sm border outline-none"
          style={{ background: 'var(--ada-bg)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)', colorScheme: 'dark' }} />
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>Carregando...</p>
      ) : erro ? (
        <p className="text-sm" style={{ color: 'var(--ada-error-text)' }}>{erro}</p>
      ) : dados && (
        <>
          {semFaturamento && (
            <p className="text-sm rounded-lg px-3 py-2"
              style={{ background: 'var(--ada-error-bg)', color: 'var(--ada-error-text)' }}>
              Informe o faturamento para calcular os percentuais.
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <KpiCard label="Faturamento usado" valor={formatarBRL(dados.faturamentoUsado)} variante="green" />
            <KpiCard label="Custo direto total" valor={formatarBRL(dados.custoDiretoTotal)} variante="amber" />
            <KpiCard label="Total despesas fixas" valor={formatarBRL(dados.totalDespesasFixas)} variante="red" />
            <KpiCard label="Despesa fixa %" valor={formatarPercentual(dados.despesaFixaPercentual)} variante="yellow" />
            <KpiCard label="Margem bruta" valor={formatarBRL(dados.margemBruta)} variante="blue" />
            <KpiCard label="Margem operacional" valor={formatarBRL(dados.margemOperacional)} variante="green" />
            <KpiCard label="Prime cost" valor={formatarBRL(dados.primeCost)} variante="amber" />
            <KpiCard label="Folha de pagamento" valor={formatarBRL(dados.folhaPagamento)} variante="red" />
          </div>

          <div className="rounded-xl border p-6 space-y-3"
            style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--ada-muted)' }}>
              Faturamento
            </p>
            <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>
              Calculado das vendas: <strong style={{ color: 'var(--ada-body)' }}>{formatarBRL(dados.faturamentoCalculado)}</strong>
              {' · '}
              <span style={{ color: usandoManual ? 'var(--sb-accent)' : 'var(--ada-muted)' }}>
                {usandoManual ? 'usando valor manual' : 'usando automático'}
              </span>
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ada-body)' }}>
                  Faturamento manual (deixe vazio p/ usar automático)
                </label>
                <input type="text" inputMode="decimal" value={faturamentoManual}
                  onChange={e => setFaturamentoManual(e.target.value)} placeholder="0,00"
                  className="rounded-lg px-3 py-2.5 text-sm border outline-none"
                  style={{ background: 'var(--ada-bg)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)' }} />
              </div>
              <button type="button" onClick={salvarFaturamento} disabled={salvando}
                className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: 'var(--sb-accent)' }}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
            {erroSalvar && (
              <p className="text-sm rounded-lg px-3 py-2 mt-2"
                style={{ background: 'var(--ada-error-bg)', color: 'var(--ada-error-text)' }}>
                {erroSalvar}
              </p>
            )}
          </div>

          {dados.despesasPorCategoria.length > 0 && (
            <div className="rounded-xl border p-6"
              style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--ada-muted)' }}>
                Despesas por categoria
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {dados.despesasPorCategoria.map(c => (
                      <tr key={c.categoria} style={{ borderTop: '1px solid var(--ada-border)' }}>
                        <td className="py-2.5 pr-4" style={{ color: 'var(--ada-body)' }}>
                          {CATEGORIA_DESPESA_LABELS[c.categoria]}
                        </td>
                        <td className="py-2.5 text-right tabular-nums" style={{ color: 'var(--ada-body)' }}>
                          {formatarBRL(c.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
