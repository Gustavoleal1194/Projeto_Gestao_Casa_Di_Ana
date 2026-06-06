import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../../services/authService'
import { useAuthStore } from '@/store/authStore'
import { IconField, MailIcon } from './IconField'
import { PasswordField } from './PasswordField'
import { RememberRow } from './RememberRow'
import { SsoButtons } from './SsoButtons'
import { TwoFactorPanel } from './TwoFactorPanel'
import { Spinner } from '@/components/form/Spinner'

type Etapa = 'credenciais' | 'otp'

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  )
}

export function LoginForm() {
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [manter, setManter] = useState(true)

  const [etapa, setEtapa] = useState<Etapa>('credenciais')
  const [tokenTemporario, setTokenTemporario] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAviso(null)
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
        setEtapa('otp')
      } else {
        login(dados.token!, { nome: dados.nome!, papel: dados.papel! }, manter)
        navigate('/', { replace: true })
      }
    } catch (e: unknown) {
      setErro((e as Error)?.message ?? 'E-mail ou senha inválidos. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  const voltarParaCredenciais = () => {
    setEtapa('credenciais')
    setTokenTemporario(null)
    setErro(null)
  }

  if (etapa === 'otp' && tokenTemporario) {
    return (
      <TwoFactorPanel
        tokenTemporario={tokenTemporario}
        verificarOtp={authService.verificarOtp}
        onSuccess={(token, nome, papel) => {
          login(token, { nome, papel }, manter)
          navigate('/', { replace: true })
        }}
        onVoltar={voltarParaCredenciais}
      />
    )
  }

  return (
    <div className="lr-form-card">
      <div className="lr-fc-eyebrow"><span className="d" />Acesso interno · ERP</div>
      <h1 className="lr-fc-h">Bem-vindo de volta</h1>
      <p className="lr-fc-sub">Entre com suas credenciais para administrar a produção, estoque e vendas.</p>

      <form onSubmit={handleLogin} noValidate>
        <IconField
          id="email"
          label="E-mail corporativo"
          type="email"
          value={email}
          onChange={setEmail}
          icon={<MailIcon />}
          placeholder="ana.ribeiro@casadiana.com.br"
          autoComplete="email"
          disabled={carregando}
        />

        <PasswordField
          id="senha"
          label="Senha"
          value={senha}
          onChange={setSenha}
          autoComplete="current-password"
          disabled={carregando}
        />

        <RememberRow
          manter={manter}
          onManterChange={setManter}
          disabled={carregando}
          onEsqueciSenha={() => setAviso('Solicite a redefinição de senha ao administrador.')}
        />

        {aviso && <p className="lr-hint">{aviso}</p>}
        {erro && <div className="lr-error" role="alert" aria-live="polite">{erro}</div>}

        <button className="lr-btn-primary" type="submit" disabled={carregando}>
          {carregando ? <><Spinner /> Verificando…</> : <>Entrar no sistema <ArrowIcon /></>}
        </button>

        <SsoButtons />

        <div className="lr-foot-meta">
          Não tem acesso? <span>Solicite ao administrador</span>
        </div>
      </form>
    </div>
  )
}
