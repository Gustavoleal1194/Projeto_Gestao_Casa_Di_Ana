import { LoginHeroPanel } from '../components/hero/LoginHeroPanel'
import { LoginForm } from '../components/form/LoginForm'

export function LoginPage() {
  return (
    <div className="min-h-screen flex" style={{ background: '#0D1117' }}>
      <LoginHeroPanel />
      <div
        className="flex-1 flex items-center justify-center px-6 py-12"
        style={{ background: 'var(--ada-bg)' }}
      >
        <LoginForm />
      </div>
    </div>
  )
}
