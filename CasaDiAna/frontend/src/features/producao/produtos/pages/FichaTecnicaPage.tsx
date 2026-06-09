import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { produtosService } from '../services/produtosService'
import { ingredientesService } from '@/features/estoque/ingredientes/services/ingredientesService'
import { Toast } from '@/components/ui/Toast'
import { LoadingState } from '@/components/ui/LoadingState'
import type { FichaTecnica, ItemFichaTecnicaInput } from '@/types/producao'
import type { IngredienteResumo } from '@/types/estoque'
import { ConfirmacaoFichaTecnicaModal, type DadosConfirmacaoFichaTecnica } from '../components/ConfirmacaoFichaTecnicaModal'
import { CustoUnitarioForm } from '../components/CustoUnitarioForm'
import { IngredientesForm } from '../components/IngredientesForm'

export function FichaTecnicaPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [ficha, setFicha] = useState<FichaTecnica | null>(null)
  const [ingredientes, setIngredientes] = useState<IngredienteResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)
  const [confirma, setConfirma] = useState<DadosConfirmacaoFichaTecnica | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([
      produtosService.obterFichaTecnica(id).catch(() => null),
      ingredientesService.listar(),
    ])
      .then(([fichaData, ingsData]) => {
        setIngredientes(ingsData)
        if (fichaData) setFicha(fichaData)
      })
      .catch(() => setToast({ tipo: 'erro', mensagem: 'Erro ao carregar ficha técnica.' }))
      .finally(() => setCarregando(false))
  }, [id])

  const salvarCustoUnitario = async (valor: number) => {
    if (!id) return
    setSalvando(true)
    try {
      const fichaAtualizada = await produtosService.definirCustoUnitario(id, valor)
      setFicha(fichaAtualizada)
      setConfirma({
        produtoNome: fichaAtualizada.produtoNome,
        custoTotal: fichaAtualizada.custoTotal,
      })
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao salvar custo unitário.' })
    } finally {
      setSalvando(false)
    }
  }

  const salvarFicha = async (itens: ItemFichaTecnicaInput[]) => {
    if (!id) return
    setSalvando(true)
    try {
      const fichaAtualizada = await produtosService.definirFichaTecnica(id, { itens })
      setFicha(fichaAtualizada)
      setConfirma({
        produtoNome: fichaAtualizada.produtoNome,
        totalIngredientes: fichaAtualizada.itens.length,
        custoTotal: fichaAtualizada.custoTotal,
      })
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao salvar ficha técnica.' })
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <div className="ada-page">
        <LoadingState mensagem="Carregando ficha técnica…" />
      </div>
    )
  }

  const voltarParaProdutos = () => navigate('/producao/produtos')

  const itensIniciais = ficha?.itens.map(i => ({
    ingredienteId: i.ingredienteId,
    quantidadePorUnidade: i.quantidadePorUnidade,
  })) ?? []

  return (
    <div className="ada-page max-w-3xl">
      {confirma && (
        <ConfirmacaoFichaTecnicaModal aberto dados={confirma} onFechar={() => setConfirma(null)} />
      )}
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}

      <Link to="/producao/produtos" className="back-link">
        <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
        Produtos
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
          >
            Ficha Técnica
          </h1>
          {ficha && (
            <p className="text-sm mt-1" style={{ color: 'var(--ada-muted)' }}>
              {ficha.produtoNome} · Preço:{' '}
              {ficha.precoVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          )}
        </div>
        {ficha && ficha.custoTotal > 0 && (
          <div
            className="rounded-xl px-5 py-3 text-right"
            style={{ background: 'var(--ada-surface)', border: '1px solid var(--ada-border)', boxShadow: 'var(--shadow-sm)' }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ada-muted)' }}>Custo Total</p>
            <p className="text-lg font-bold" style={{ color: 'var(--ada-heading)' }}>
              {ficha.custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            {ficha.margemLucro != null && (
              <p className={`text-xs font-medium mt-0.5 ${ficha.margemLucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Margem: {ficha.margemLucro.toFixed(1)}%
              </p>
            )}
          </div>
        )}
      </div>

      {ficha?.tipo === 'revenda' ? (
        <CustoUnitarioForm
          valorInicial={ficha.custoUnitario}
          salvando={salvando}
          onSalvar={salvarCustoUnitario}
          onVoltar={voltarParaProdutos}
          onErro={msg => setToast({ tipo: 'erro', mensagem: msg })}
        />
      ) : (
        <IngredientesForm
          itensIniciais={itensIniciais}
          ingredientes={ingredientes}
          salvando={salvando}
          onSalvar={salvarFicha}
          onVoltar={voltarParaProdutos}
        />
      )}
    </div>
  )
}
