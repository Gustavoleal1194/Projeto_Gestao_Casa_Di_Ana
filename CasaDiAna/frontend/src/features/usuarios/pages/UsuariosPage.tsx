import { useEffect, useState } from 'react'
import { PlusIcon } from '@heroicons/react/20/solid'
import { KeyIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { usuariosService, type UsuarioDto, type CriarUsuarioInput } from '../services/usuariosService'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import { Spinner } from '@/components/form/Spinner'

const PAPEIS = [
  'Admin',
  'Coordenador',
  'OperadorCozinha',
  'OperadorPanificacao',
  'OperadorBar',
  'Compras',
]

const PAPEL_LABEL: Record<string, string> = {
  Admin: 'Admin',
  Coordenador: 'Coordenador',
  OperadorCozinha: 'Op. Cozinha',
  OperadorPanificacao: 'Op. Panificação',
  OperadorBar: 'Op. Bar',
  Compras: 'Compras',
}

type ModalTipo = 'criar' | 'senha' | null

// ─── Campo de formulário interno ────────────────────────────────────────────
function Campo({
  label,
  erro,
  obrigatorio,
  children,
}: {
  label: string
  erro?: string
  obrigatorio?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        className="block text-[13px] font-medium mb-1.5"
        style={{ color: 'var(--ada-body)' }}
      >
        {label}
        {obrigatorio && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      {children}
      {erro && (
        <p className="mt-1 text-xs" style={{ color: 'var(--ada-error-text)' }}>{erro}</p>
      )}
    </div>
  )
}

const fieldCls = [
  'w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all duration-200',
  'border border-[var(--ada-border)] bg-[var(--ada-surface)] text-[var(--ada-heading)]',
  'placeholder-[var(--ada-placeholder)]',
  'focus-visible:border-[#C4870A] focus-visible:ring-2 focus-visible:ring-[#C4870A]/25',
].join(' ')

export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioDto[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)
  const [modal, setModal] = useState<ModalTipo>(null)
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<UsuarioDto | null>(null)
  const [salvando, setSalvando] = useState(false)

  const [form, setForm] = useState<CriarUsuarioInput>({ nome: '', email: '', senha: '', papel: 'Coordenador' })
  const [formErros, setFormErros] = useState<Partial<Record<keyof CriarUsuarioInput, string>>>({})
  const [novaSenha, setNovaSenha] = useState('')
  const [senhaErro, setSenhaErro] = useState('')

  const carregar = async () => {
    setLoading(true)
    setErro(null)
    try {
      setUsuarios(await usuariosService.listar())
    } catch {
      setErro('Erro ao carregar usuários.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const abrirCriar = () => {
    setForm({ nome: '', email: '', senha: '', papel: 'Coordenador' })
    setFormErros({})
    setModal('criar')
  }

  const abrirSenha = (u: UsuarioDto) => {
    setUsuarioSelecionado(u)
    setNovaSenha('')
    setSenhaErro('')
    setModal('senha')
  }

  const validarForm = (): boolean => {
    const erros: Partial<Record<keyof CriarUsuarioInput, string>> = {}
    if (!form.nome.trim()) erros.nome = 'Nome obrigatório.'
    if (!form.email.trim()) erros.email = 'E-mail obrigatório.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) erros.email = 'E-mail inválido.'
    if (!form.senha) erros.senha = 'Senha obrigatória.'
    else if (form.senha.length < 6) erros.senha = 'Mínimo 6 caracteres.'
    setFormErros(erros)
    return Object.keys(erros).length === 0
  }

  const handleCriar = async () => {
    if (!validarForm()) return
    setSalvando(true)
    try {
      await usuariosService.criar(form)
      setModal(null)
      setToast({ tipo: 'sucesso', mensagem: 'Usuário criado com sucesso.' })
      carregar()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { erros?: string[] } } })?.response?.data?.erros?.[0] ?? 'Erro ao criar usuário.'
      setToast({ tipo: 'erro', mensagem: msg })
    } finally {
      setSalvando(false)
    }
  }

  const handleRedefinirSenha = async () => {
    if (!novaSenha || novaSenha.length < 6) {
      setSenhaErro('Mínimo 6 caracteres.')
      return
    }
    if (!usuarioSelecionado) return
    setSalvando(true)
    try {
      await usuariosService.redefinirSenha(usuarioSelecionado.id, novaSenha)
      setModal(null)
      setToast({ tipo: 'sucesso', mensagem: 'Senha redefinida com sucesso.' })
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao redefinir senha.' })
    } finally {
      setSalvando(false)
    }
  }

  const handleDesativar = async (u: UsuarioDto) => {
    if (!confirm(`Desativar o usuário "${u.nome}"?`)) return
    try {
      await usuariosService.desativar(u.id)
      setToast({ tipo: 'sucesso', mensagem: 'Usuário desativado.' })
      carregar()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { erros?: string[] } } })?.response?.data?.erros?.[0] ?? 'Erro ao desativar usuário.'
      setToast({ tipo: 'erro', mensagem: msg })
    }
  }

  return (
    <div className="ada-page">

      {/* ── Cabeçalho ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
          >
            Usuários
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ada-muted)' }}>
            {loading
              ? 'Carregando…'
              : `${usuarios.length} usuário${usuarios.length !== 1 ? 's' : ''} cadastrado${usuarios.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>
        <button onClick={abrirCriar} className="btn-primary">
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          Novo Usuário
        </button>
      </div>

      {/* ── Estados ────────────────────────────────────────────────────── */}
      {loading && (
        <div className="state-loading">
          <div
            className="inline-block h-9 w-9 animate-spin rounded-full mb-4"
            style={{ border: '3px solid var(--ada-border-sub)', borderTopColor: '#C4870A' }}
            role="status"
            aria-label="Carregando usuários…"
          />
          <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>Carregando usuários…</p>
        </div>
      )}
      {!loading && erro && (
        <div className="state-error" role="alert">{erro}</div>
      )}

      {/* ── Tabela ─────────────────────────────────────────────────────── */}
      {!loading && !erro && (
        <div className="ada-surface-card">
          {usuarios.length === 0 ? (
            <div className="state-empty">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--ada-bg)', border: '1px solid var(--ada-border)' }}
                aria-hidden="true"
              >
                <svg className="w-6 h-6" style={{ color: 'var(--ada-placeholder)' }} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 7a4 4 0 100 8 4 4 0 000-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--ada-body)', fontFamily: 'Sora, system-ui, sans-serif' }}>
                Nenhum usuário cadastrado
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" role="table">
                <thead>
                  <tr className="table-head-row">
                    <th className="table-th" scope="col">Nome</th>
                    <th className="table-th" scope="col">E-mail</th>
                    <th className="table-th" scope="col">Papel</th>
                    <th className="table-th" scope="col">Status</th>
                    <th className="table-th table-th-right" scope="col">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.id} className="table-row group">
                      <td className="table-td">
                        <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
                          {u.nome}
                        </span>
                      </td>
                      <td className="table-td">
                        <span className="text-sm" style={{ color: 'var(--ada-muted-dim)' }}>{u.email}</span>
                      </td>
                      <td className="table-td">
                        <span
                          className="inline-block text-[12px] font-semibold rounded-md px-2 py-0.5"
                          style={{ background: 'var(--ada-bg)', color: 'var(--ada-muted)', border: '1px solid var(--ada-border)' }}
                        >
                          {PAPEL_LABEL[u.papel] ?? u.papel}
                        </span>
                      </td>
                      <td className="table-td">
                        <span className={u.ativo ? 'badge badge-active' : 'badge badge-inactive'}>
                          {u.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="table-td" style={{ textAlign: 'right' }}>
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button
                            onClick={() => abrirSenha(u)}
                            aria-label={`Redefinir senha de ${u.nome}`}
                            title="Redefinir senha"
                            className="row-action-btn"
                          >
                            <KeyIcon className="h-4 w-4" aria-hidden="true" />
                          </button>
                          {u.ativo && (
                            <button
                              onClick={() => handleDesativar(u)}
                              aria-label={`Desativar ${u.nome}`}
                              title="Desativar"
                              className="row-action-btn danger"
                            >
                              <TrashIcon className="h-4 w-4" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Modal — Criar usuário ───────────────────────────────────────── */}
      {modal === 'criar' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(13,17,23,0.55)', backdropFilter: 'blur(4px)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-criar-titulo"
          onClick={e => { if (e.target === e.currentTarget && !salvando) setModal(null) }}
        >
          <div
            className="w-full max-w-md rounded-2xl"
            style={{
              background: 'var(--ada-surface)',
              border: '1px solid var(--ada-border)',
              boxShadow: '0 24px 48px rgba(13,17,23,0.18), 0 8px 16px rgba(13,17,23,0.10)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 pt-5 pb-4"
              style={{ borderBottom: '1px solid var(--ada-border-sub)' }}
            >
              <h2
                id="modal-criar-titulo"
                className="text-[15px] font-semibold"
                style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
              >
                Novo Usuário
              </h2>
              <button
                onClick={() => setModal(null)}
                disabled={salvando}
                className="p-1.5 rounded-lg transition-colors duration-150 outline-none
                           focus-visible:ring-2 focus-visible:ring-[#C4870A]/40 disabled:opacity-40"
                aria-label="Fechar"
                style={{ color: 'var(--ada-muted)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--ada-bg)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <XMarkIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <Campo label="Nome" obrigatorio erro={formErros.nome}>
                <input
                  className={fieldCls}
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Nome completo"
                  autoFocus
                />
              </Campo>
              <Campo label="E-mail" obrigatorio erro={formErros.email}>
                <input
                  type="email"
                  className={fieldCls}
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </Campo>
              <Campo label="Senha" obrigatorio erro={formErros.senha}>
                <input
                  type="password"
                  className={fieldCls}
                  value={form.senha}
                  onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                  placeholder="Mínimo 8 caracteres"
                />
              </Campo>
              <Campo label="Papel" obrigatorio>
                <select
                  className={`${fieldCls} appearance-none`}
                  value={form.papel}
                  onChange={e => setForm(f => ({ ...f, papel: e.target.value }))}
                >
                  {PAPEIS.map(p => (
                    <option key={p} value={p}>{PAPEL_LABEL[p] ?? p}</option>
                  ))}
                </select>
              </Campo>
            </div>

            {/* Footer */}
            <div
              className="flex justify-end gap-2.5 px-6 py-4"
              style={{ borderTop: '1px solid var(--ada-border-sub)', background: 'var(--ada-surface-2)', borderRadius: '0 0 16px 16px' }}
            >
              <button
                onClick={() => setModal(null)}
                disabled={salvando}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleCriar}
                disabled={salvando}
                className="btn-primary"
              >
                {salvando && <Spinner />}
                {salvando ? 'Criando…' : 'Criar Usuário'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal — Redefinir senha ─────────────────────────────────────── */}
      {modal === 'senha' && usuarioSelecionado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(13,17,23,0.55)', backdropFilter: 'blur(4px)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-senha-titulo"
          onClick={e => { if (e.target === e.currentTarget && !salvando) setModal(null) }}
        >
          <div
            className="w-full max-w-sm rounded-2xl"
            style={{
              background: 'var(--ada-surface)',
              border: '1px solid var(--ada-border)',
              boxShadow: '0 24px 48px rgba(13,17,23,0.18), 0 8px 16px rgba(13,17,23,0.10)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 pt-5 pb-4"
              style={{ borderBottom: '1px solid var(--ada-border-sub)' }}
            >
              <div>
                <h2
                  id="modal-senha-titulo"
                  className="text-[15px] font-semibold"
                  style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
                >
                  Redefinir Senha
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--ada-muted)' }}>
                  {usuarioSelecionado.nome}
                </p>
              </div>
              <button
                onClick={() => setModal(null)}
                disabled={salvando}
                className="p-1.5 rounded-lg transition-colors duration-150 outline-none
                           focus-visible:ring-2 focus-visible:ring-[#C4870A]/40 disabled:opacity-40"
                aria-label="Fechar"
                style={{ color: 'var(--ada-muted)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--ada-bg)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <XMarkIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <Campo label="Nova Senha" obrigatorio erro={senhaErro}>
                <input
                  type="password"
                  className={fieldCls}
                  value={novaSenha}
                  onChange={e => { setNovaSenha(e.target.value); setSenhaErro('') }}
                  placeholder="Mínimo 8 caracteres"
                  autoFocus
                />
              </Campo>
            </div>

            {/* Footer */}
            <div
              className="flex justify-end gap-2.5 px-6 py-4"
              style={{ borderTop: '1px solid var(--ada-border-sub)', background: 'var(--ada-surface-2)', borderRadius: '0 0 16px 16px' }}
            >
              <button
                onClick={() => setModal(null)}
                disabled={salvando}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleRedefinirSenha}
                disabled={salvando}
                className="btn-primary"
              >
                {salvando && <Spinner />}
                {salvando ? 'Salvando…' : 'Redefinir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}
    </div>
  )
}
