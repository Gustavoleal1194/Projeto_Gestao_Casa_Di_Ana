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
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-stone-800">Ingredientes</h1>
        {podeEditar && (
          <button
            onClick={() => navigate('/estoque/ingredientes/novo')}
            className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white
                       px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Novo Ingrediente
          </button>
        )}
      </div>

      {/* Filtros */}
      <FiltrosIngredientes
        busca={busca}
        onBuscaChange={handleBusca}
        categoriaId={categoriaId}
        onCategoriaChange={handleCategoria}
        apenasAbaixoMinimo={apenasAbaixoMinimo}
        onApenasAbaixoMinimoChange={handleAbaixoMinimo}
        categorias={categorias}
      />

      {/* Carregando */}
      {loading && (
        <div className="bg-white rounded-xl shadow-sm py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4
                          border-stone-200 border-t-amber-700" />
          <p className="text-stone-500 mt-3 text-sm">Carregando ingredientes...</p>
        </div>
      )}

      {/* Erro */}
      {!loading && erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {erro}
        </div>
      )}

      {/* Tabela + paginação */}
      {!loading && !erro && (
        <>
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
        </>
      )}

      {/* Modal desativar */}
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
