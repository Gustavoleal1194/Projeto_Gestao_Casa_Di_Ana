import { useState, useMemo } from 'react'
import { PlusIcon } from '@heroicons/react/20/solid'
import { useCategoriasUtensilio } from '../hooks/useCategoriasUtensilio'
import { categoriasUtensilioService } from '../services/categoriasUtensilioService'
import { useAuthStore } from '@/store/authStore'
import { TabelaCadastroSimples } from '@/components/ui/TabelaCadastroSimples'
import { FiltrosBuscaCadastro } from '@/components/ui/FiltrosBuscaCadastro'
import { ModalCadastroSimples } from '@/components/ui/ModalCadastroSimples'
import { ModalDesativar } from '@/components/ui/ModalDesativar'
import { Toast } from '@/components/ui/Toast'
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonTable } from '@/components/ui/SkeletonTable'
import type { CategoriaUtensilio } from '@/types/estoque'

const PAPEIS_EDICAO = ['Admin', 'Coordenador', 'Compras']

export function CategoriasUtensilioPage() {
  const { temPapel } = useAuthStore()
  const { categorias, loading, erro, recarregar, desativar } = useCategoriasUtensilio()
  const podeEditar = temPapel(...PAPEIS_EDICAO)

  const [busca, setBusca] = useState('')

  const filtradas = useMemo(() => {
    const termo = busca.toLowerCase().trim()
    if (!termo) return categorias
    return categorias.filter(c => c.nome.toLowerCase().includes(termo))
  }, [categorias, busca])

  const [modalAberto, setModalAberto] = useState(false)
  const [categoriaEditando, setCategoriaEditando] = useState<CategoriaUtensilio | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [paraDesativar, setParaDesativar] = useState<CategoriaUtensilio | null>(null)
  const [desativando, setDesativando] = useState(false)
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)

  const abrirCriar = () => { setCategoriaEditando(null); setModalAberto(true) }
  const abrirEditar = (cat: CategoriaUtensilio) => { setCategoriaEditando(cat); setModalAberto(true) }
  const fecharModal = () => { setModalAberto(false); setCategoriaEditando(null) }

  const handleSalvar = async (nome: string) => {
    setSalvando(true)
    try {
      if (categoriaEditando) {
        await categoriasUtensilioService.atualizar({ id: categoriaEditando.id, nome })
        setToast({ tipo: 'sucesso', mensagem: 'Categoria atualizada com sucesso.' })
      } else {
        await categoriasUtensilioService.criar({ nome })
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
        titulo="Categorias de Utensílio"
        breadcrumb={['Cadastros', 'Categorias de Utensílio']}
        subtitulo={loading ? 'Carregando…' : `${categorias.length} categoria${categorias.length !== 1 ? 's' : ''} cadastrada${categorias.length !== 1 ? 's' : ''}`}
        actions={podeEditar ? (
          <button type="button" onClick={abrirCriar} className="btn-primary">
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Nova Categoria
          </button>
        ) : undefined}
      />

      <FiltrosBuscaCadastro
        busca={busca}
        onBuscaChange={setBusca}
      />

      {loading && <SkeletonTable colunas={3} linhas={4} />}
      {!loading && erro && (
        <div className="state-error" role="alert">{erro}</div>
      )}
      {!loading && !erro && (
        <TabelaCadastroSimples
          itens={filtradas}
          podeEditar={podeEditar}
          onEditar={abrirEditar}
          onDesativar={setParaDesativar}
          busca={busca}
          mensagemVazia="Crie uma categoria para organizar os utensílios."
        />
      )}

      {modalAberto && (
        <ModalCadastroSimples
          item={categoriaEditando}
          placeholderNome="Ex: Limpeza"
          salvando={salvando}
          onSalvar={handleSalvar}
          onFechar={fecharModal}
        />
      )}
      {paraDesativar && (
        <ModalDesativar
          nome={paraDesativar.nome}
          entidade="categoria"
          loading={desativando}
          onConfirmar={handleDesativar}
          onCancelar={() => setParaDesativar(null)}
        />
      )}
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}
    </div>
  )
}
