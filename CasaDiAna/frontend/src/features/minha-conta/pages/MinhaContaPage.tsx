// frontend/src/features/minha-conta/pages/MinhaContaPage.tsx
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import {
  UserCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
  ComputerDesktopIcon,
  HashtagIcon,
} from '@heroicons/react/24/outline'
import { authService } from '@/features/auth/services/authService'
import type { IniciarSetup2FaResultDto } from '@/features/auth/services/authService'
import { minhaContaService, type MeuPerfilDto } from '../services/minhaContaService'
import { PageHeader } from '@/components/ui/PageHeader'
import { InfoRow } from '@/components/ui/InfoRow'
import { RelativeTime } from '@/components/ui/RelativeTime'
import { StatusBadge2Fa } from '@/components/ui/StatusBadge2Fa'
import { Spinner } from '@/components/form/Spinner'

type Passo = 'idle' | 'qrcode' | 'recovery' | 'confirmar'

function parseUserAgent(ua: string | null): string {
  if (!ua) return 'Dispositivo desconhecido'
  const browser = /Chrome\//.test(ua) ? 'Chrome'
    : /Firefox\//.test(ua) ? 'Firefox'
    : /Safari\//.test(ua) && !/Chrome/.test(ua) ? 'Safari'
    : /Edg\//.test(ua) ? 'Edge'
    : 'Navegador'
  const os = /Windows/.test(ua) ? 'Windows'
    : /Mac OS/.test(ua) ? 'macOS'
    : /Linux/.test(ua) ? 'Linux'
    : /Android/.test(ua) ? 'Android'
    : /iPhone|iPad/.test(ua) ? 'iOS'
    : 'SO desconhecido'
  return `${browser} · ${os}`
}

