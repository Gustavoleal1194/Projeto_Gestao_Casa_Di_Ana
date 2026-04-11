import { useState } from 'react'
import { PlusIcon } from '@heroicons/react/20/solid'
import { useCategoriasProduto } from '../hooks/useCategoriasProduto'
import { categoriasProdutoService } from '../services/categoriasProdutoService'
import { useAuthStore } from '@/store/authStore'
import { TabelaCategoriasProduto } from '../components/TabelaCategoriasProduto'
import { ModalCategoriaProduto } from '../components/ModalCategoriaProduto'
import { ModalDesativar } from '@/features/estoque/ingredientes/components/ModalDesativar'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingState } from '@/components/ui/LoadingState'
import type { CategoriaProduto } from '@/types/producao'

const PAPEIS_EDICAO = ['Admin', 'Coordenador', 'Compras']

export function CategoriasProdutoPage() {
  const { temPapel } = useAuthStore()
  const { categorias, loading, erro, recarregar, desativar } = useCategoriasProduto()
  const podeEditar = temPapel(...PAPEIS_EDICAO)

  const [modalAberto, setModalAberto] = useState(false)
  const [categoriaEditando, setCategoriaEditando] = useState<CategoriaProduto | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [paraDesativar, setParaDesativar] = useState<CategoriaProduto | null>(null)
  const [desativando, setDesativando] = useState(false)
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)

  const abrirCriar = () => { setCategoriaEditando(null); setModalAberto(true) }
  const abrirEditar = (cat: CategoriaProduto) => { setCategoriaEditando(cat); setModalAberto(true) }
  const fecharModal = () => { setModalAberto(false); setCategoriaEditando(null) }

  const handleSalvar = async (nome: string) => {
    setSalvando(true)
    try {
      if (categoriaEditando) {
        await categoriasProdutoService.atualizar({ id: categoriaEditando.id, nome })
        setToast({ tipo: 'sucesso', mensagem: 'Categoria atualizada com sucesso.' })
      } else {
        await categoriasProdutoService.criar({ nome })
        setToast({ tipo: 'sucesso', mensagem: 'Categoria criada com sucesso.' })
      }
      fecharModal()
      recarregar()
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao salvar categoria.' })
    } finally {
      setSalvando(false)
    }
  }

  const handleDesativar = async () => {
    if (!paraDesativar) return
    setDesativando(true)
    try {
      await desativar(paraDesativar.id)
      setParaDesativar(null)
      setToast({ tipo: 'sucesso', mensagem: 'Categoria desativada.' })
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao desativar categoria.' })
    } finally {
      setDesativando(false)
    }
  }

  return (
    <div className="ada-page">
      <PageHeader
        titulo="Categorias de Produto"
        breadcrumb={['Produção', 'Categorias de Produto']}
        subtitulo={loading ? 'Carregando…' : `${categorias.length} categoria${categorias.length !== 1 ? 's' : ''} cadastrada${categorias.length !== 1 ? 's' : ''}`}
        actions={podeEditar ? (
          <button onClick={abrirCriar} className="btn-primary">
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Nova Categoria
          </button>
        ) : undefined}
      />

      {loading && <LoadingState mensagem="Carregando categorias…" />}
      {!loading && erro && (
        <div className="state-error" role="alert">{erro}</div>
      )}
      {!loading && !erro && (
        <TabelaCategoriasProduto
          categorias={categorias}
          podeEditar={podeEditar}
          onEditar={abrirEditar}
          onDesativar={setParaDesativar}
        />
      )}

      {modalAberto && (
        <ModalCategoriaProduto
          categoria={categoriaEditando}
          salvando={salvando}
          onSalvar={handleSalvar}
          onFechar={fecharModal}
        />
      )}
      {paraDesativar && (
        <ModalDesativar
          nomeIngrediente={paraDesativar.nome}
          loading={desativando}
          onConfirmar={handleDesativar}
          onCancelar={() => setParaDesativar(null)}
        />
      )}
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}
    </div>
  )
}
