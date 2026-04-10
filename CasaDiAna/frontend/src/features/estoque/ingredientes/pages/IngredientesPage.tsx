import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/20/solid'
import { useIngredientes } from '../hooks/useIngredientes'
import { useCategorias } from '@/features/estoque/categorias/hooks/useCategorias'
import { useAuthStore } from '@/store/authStore'
import { TabelaIngredientes } from '../components/TabelaIngredientes'
import { FiltrosIngredientes } from '../components/FiltrosIngredientes'
import { ModalDesativar } from '../components/ModalDesativar'
import { Paginacao } from '../components/Paginacao'
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

      {/* ── Cabeçalho da página ──────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
          >
            Ingredientes
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ada-muted)' }}>
            {loading
              ? 'Carregando…'
              : `${ingredientes.length} ingrediente${ingredientes.length !== 1 ? 's' : ''} cadastrado${ingredientes.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>
        {podeEditar && (
          <button
            onClick={() => navigate('/estoque/ingredientes/novo')}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white
                       transition-all duration-200 outline-none whitespace-nowrap
                       focus-visible:ring-2 focus-visible:ring-[#C4870A]/40"
            style={{
              background: 'linear-gradient(135deg, #D4960C 0%, #B87D0A 100%)',
              boxShadow: '0 3px 10px rgba(196,135,10,0.28)',
              fontFamily: 'Sora, system-ui, sans-serif',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 5px 16px rgba(196,135,10,0.38)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 3px 10px rgba(196,135,10,0.28)'}
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Novo Ingrediente
          </button>
        )}
      </div>

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
      {loading && (
        <div
          className="rounded-xl py-20 text-center"
          style={{ background: 'var(--ada-surface)', border: '1px solid var(--ada-border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div
            className="inline-block h-9 w-9 animate-spin rounded-full mb-4"
            style={{ border: '3px solid var(--ada-border-sub)', borderTopColor: '#C4870A' }}
            role="status"
            aria-label="Carregando ingredientes…"
          />
          <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>Carregando ingredientes…</p>
        </div>
      )}

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
          nomeIngrediente={paraDesativar.nome}
          loading={desativando}
          onConfirmar={confirmarDesativacao}
          onCancelar={() => setParaDesativar(null)}
        />
      )}
    </div>
  )
}
