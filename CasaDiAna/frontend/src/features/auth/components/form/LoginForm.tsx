import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../../services/authService'
import { useAuthStore } from '@/store/authStore'
import { AnimatedInput } from './AnimatedInput'
import { AnimatedButton } from './AnimatedButton'

function CoffeeIcon() {
  return (
    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.5 4c0 0 .4-1.5 1.5-1.5s1.5 1.5 1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M4 8.5h12v8.5a2.5 2.5 0 01-2.5 2.5h-7A2.5 2.5 0 014 17V8.5z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M16 11h2a1.5 1.5 0 010 3h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

type Etapa = 'credenciais' | 'otp'

export function LoginForm() {
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

  const [etapa, setEtapa] = useState<Etapa>('credenciais')
  const [tokenTemporario, setTokenTemporario] = useState<string | null>(null)
  const [telefoneMascarado, setTelefoneMascarado] = useState<string | null>(null)
  const [otp, setOtp] = useState('')
  const [reenvioCountdown, setReenvioCountdown] = useState(0)

  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  const otpInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (reenvioCountdown <= 0) return
    const t = setTimeout(() => setReenvioCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [reenvioCountdown])

  useEffect(() => {
    if (etapa === 'otp') {
      setTimeout(() => otpInputRef.current?.focus(), 100)
    }
  }, [etapa])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !senha) {
      setErro('Preencha e-mail e senha.')
      return
    }
    setCarregando(true)
    setErro(null)
    try {
      const dados = await authService.login({ email, senha })
      if (dados.requer2Fa) {
        setTokenTemporario(dados.tokenTemporario)
        setTelefoneMascarado(dados.telefoneMascarado)
        setReenvioCountdown(60)
        setEtapa('otp')
      } else {
        login(dados.token!, { nome: dados.nome!, papel: dados.papel! })
        navigate('/', { replace: true })
      }
    } catch (e: unknown) {
      setErro((e as Error)?.message ?? 'E-mail ou senha inválidos. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  const handleVerificarOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) {
      setErro('Digite os 6 dígitos do código.')
      return
    }
    setCarregando(true)
    setErro(null)
    try {
      const dados = await authService.verificarOtp(otp, tokenTemporario!)
      login(dados.token, { nome: dados.nome, papel: dados.papel })
      navigate('/', { replace: true })
    } catch (e: unknown) {
      const msg = (e as Error)?.message ?? 'Código inválido.'
      setErro(msg)
      if (msg.toLowerCase().includes('tentativas') || msg.toLowerCase().includes('login novamente')) {
        setEtapa('credenciais')
        setTokenTemporario(null)
        setOtp('')
      }
    } finally {
      setCarregando(false)
    }
  }

  const handleReenviar = async () => {
    if (!tokenTemporario || reenvioCountdown > 0) return
    try {
      await authService.reenviarCodigo(tokenTemporario)
      setReenvioCountdown(60)
      setErro(null)
    } catch (e: unknown) {
      setErro((e as Error)?.message ?? 'Erro ao reenviar código.')
    }
  }

  const voltarParaCredenciais = () => {
    setEtapa('credenciais')
    setTokenTemporario(null)
    setOtp('')
    setErro(null)
  }

  return (
    <div className="w-full max-w-[380px]">
      {/* Logo mobile */}
      <div className="lg:hidden flex items-center gap-3 mb-8">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: '#D4960C' }}
        >
          <CoffeeIcon />
        </div>
        <h1
          className="text-xl font-bold text-[var(--ada-heading)]"
          style={{ fontFamily: 'Sora, system-ui, sans-serif' }}
        >
          Casa di Ana
        </h1>
      </div>

      {etapa === 'credenciais' ? (
        <>
          <div className="mb-8">
            <h2
              className="text-2xl font-bold text-[var(--ada-heading)] tracking-tight"
              style={{ fontFamily: 'Sora, system-ui, sans-serif' }}
            >
              Bem-vindo de volta
            </h2>
            <p className="mt-1.5 text-sm" style={{ color: 'var(--ada-muted)' }}>
              Acesse com suas credenciais para continuar.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            <AnimatedInput
              id="email"
              label="E-mail"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              disabled={carregando}
            />
            <AnimatedInput
              id="senha"
              label="Senha"
              type="password"
              value={senha}
              onChange={setSenha}
              autoComplete="current-password"
              disabled={carregando}
            />

            {erro && (
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{
                  background: 'var(--ada-error-bg)',
                  border: '1px solid var(--ada-error-border)',
                  color: '#DC2626',
                }}
                role="alert"
                aria-live="polite"
              >
                {erro}
              </div>
            )}

            <AnimatedButton type="submit" carregando={carregando}>
              {carregando ? 'Verificando…' : 'Entrar no Sistema'}
            </AnimatedButton>
          </form>
        </>
      ) : (
        <>
          <div className="mb-8">
            <h2
              className="text-2xl font-bold text-[var(--ada-heading)] tracking-tight"
              style={{ fontFamily: 'Sora, system-ui, sans-serif' }}
            >
              Verificação em dois fatores
            </h2>
            <p className="mt-1.5 text-sm" style={{ color: 'var(--ada-muted)' }}>
              Código enviado para{' '}
              <span className="font-semibold" style={{ color: 'var(--ada-heading)' }}>
                {telefoneMascarado}
              </span>
            </p>
          </div>

          <form onSubmit={handleVerificarOtp} className="space-y-5" noValidate>
            <div className="relative">
              <label
                htmlFor="otp"
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--ada-muted)' }}
              >
                Código de verificação
              </label>
              <input
                ref={otpInputRef}
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={otp}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setOtp(v)
                  if (erro) setErro(null)
                }}
                autoComplete="one-time-code"
                disabled={carregando}
                placeholder="000000"
                className="w-full rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] font-bold
                           text-[var(--ada-heading)] bg-white border border-[var(--ada-border)]
                           outline-none transition-all duration-200
                           focus-visible:border-[#C4870A] focus-visible:ring-2 focus-visible:ring-[#C4870A]/20
                           disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ boxShadow: 'var(--shadow-xs)' }}
              />
            </div>

            {erro && (
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{
                  background: 'var(--ada-error-bg)',
                  border: '1px solid var(--ada-error-border)',
                  color: '#DC2626',
                }}
                role="alert"
                aria-live="polite"
              >
                {erro}
              </div>
            )}

            <AnimatedButton type="submit" carregando={carregando}>
              {carregando ? 'Verificando…' : 'Verificar código'}
            </AnimatedButton>

            <div className="text-center">
              {reenvioCountdown > 0 ? (
                <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>
                  Reenviar código em{' '}
                  <span className="font-semibold" style={{ color: 'var(--ada-heading)' }}>
                    {reenvioCountdown}s
                  </span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleReenviar}
                  className="text-sm font-medium underline underline-offset-2 transition-opacity hover:opacity-70"
                  style={{ color: '#C4870A' }}
                >
                  Reenviar código
                </button>
              )}
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={voltarParaCredenciais}
                className="text-sm transition-opacity hover:opacity-70"
                style={{ color: 'var(--ada-muted)' }}
              >
                ← Voltar ao login
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}
