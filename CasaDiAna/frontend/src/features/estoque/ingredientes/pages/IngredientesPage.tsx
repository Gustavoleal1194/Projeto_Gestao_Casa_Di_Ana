import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/20/solid'
import { useIngredientes } from '../hooks/useIngredientes'
import { useCategorias } from '@/features/estoque/categorias/hooks/useCategorias'
import { useAuthStore } from '@/store/authStore'
import { TabelaIngredientes } from '../components/TabelaIngredientes'
import { FiltrosIngredientes } from '../components/FiltrosIngredientes'
import { ModalDesativar } from '@/components/ui/ModalDesativar'
import { Paginacao } from '@/components/ui/Paginacao'
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonTable } from '@/components/ui/SkeletonTable'
import type { IngredienteResumo } from '@/types/estoque'

const ITENS_POR_PAGINA = 10
const PAPEIS_EDICAO = ['Admin', 'Coordenador', 'Compras']

export function IngredientesPage() {
  const navigate = useNavigate()
  const { temPapel } = useAuthStore()
  const { ingredientes, loading, erro, desativar } = useIngredientes()
  const { categorias } = useCategorias()

  const [busca, setBusca] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [apenasAbaixoMinimo, setApenasAbaixoMinimo] = useState(false)
  const [paginaAtual, setPaginaAtual] = useState(1)

  const [paraDesativar, setParaDesativar] = useState<IngredienteResumo | null>(null)
  const [desativando, setDesativando] = useState(false)

  const podeEditar = temPapel(...PAPEIS_EDICAO)
  const podeDesativar = temPapel(...PAPEIS_EDICAO)

  const filtrados = useMemo(() => {
    const termo = busca.toLowerCase().trim()
    return ingredientes.filter(ing => {
      if (termo && !ing.nome.toLowerCase().includes(termo)) return false
      if (categoriaId) {
        const cat = categorias.find(c => c.id === categoriaId)
        if (cat && ing.categoriaNome !== cat.nome) return false
      }
      if (apenasAbaixoMinimo && !ing.estaBaixoDoMinimo) return false
      return true
    })
  }, [ingredientes, busca, categoriaId, apenasAbaixoMinimo, categorias])

  const handleBusca = (v: string) => { setBusca(v); setPaginaAtual(1) }
  const handleCategoria = (v: string) => { setCategoriaId(v); setPaginaAtual(1) }
  const handleAbaixoMinimo = (v: boolean) => { setApenasAbaixoMinimo(v); setPaginaAtual(1) }

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ITENS_POR_PAGINA))
  const paginados = filtrados.slice(
    (paginaAtual - 1) * ITENS_POR_PAGINA,
    paginaAtual * ITENS_POR_PAGINA
  )

  const confirmarDesativacao = useCallback(async () => {
    if (!paraDesativar) return
    setDesativando(true)
    try {
      await desativar(paraDesativar.id)
      setParaDesativar(null)
    } finally {
      setDesativando(false)
    }
  }, [paraDesativar, desativar])

  return (
    <div className="ada-page max-w-[1280px] mx-auto">

      <PageHeader
        titulo="Ingredientes"
        breadcrumb={['Cadastros', 'Ingredientes']}
        subtitulo={loading ? 'Carregando…' : `${ingredientes.length} ingrediente${ingredientes.length !== 1 ? 's' : ''} cadastrado${ingredientes.length !== 1 ? 's' : ''}`}
        actions={podeEditar ? (
          <button onClick={() => navigate('/estoque/ingredientes/novo')} className="btn-primary">
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Novo Ingrediente
          </button>
        ) : undefined}
      />

      {/* ── Filtros ──────────────────────────────────────────────────── */}
      <FiltrosIngredientes
        busca={busca}
        onBuscaChange={handleBusca}
        categoriaId={categoriaId}
        onCategoriaChange={handleCategoria}
        apenasAbaixoMinimo={apenasAbaixoMinimo}
        onApenasAbaixoMinimoChange={handleAbaixoMinimo}
        categorias={categorias}
      />

      {/* ── Carregando ───────────────────────────────────────────────── */}
      {loading && <SkeletonTable colunas={6} linhas={5} />}

      {/* ── Erro ─────────────────────────────────────────────────────── */}
      {!loading && erro && (
        <div
          className="rounded-xl px-5 py-4 text-sm"
          style={{ background: 'var(--ada-error-bg)', border: '1px solid var(--ada-error-border)', color: '#DC2626' }}
          role="alert"
        >
          {erro}
        </div>
      )}

      {/* ── Tabela + paginação ───────────────────────────────────────── */}
      {!loading && !erro && (
        <div>
          <TabelaIngredientes
            ingredientes={paginados}
            podeEditar={podeEditar}
            podeDesativar={podeDesativar}
            onEditar={id => navigate(`/estoque/ingredientes/${id}/editar`)}
            onDesativar={setParaDesativar}
          />
          <Paginacao
            paginaAtual={paginaAtual}
            totalPaginas={totalPaginas}
            totalItens={filtrados.length}
            itensPorPagina={ITENS_POR_PAGINA}
            onPaginaChange={setPaginaAtual}
          />
        </div>
      )}

      {/* ── Modal ────────────────────────────────────────────────────── */}
      {paraDesativar && (
        <ModalDesativar
          nome={paraDesativar.nome}
          entidade="ingrediente"
          loading={desativando}
          onConfirmar={confirmarDesativacao}
          onCancelar={() => setParaDesativar(null)}
        />
      )}
    </div>
  )
}