export function MinhaContaPage() {
  const [perfil, setPerfil] = useState<MeuPerfilDto | null>(null)
  const [carregandoPerfil, setCarregandoPerfil] = useState(true)
  const [erroPerfil, setErroPerfil] = useState<string | null>(null)

  const [passo, setPasso] = useState<Passo>('idle')
  const [setupData, setSetupData] = useState<IniciarSetup2FaResultDto | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [codigosConfirmados, setCodigosConfirmados] = useState(false)
  const [codigoConfirmacao, setCodigoConfirmacao] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [sucesso, setSucesso] = useState<string | null>(null)

  const carregarPerfil = async () => {
    setCarregandoPerfil(true)
    setErroPerfil(null)
    try {
      setPerfil(await minhaContaService.obterMeuPerfil())
    } catch (e: unknown) {
      setErroPerfil((e as Error)?.message ?? 'Erro ao carregar perfil.')
    } finally {
      setCarregandoPerfil(false)
    }
  }

  useEffect(() => { carregarPerfil() }, [])

  const iniciarSetup = async () => {
    setCarregando(true)
    setErro(null)
    setSucesso(null)
    try {
      const dados = await authService.iniciarSetup2Fa()
      const dataUrl = await QRCode.toDataURL(dados.qrCodeUrl, { width: 200, margin: 1 })
      setSetupData(dados)
      setQrDataUrl(dataUrl)
      setPasso('qrcode')
    } catch (e: unknown) {
      setErro((e as Error)?.message ?? 'Erro ao iniciar setup.')
    } finally {
      setCarregando(false)
    }
  }

  const confirmarSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!codigoConfirmacao.trim() || !setupData) return
    setCarregando(true)
    setErro(null)
    try {
      await authService.confirmarSetup2Fa(
        setupData.secretManual,
        codigoConfirmacao.trim(),
        setupData.codigosRecuperacao
      )
      setPasso('idle')
      setSetupData(null)
      setQrDataUrl(null)
      setCodigosConfirmados(false)
      setCodigoConfirmacao('')
      setSucesso('Autenticação em dois fatores ativada com sucesso.')
      await carregarPerfil()
    } catch (e: unknown) {
      setErro((e as Error)?.message ?? 'Código inválido.')
    } finally {
      setCarregando(false)
    }
  }

  const cancelarSetup = () => {
    setPasso('idle')
    setSetupData(null)
    setQrDataUrl(null)
    setCodigosConfirmados(false)
    setCodigoConfirmacao('')
    setErro(null)
  }

  return (
    <div className="ada-page">
      <PageHeader
        titulo="Minha Conta"
        breadcrumb={['Configurações', 'Minha Conta']}
        subtitulo="Gerencie seus dados e segurança"
      />

      {/* ── Dados da Conta ─────────────────────────────────────────── */}
      <div className="ada-surface-card p-6 mb-6 max-w-xl">
        <h2 className="text-base font-semibold mb-4"
          style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}>
          Dados da Conta
        </h2>

        {carregandoPerfil ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton h-10 rounded-lg" />
            ))}
          </div>
        ) : erroPerfil ? (
          <p className="text-sm" style={{ color: '#DC2626' }}>{erroPerfil}</p>
        ) : perfil ? (
          <>
            <InfoRow label="Nome" icon={<UserCircleIcon className="h-4 w-4" />}>
              {perfil.nome}
            </InfoRow>
            <InfoRow label="Papel" icon={<ShieldCheckIcon className="h-4 w-4" />}>
              <span className="inline-block text-[12px] font-semibold rounded-md px-2 py-0.5"
                style={{ background: 'var(--ada-bg)', color: 'var(--ada-muted)', border: '1px solid var(--ada-border)' }}>
                {perfil.papel}
              </span>
            </InfoRow>
            <InfoRow label="Último acesso" icon={<ClockIcon className="h-4 w-4" />}>
              <RelativeTime date={perfil.ultimoLogin} />
            </InfoRow>
            <InfoRow label="Dispositivo" icon={<ComputerDesktopIcon className="h-4 w-4" />}>
              {parseUserAgent(perfil.userAgentUltimoLogin)}
            </InfoRow>
            <InfoRow label="Total de acessos" icon={<HashtagIcon className="h-4 w-4" />}>
              {perfil.totalLogins}
            </InfoRow>
          </>
        ) : null}
      </div>

      {/* ── Autenticação em Dois Fatores ───────────────────────────── */}
      <div className="ada-surface-card p-6 max-w-xl">
        <h2 className="text-base font-semibold mb-1"
          style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}>
          Autenticação em Dois Fatores
        </h2>

        {sucesso && (
          <div className="mt-3 rounded-lg px-4 py-3 text-sm mb-4"
            style={{ background: 'var(--ada-success-bg, #f0fdf4)', border: '1px solid #86efac', color: '#15803d' }}>
            {sucesso}
          </div>
        )}

        {erro && (
          <div className="mt-3 rounded-lg px-4 py-3 text-sm mb-4"
            style={{ background: 'var(--ada-error-bg)', border: '1px solid var(--ada-error-border)', color: '#DC2626' }}>
            {erro}
          </div>
        )}

        {passo === 'idle' && (
          <>
            {perfil?.twoFactorHabilitado ? (
              <div className="mt-3 space-y-4">
                <div className="flex items-center gap-3">
                  <StatusBadge2Fa status="ativo" />
                  <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>
                    Sua conta está protegida com autenticação em dois fatores.
                  </p>
                </div>
                <button onClick={iniciarSetup} disabled={carregando} className="btn-secondary">
                  {carregando ? <Spinner /> : null}
                  {carregando ? 'Aguarde…' : 'Reconfigurar autenticador'}
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm mb-4 mt-2" style={{ color: 'var(--ada-muted)' }}>
                  Adicione uma camada extra de segurança usando Google Authenticator, Microsoft Authenticator ou qualquer app TOTP.
                </p>
                <button onClick={iniciarSetup} disabled={carregando || carregandoPerfil} className="btn-primary">
                  {carregando ? <Spinner /> : null}
                  {carregando ? 'Aguarde…' : 'Ativar autenticação em dois fatores'}
                </button>
              </>
            )}
          </>
        )}

        {passo === 'qrcode' && setupData && (
          <div className="space-y-4 mt-4">
            <p className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
              Passo 1 — Escaneie o QR code
            </p>
            <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>
              Abra o app autenticador e escaneie o código abaixo. Caso não consiga escanear, insira o código manualmente.
            </p>
            {qrDataUrl && (
              <div className="flex justify-center py-2">
                <img src={qrDataUrl} alt="QR Code para configurar 2FA" className="rounded-lg"
                  style={{ width: 200, height: 200 }} />
              </div>
            )}
            <div className="rounded-lg px-3 py-2 text-xs font-mono break-all"
              style={{ background: 'var(--ada-surface-sub, var(--ada-surface))', border: '1px solid var(--ada-border)', color: 'var(--ada-muted)' }}>
              {setupData.secretManual}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setPasso('recovery')} className="btn-primary flex-1">
                Próximo →
              </button>
              <button onClick={cancelarSetup} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        )}

        {passo === 'recovery' && setupData && (
          <div className="space-y-4 mt-4">
            <p className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
              Passo 2 — Salve seus códigos de recuperação
            </p>
            <div className="rounded-lg p-3 border"
              style={{ background: 'var(--ada-warning-bg)', borderColor: 'var(--ada-warning-border)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--ada-warning-text)' }}>
                ⚠ Guarde estes códigos em lugar seguro — não serão exibidos novamente.
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {setupData.codigosRecuperacao.map((c, i) => (
                  <span key={i} className="text-xs font-mono px-2 py-1 rounded text-center"
                    style={{ background: 'rgba(255,255,255,.06)', color: 'var(--ada-heading)', border: '1px solid rgba(255,255,255,.1)' }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={codigosConfirmados}
                onChange={e => setCodigosConfirmados(e.target.checked)}
                className="w-4 h-4 accent-amber-600" />
              <span className="text-sm" style={{ color: 'var(--ada-body)' }}>
                Guardei meus códigos de recuperação
              </span>
            </label>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setPasso('confirmar')} disabled={!codigosConfirmados}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
                Próximo →
              </button>
              <button onClick={cancelarSetup} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        )}

        {passo === 'confirmar' && (
          <form onSubmit={confirmarSetup} className="space-y-4 mt-4">
            <p className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
              Passo 3 — Confirme com o app
            </p>
            <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>
              Digite o código de 6 dígitos que aparece no seu app autenticador.
            </p>
            <input
              type="text"
              value={codigoConfirmacao}
              onChange={e => setCodigoConfirmacao(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              autoFocus
              className="w-full rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] font-bold
                         text-[var(--ada-heading)] bg-white border border-[var(--ada-border)]
                         outline-none transition-all duration-200
                         focus-visible:border-[#C4870A] focus-visible:ring-2 focus-visible:ring-[#C4870A]/20"
              style={{ boxShadow: 'var(--shadow-xs)' }}
            />
            <div className="flex gap-3 pt-2">
              <button type="submit"
                disabled={carregando || codigoConfirmacao.length !== 6}
                className="btn-primary flex-1 disabled:opacity-50">
                {carregando ? <Spinner /> : null}
                {carregando ? 'Verificando…' : 'Ativar 2FA'}
              </button>
              <button type="button" onClick={cancelarSetup} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
