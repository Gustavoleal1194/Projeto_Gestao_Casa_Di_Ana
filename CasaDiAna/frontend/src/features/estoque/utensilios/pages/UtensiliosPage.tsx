import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/20/solid'
import { useUtensilios } from '../hooks/useUtensilios'
import { useCategoriasUtensilio } from '@/features/estoque/categorias-utensilio/hooks/useCategoriasUtensilio'
import { useAuthStore } from '@/store/authStore'
import { TabelaUtensilios } from '../components/TabelaUtensilios'
import { FiltrosUtensilios } from '../components/FiltrosUtensilios'
import { ModalDesativar } from '@/components/ui/ModalDesativar'
import { Paginacao } from '@/components/ui/Paginacao'
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonTable } from '@/components/ui/SkeletonTable'
import type { UtensilioResumo } from '@/types/estoque'

const ITENS_POR_PAGINA = 10
const PAPEIS_EDICAO = ['Admin', 'Coordenador', 'Compras']

export function UtensiliosPage() {
  const navigate = useNavigate()
  const { temPapel } = useAuthStore()
  const { utensilios, loading, erro, desativar } = useUtensilios()
  const { categorias } = useCategoriasUtensilio()

  const [busca, setBusca] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [apenasAbaixoMinimo, setApenasAbaixoMinimo] = useState(false)
  const [paginaAtual, setPaginaAtual] = useState(1)

  const [paraDesativar, setParaDesativar] = useState<UtensilioResumo | null>(null)
  const [desativando, setDesativando] = useState(false)

  const podeEditar = temPapel(...PAPEIS_EDICAO)
  const podeDesativar = temPapel(...PAPEIS_EDICAO)

  const filtrados = useMemo(() => {
    const termo = busca.toLowerCase().trim()
    return utensilios.filter(ute => {
      if (termo && !ute.nome.toLowerCase().includes(termo)) return false
      if (categoriaId) {
        const cat = categorias.find(c => c.id === categoriaId)
        if (cat && ute.categoriaNome !== cat.nome) return false
      }
      if (apenasAbaixoMinimo && !ute.estaBaixoDoMinimo) return false
      return true
    })
  }, [utensilios, busca, categoriaId, apenasAbaixoMinimo, categorias])

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
        titulo="Utensílios"
        breadcrumb={['Cadastros', 'Utensílios']}
        subtitulo={loading ? 'Carregando…' : `${utensilios.length} utensílio${utensilios.length !== 1 ? 's' : ''} cadastrado${utensilios.length !== 1 ? 's' : ''}`}
        actions={podeEditar ? (
          <button onClick={() => navigate('/estoque/utensilios/novo')} className="btn-primary">
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Novo Utensílio
          </button>
        ) : undefined}
      />

      <FiltrosUtensilios
        busca={busca}
        onBuscaChange={handleBusca}
        categoriaId={categoriaId}
        onCategoriaChange={handleCategoria}
        apenasAbaixoMinimo={apenasAbaixoMinimo}
        onApenasAbaixoMinimoChange={handleAbaixoMinimo}
        categorias={categorias}
      />

      {loading && <SkeletonTable colunas={6} linhas={5} />}

      {!loading && erro && (
        <div
          className="rounded-xl px-5 py-4 text-sm"
          style={{ background: 'var(--ada-error-bg)', border: '1px solid var(--ada-error-border)', color: '#DC2626' }}
          role="alert"
        >
          {erro}
        </div>
      )}

      {!loading && !erro && (
        <div>
          <TabelaUtensilios
            utensilios={paginados}
            podeEditar={podeEditar}
            podeDesativar={podeDesativar}
            onEditar={id => navigate(`/estoque/utensilios/${id}/editar`)}
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

      {paraDesativar && (
        <ModalDesativar
          nome={paraDesativar.nome}
          entidade="utensílio"
          loading={desativando}
          onConfirmar={confirmarDesativacao}
          onCancelar={() => setParaDesativar(null)}
        />
      )}
    </div>
  )
}
