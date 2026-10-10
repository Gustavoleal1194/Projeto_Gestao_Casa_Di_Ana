import { useEffect, useState } from 'react'
import { fechamentoService } from '../services/fechamentoService'
import { CampoPercentual } from '../../shared/CampoPercentual'
import { fracaoValida, percentualParaTexto, textoParaFracao } from '../../shared/percentual'

interface Props {
  /** Chamado após salvar, para o fechamento recalcular com os novos percentuais. */
  onSalvo: () => void
}

export function ConfigRepasseEditor({ onSalvo }: Props) {
  const [aberto, setAberto] = useState(false)
  const [retencao, setRetencao] = useState('')
  const [cartao, setCartao] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!aberto) return
    fechamentoService.obterConfigRepasse()
      .then(c => {
        setRetencao(percentualParaTexto(c.percentualRetencaoCasa))
        setCartao(percentualParaTexto(c.percentualTaxaCartao))
      })
      .catch(() => setErro('Erro ao carregar a configuração de repasses.'))
  }, [aberto])

  const salvar = async () => {
    const body = { percentualRetencaoCasa: textoParaFracao(retencao), percentualTaxaCartao: textoParaFracao(cartao) }
    if (!fracaoValida(body.percentualRetencaoCasa, true) || !fracaoValida(body.percentualTaxaCartao, true)
      || body.percentualRetencaoCasa + body.percentualTaxaCartao >= 1) {
      setErro('Cada percentual deve estar entre 0 e 100%, e a soma deve ser menor que 100%.')
      return
    }
    setSalvando(true)
    setErro(null)
    try {
      await fechamentoService.atualizarConfigRepasse(body)
      setAberto(false)
      onSalvo()
    } catch {
      setErro('Erro ao salvar a configuração de repasses.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="rounded-xl border p-5 space-y-3" style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--ada-muted)' }}>
            Configuração de repasses
          </p>
          <p className="text-[11px] mt-1" style={{ color: 'var(--ada-muted)' }}>
            Vale para as próximas importações; meses já importados mantêm os percentuais da época.
          </p>
        </div>
        <button type="button" onClick={() => setAberto(a => !a)}
          className="rounded-lg px-3 py-2 text-xs font-medium border"
          style={{ borderColor: 'var(--ada-border)', color: 'var(--ada-body)', background: 'var(--ada-bg)' }}>
          {aberto ? 'Fechar' : 'Configurar'}
        </button>
      </div>
      {aberto && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CampoPercentual label="Retenção da casa sobre a taxa de serviço" value={retencao} onChange={setRetencao} />
            <CampoPercentual label="Taxa do cartão sobre a taxa de serviço" value={cartao} onChange={setCartao} />
          </div>
          {erro && <p className="text-sm" style={{ color: 'var(--ada-error-text)' }}>{erro}</p>}
          <button type="button" onClick={salvar} disabled={salvando}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: 'var(--sb-accent)' }}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </>
      )}
    </div>
  )
}
