import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { useAuthStore } from '@/store/authStore'

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

function CoffeeIcon() {
  return (
    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.5 4c0 0 .4-1.5 1.5-1.5s1.5 1.5 1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M4 8.5h12v8.5a2.5 2.5 0 01-2.5 2.5h-7A2.5 2.5 0 014 17V8.5z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M16 11h2a1.5 1.5 0 010 3h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function LoginPage() {
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
    <div
      className="min-h-screen flex"
      style={{ background: '#0D1117' }}
    >
      {/* ── Painel esquerdo — marca ─────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[42%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0D1117 0%, #111827 100%)' }}
      >
        {/* Padrão geométrico de fundo */}
        <div className="absolute inset-0 opacity-[0.03]" aria-hidden="true">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Círculo decorativo */}
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #D4960C 0%, transparent 70%)' }}
          aria-hidden="true"
        />

        {/* Logo */}
        <div className="relative">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: '#D4960C' }}
          >
            <CoffeeIcon />
          </div>
        </div>

        {/* Texto central */}
        <div className="relative space-y-6">
          <div>
            <h1
              className="text-4xl font-bold text-white leading-tight tracking-tight"
              style={{ fontFamily: 'Sora, system-ui, sans-serif' }}
            >
              Casa di Ana
            </h1>
            <p
              className="mt-3 text-base leading-relaxed"
              style={{ color: '#6B7280', fontFamily: 'DM Sans, system-ui, sans-serif' }}
            >
              Sistema de Gestão Operacional para controle de estoque, produção e vendas.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            {[
              'Controle completo de estoque e ingredientes',
              'Produção diária com rastreamento de perdas',
              'Relatórios financeiros e de desempenho',
            ].map(feat => (
              <div key={feat} className="flex items-center gap-3">
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: '#D4960C' }}
                  aria-hidden="true"
                />
                <p className="text-sm" style={{ color: '#6B7280' }}>{feat}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé */}
        <div className="relative">
          <p className="text-xs" style={{ color: '#374151' }}>
            © {new Date().getFullYear()} Casa di Ana — Todos os direitos reservados
          </p>
        </div>
      </div>

      {/* ── Painel direito — formulário ──────────────────────────────── */}
      <div
        className="flex-1 flex items-center justify-center px-6 py-12"
        style={{ background: '#F5F3EF' }}
      >
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
              className="text-xl font-bold text-[#18150E]"
              style={{ fontFamily: 'Sora, system-ui, sans-serif' }}
            >
              Casa di Ana
            </h1>
          </div>

          {/* Cabeçalho */}
          <div className="mb-8">
            <h2
              className="text-2xl font-bold text-[#18150E] tracking-tight"
              style={{ fontFamily: 'Sora, system-ui, sans-serif' }}
            >
              Bem-vindo de volta
            </h2>
            <p className="mt-1.5 text-sm" style={{ color: '#8B7E73' }}>
              Acesse com suas credenciais para continuar.
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* E-mail */}
            <div>
              <label
                htmlFor="email"
                className="block text-[13px] font-medium mb-1.5"
                style={{ color: '#4B4039', fontFamily: 'DM Sans, system-ui, sans-serif' }}
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
                spellCheck={false}
                disabled={carregando}
                className="w-full rounded-xl px-4 py-3 text-sm text-[#18150E] placeholder-[#C4B8AD]
                           bg-white border border-[#E4DDD3] outline-none
                           transition-all duration-200
                           focus-visible:border-[#C4870A] focus-visible:ring-2 focus-visible:ring-[#C4870A]/20
                           disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ boxShadow: 'var(--shadow-xs)' }}
              />
            </div>

            {/* Senha */}
            <div>
              <label
                htmlFor="senha"
                className="block text-[13px] font-medium mb-1.5"
                style={{ color: '#4B4039', fontFamily: 'DM Sans, system-ui, sans-serif' }}
              >
                Senha
              </label>
              <input
                id="senha"
                type="password"
                name="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={carregando}
                className="w-full rounded-xl px-4 py-3 text-sm text-[#18150E] placeholder-[#C4B8AD]
                           bg-white border border-[#E4DDD3] outline-none
                           transition-all duration-200
                           focus-visible:border-[#C4870A] focus-visible:ring-2 focus-visible:ring-[#C4870A]/20
                           disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ boxShadow: 'var(--shadow-xs)' }}
              />
            </div>

            {/* Erro */}
            {erro && (
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}
                role="alert"
                aria-live="polite"
              >
                {erro}
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={carregando}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold
                         text-white transition-all duration-200 mt-2 outline-none
                         focus-visible:ring-2 focus-visible:ring-[#C4870A]/40
                         disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #D4960C 0%, #B87D0A 100%)',
                boxShadow: '0 4px 12px rgba(196,135,10,0.30)',
                fontFamily: 'Sora, system-ui, sans-serif',
              }}
              onMouseEnter={e => !carregando && ((e.currentTarget as HTMLElement).style.boxShadow = '0 6px 18px rgba(196,135,10,0.40)')}
              onMouseLeave={e => !carregando && ((e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(196,135,10,0.30)')}
            >
              {carregando && <Spinner />}
              {carregando ? 'Entrando…' : 'Entrar no Sistema'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
