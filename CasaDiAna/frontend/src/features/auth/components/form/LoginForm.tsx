import { useState } from 'react'
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

export function LoginForm() {
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !senha) {
      setErro('Preencha e-mail e senha.')
      return
    }
    setCarregando(true)
    setErro(null)
    try {
      const dados = await authService.login({ email, senha })
      login(dados.token, { nome: dados.nome, papel: dados.papel })
      navigate('/', { replace: true })
    } catch (e: unknown) {
      setErro((e as Error)?.message ?? 'E-mail ou senha inválidos. Tente novamente.')
    } finally {
      setCarregando(false)
    }
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

      {/* Cabeçalho */}
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

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
          {carregando ? 'Entrando…' : 'Entrar no Sistema'}
        </AnimatedButton>
      </form>
    </div>
  )
}
