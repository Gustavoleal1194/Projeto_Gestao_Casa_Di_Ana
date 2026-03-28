import { useEffect, useState } from 'react'
import { PlusIcon } from '@heroicons/react/20/solid'
import { KeyIcon, TrashIcon } from '@heroicons/react/24/outline'
import { usuariosService, type UsuarioDto, type CriarUsuarioInput } from '../services/usuariosService'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'

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

const inputClass =
  'w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'

type ModalTipo = 'criar' | 'senha' | null

export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioDto[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)
  const [modal, setModal] = useState<ModalTipo>(null)
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<UsuarioDto | null>(null)
  const [salvando, setSalvando] = useState(false)

  // Form criar
  const [form, setForm] = useState<CriarUsuarioInput>({ nome: '', email: '', senha: '', papel: 'Coordenador' })
  const [formErros, setFormErros] = useState<Partial<Record<keyof CriarUsuarioInput, string>>>({})

  // Form senha
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
    } catch (err: any) {
      const msg = err?.response?.data?.erros?.[0] ?? 'Erro ao criar usuário.'
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
    } catch (err: any) {
      const msg = err?.response?.data?.erros?.[0] ?? 'Erro ao desativar usuário.'
      setToast({ tipo: 'erro', mensagem: msg })
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-stone-800">Usuários</h1>
        <button
          onClick={abrirCriar}
          className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white
                     px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Novo Usuário
        </button>
      </div>

      {loading && (
        <div className="bg-white rounded-xl shadow-sm py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-amber-700" />
          <p className="text-stone-500 mt-3 text-sm">Carregando...</p>
        </div>
      )}
      {!loading && erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{erro}</div>
      )}
      {!loading && !erro && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {usuarios.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-stone-500 text-sm">Nenhum usuário cadastrado.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Nome</th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">E-mail</th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Papel</th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Status</th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id} className="border-b border-stone-100 hover:bg-amber-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-stone-800">{u.nome}</td>
                    <td className="px-4 py-3 text-sm text-stone-500">{u.email}</td>
                    <td className="px-4 py-3 text-sm text-stone-600">{PAPEL_LABEL[u.papel] ?? u.papel}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.ativo ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'
                      }`}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => abrirSenha(u)}
                        title="Redefinir senha"
                        className="p-1.5 rounded hover:bg-stone-100 text-stone-500 hover:text-amber-700"
                      >
                        <KeyIcon className="h-4 w-4" />
                      </button>
                      {u.ativo && (
                        <button
                          onClick={() => handleDesativar(u)}
                          title="Desativar"
                          className="p-1.5 rounded hover:bg-stone-100 text-stone-500 hover:text-red-600 ml-1"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal — Criar usuário */}
      {modal === 'criar' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-stone-200">
              <h2 className="text-base font-semibold text-stone-800">Novo Usuário</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Nome <span className="text-red-500">*</span></label>
                <input
                  className={inputClass}
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Nome completo"
                />
                {formErros.nome && <p className="mt-1 text-xs text-red-600">{formErros.nome}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">E-mail <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
                {formErros.email && <p className="mt-1 text-xs text-red-600">{formErros.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Senha <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  className={inputClass}
                  value={form.senha}
                  onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                />
                {formErros.senha && <p className="mt-1 text-xs text-red-600">{formErros.senha}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Papel <span className="text-red-500">*</span></label>
                <select
                  className={inputClass}
                  value={form.papel}
                  onChange={e => setForm(f => ({ ...f, papel: e.target.value }))}
                >
                  {PAPEIS.map(p => (
                    <option key={p} value={p}>{PAPEL_LABEL[p] ?? p}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-stone-200 flex justify-end gap-3">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleCriar}
                disabled={salvando}
                className="px-6 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {salvando ? 'Salvando...' : 'Criar Usuário'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Redefinir senha */}
      {modal === 'senha' && usuarioSelecionado && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-stone-200">
              <h2 className="text-base font-semibold text-stone-800">Redefinir Senha</h2>
              <p className="text-xs text-stone-500 mt-0.5">{usuarioSelecionado.nome}</p>
            </div>
            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-stone-700 mb-1">Nova Senha <span className="text-red-500">*</span></label>
              <input
                type="password"
                className={inputClass}
                value={novaSenha}
                onChange={e => { setNovaSenha(e.target.value); setSenhaErro('') }}
                placeholder="Mínimo 6 caracteres"
              />
              {senhaErro && <p className="mt-1 text-xs text-red-600">{senhaErro}</p>}
            </div>
            <div className="px-6 py-4 border-t border-stone-200 flex justify-end gap-3">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleRedefinirSenha}
                disabled={salvando}
                className="px-6 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {salvando ? 'Salvando...' : 'Redefinir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}
    </div>
  )
}
