import { useEffect, useState, useCallback } from 'react'
import { BellIcon, BellSlashIcon, CheckIcon } from '@heroicons/react/24/outline'
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  FireIcon,
} from '@heroicons/react/24/solid'
import { notificacoesService, type NotificacaoEstoqueDto } from '@/lib/notificacoesService'
import { useNotificacoesCount } from '@/hooks/useNotificacoesCount'

const CONFIG_TIPO = {
  Zerado: {
    label: 'Zerado',
    Icon: FireIcon,
    rowBg: 'var(--ada-error-bg)',
    badgeBg: 'var(--ada-error-badge)',
    badgeBorder: 'var(--ada-error-border)',
    badgeColor: 'var(--ada-error-text)',
    iconColor: 'var(--ada-error-text)',
  },
  Critico: {
    label: 'Crítico',
    Icon: ExclamationCircleIcon,
    rowBg: 'rgba(220,38,38,0.06)',
    badgeBg: 'var(--ada-error-badge)',
    badgeBorder: 'var(--ada-error-border)',
    badgeColor: 'var(--ada-error-text)',
    iconColor: 'var(--ada-error-text)',
  },
  Atencao: {
    label: 'Atenção',
    Icon: ExclamationTriangleIcon,
    rowBg: 'var(--ada-warning-bg)',
    badgeBg: 'var(--ada-warning-badge)',
    badgeBorder: 'var(--ada-warning-border)',
    badgeColor: 'var(--ada-warning-text)',
    iconColor: 'var(--ada-warning-text)',
  },
} as const

export function NotificacoesPage() {
  const [notificacoes, setNotificacoes] = useState<NotificacaoEstoqueDto[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [apenasNaoLidas, setApenasNaoLidas] = useState(false)
  const { atualizar: atualizarContador } = useNotificacoesCount()

  const carregar = useCallback(async (filtro: boolean) => {
    setLoading(true)
    setErro(null)
    try {
      const data = await notificacoesService.listar(filtro)
      setNotificacoes(data)
    } catch {
      setErro('Erro ao carregar notificações.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar(false) }, [carregar])

  const handleToggle = () => {
    const novo = !apenasNaoLidas
    setApenasNaoLidas(novo)
    carregar(novo)
  }

  const handleMarcarLida = async (id: string) => {
    await notificacoesService.marcarLida(id)
    setNotificacoes(prev =>
      prev.map(n => n.id === id ? { ...n, lida: true } : n)
    )
    atualizarContador()
  }

  const handleMarcarTodasLidas = async () => {
    await notificacoesService.marcarTodasLidas()
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })))
    atualizarContador()
  }

  const naoLidasCount = notificacoes.filter(n => !n.lida).length

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* ── Cabeçalho ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
          >
            Notificações de Estoque
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ada-muted)' }}>
            {loading ? 'Carregando…' : `${naoLidasCount} não lida${naoLidasCount !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={apenasNaoLidas}
              onChange={handleToggle}
              className="h-4 w-4 accent-amber-700"
            />
            <span className="text-sm" style={{ color: 'var(--ada-body)' }}>
              Apenas não lidas
            </span>
          </label>

          {naoLidasCount > 0 && (
            <button
              onClick={handleMarcarTodasLidas}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                border: '1px solid var(--ada-border)',
                color: 'var(--ada-body)',
                background: 'transparent',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--ada-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <CheckIcon className="h-4 w-4" />
              Marcar todas como lidas
            </button>
          )}
        </div>
      </div>

      {/* ── Loading ────────────────────────────────────────────────────── */}
      {loading && (
        <div
          className="rounded-xl py-16 text-center"
          style={{ background: 'var(--ada-surface)', border: '1px solid var(--ada-border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div
            className="inline-block h-8 w-8 animate-spin rounded-full mb-3"
            style={{ border: '3px solid var(--ada-border)', borderTopColor: '#C4870A' }}
          />
          <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>Carregando…</p>
        </div>
      )}

      {/* ── Erro ───────────────────────────────────────────────────────── */}
      {!loading && erro && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            background: 'var(--ada-error-bg)',
            border: '1px solid var(--ada-error-border)',
            color: 'var(--ada-error-text)',
          }}
        >
          {erro}
        </div>
      )}

      {/* ── Lista ──────────────────────────────────────────────────────── */}
      {!loading && !erro && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: 'var(--ada-surface)', border: '1px solid var(--ada-border)', boxShadow: 'var(--shadow-sm)' }}
        >
          {notificacoes.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center gap-3">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--ada-bg)', border: '1px solid var(--ada-border)' }}
              >
                <BellSlashIcon className="h-6 w-6" style={{ color: 'var(--ada-placeholder)' }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--ada-body)', fontFamily: 'Sora, system-ui, sans-serif' }}>
                Nenhuma notificação
              </p>
              <p className="text-xs" style={{ color: 'var(--ada-muted)' }}>
                {apenasNaoLidas ? 'Todas as notificações foram lidas.' : 'Nenhum alerta de estoque no momento.'}
              </p>
            </div>
          ) : (
            <ul>
              {notificacoes.map((n, idx) => {
                const cfg = CONFIG_TIPO[n.tipo]
                const { Icon } = cfg
                return (
                  <li
                    key={n.id}
                    className="flex items-start gap-3 px-5 py-4 transition-colors"
                    style={{
                      background: !n.lida ? cfg.rowBg : undefined,
                      borderBottom: idx < notificacoes.length - 1 ? '1px solid var(--ada-border-sub)' : 'none',
                      opacity: n.lida ? 0.6 : 1,
                    }}
                  >
                    {/* Ícone de tipo */}
                    <div
                      className="mt-0.5 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: cfg.badgeBg, border: `1px solid ${cfg.badgeBorder}` }}
                    >
                      <Icon className="h-4 w-4" style={{ color: cfg.iconColor }} aria-hidden="true" />
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-sm font-semibold leading-snug"
                          style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
                        >
                          {n.titulo}
                        </span>
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                          style={{
                            background: cfg.badgeBg,
                            border: `1px solid ${cfg.badgeBorder}`,
                            color: cfg.badgeColor,
                          }}
                        >
                          {cfg.label}
                        </span>
                        {!n.lida && (
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: 'var(--sb-accent)' }}
                            aria-label="Não lida"
                          />
                        )}
                      </div>
                      <p className="text-[13px] mt-0.5 leading-relaxed" style={{ color: 'var(--ada-body)' }}>
                        {n.mensagem}
                      </p>
                      <p className="text-[11px] mt-1" style={{ color: 'var(--ada-muted)' }}>
                        {new Date(n.dataCriacao).toLocaleString('pt-BR')}
                        {n.ingredienteNome && (
                          <> · <span style={{ color: 'var(--ada-muted-dim)' }}>{n.ingredienteNome}</span></>
                        )}
                      </p>
                    </div>

                    {/* Botão marcar lida */}
                    {!n.lida && (
                      <button
                        onClick={() => handleMarcarLida(n.id)}
                        aria-label="Marcar como lida"
                        title="Marcar como lida"
                        className="shrink-0 p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--ada-muted)' }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.color = 'var(--ada-heading)'
                          ;(e.currentTarget as HTMLElement).style.background = 'var(--ada-hover)'
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.color = 'var(--ada-muted)'
                          ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                        }}
                      >
                        <BellIcon className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
