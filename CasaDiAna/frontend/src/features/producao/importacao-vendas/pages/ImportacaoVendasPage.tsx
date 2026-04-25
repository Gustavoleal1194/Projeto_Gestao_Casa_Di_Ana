import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  QuestionMarkCircleIcon,
  EyeSlashIcon,
  PlusCircleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { importacaoVendasService } from '../services/importacaoVendasService'
import { QuickCreateProductModal } from '../components/QuickCreateProductModal'
import { ConfirmRemoveDialog } from '../components/ConfirmRemoveDialog'
import { ConfirmacaoImportacaoModal, type DadosConfirmacaoImportacao, type ItemConfirmacaoImportacao } from '../components/ConfirmacaoImportacaoModal'
import { produtosService } from '@/features/producao/produtos/services/produtosService'
import { useAuthStore } from '@/store/authStore'
import type {
  PreviewImportacao,
  ItemPreview,
  ResultadoImportacao,
  StatusImportacao,
} from '@/types/importacao'
import type { Produto } from '@/types/producao'

type Etapa = 'upload' | 'processando' | 'preview' | 'confirmando' | 'resultado'

const STATUS_CFG: Record<StatusImportacao, {
  label: string
  cor: string
  bg: string
  border: string
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}> = {
  matched:   { label: 'Encontrado',     cor: '#15803D', bg: 'var(--ada-success-bg)',  border: 'var(--ada-success-border)', Icon: CheckCircleIcon },
  ambiguous: { label: 'Ambíguo',        cor: '#B45309', bg: 'var(--ada-warning-bg)',  border: 'var(--ada-warning-border)', Icon: QuestionMarkCircleIcon },
  unmatched: { label: 'Não encontrado', cor: '#DC2626', bg: 'var(--ada-error-bg)',    border: 'var(--ada-error-border)',   Icon: XCircleIcon },
  ignored:   { label: 'Ignorado',       cor: 'var(--ada-muted)', bg: 'var(--ada-surface-2)', border: 'var(--ada-border)', Icon: EyeSlashIcon },
}

// Suppress unused import warning — ExclamationTriangleIcon reserved for future use
void ExclamationTriangleIcon

function precoUnitario(item: ItemPreview): number {
  return item.quantidade > 0
    ? Math.round((item.valorTotal / item.quantidade) * 100) / 100
    : 0
}

export function ImportacaoVendasPage() {
  const navigate = useNavigate()
  const { usuario } = useAuthStore()
  const [etapa, setEtapa] = useState<Etapa>('upload')
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewImportacao | null>(null)
  const [dataVenda, setDataVenda] = useState(new Date().toISOString().split('T')[0])
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null)
  const [resolucoes, setResolucoes] = useState<Record<string, string>>({})
  const [dadosConfirmacao, setDadosConfirmacao] = useState<DadosConfirmacaoImportacao | null>(null)

  // Seleção em lote
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [criandoEmLote, setCriandoEmLote] = useState(false)
  const checkboxTodosRef = useRef<HTMLInputElement>(null)

  // Estado dos modais de ação por linha
  const [itemParaAdicionar, setItemParaAdicionar] = useState<ItemPreview | null>(null)
  const [itemParaRemover, setItemParaRemover] = useState<ItemPreview | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  // Contagens calculadas dinamicamente a partir dos itens atuais (refletem remoções locais)
  const contagens = useMemo(() => {
    if (!preview) return { matched: 0, ambiguous: 0, unmatched: 0, ignored: 0 }
    return {
      matched:   preview.itens.filter(i => i.status === 'matched').length,
      ambiguous: preview.itens.filter(i => i.status === 'ambiguous').length,
      unmatched: preview.itens.filter(i => i.status === 'unmatched').length,
      ignored:   preview.itens.filter(i => i.status === 'ignored').length,
    }
  }, [preview])

  // Estado indeterminado do checkbox "selecionar todos"
  useEffect(() => {
    if (!checkboxTodosRef.current || !preview) return
    const total = preview.itens.length
    const sel = selecionados.size
    checkboxTodosRef.current.indeterminate = sel > 0 && sel < total
  }, [selecionados, preview])

  const naoEncontradosSelecionados = useMemo(() => {
    if (!preview) return 0
    return preview.itens.filter(
      i => i.status === 'unmatched' && selecionados.has(i.nomeRelatorio)
    ).length
  }, [preview, selecionados])

  const handleArquivo = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setErro('Somente arquivos CSV são aceitos.')
      return
    }
    setArquivoSelecionado(file)
    setErro(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleArquivo(file)
  }

  const processarCsv = async () => {
    if (!arquivoSelecionado) return
    setEtapa('processando')
    setErro(null)
    try {
      const data = await importacaoVendasService.preview(arquivoSelecionado)
      setPreview(data)
      setSelecionados(new Set())
      setEtapa('preview')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { erros?: string[] } } }
      const msg = err?.response?.data?.erros?.[0] ?? 'Erro ao processar o CSV.'
      setErro(msg)
      setEtapa('upload')
    }
  }

  const confirmar = async () => {
    if (!preview || !arquivoSelecionado) return
    setEtapa('confirmando')
    setErro(null)

    const matched = preview.itens.filter(i => i.status === 'matched')
    const resolvidos = preview.itens.filter(i => i.status === 'ambiguous' && !!resolucoes[i.nomeRelatorio])

    const itens = [
      ...matched.map(i => ({ produtoId: i.produtoId!, quantidade: i.quantidade })),
      ...resolvidos.map(i => ({ produtoId: resolucoes[i.nomeRelatorio], quantidade: i.quantidade })),
    ]

    try {
      const res = await importacaoVendasService.confirmar({
        hash: preview.hash,
        nomeArquivo: arquivoSelecionado.name,
        dataVenda,
        periodoDe: preview.periodoDe,
        periodoAte: preview.periodoAte,
        totalLinhasParseadas: preview.totalLinhasParseadas,
        totalIgnoradas: contagens.ignored,
        totalNaoEncontradas: contagens.unmatched,
        itens,
      })

      const itensModal: ItemConfirmacaoImportacao[] = [
        ...matched.map(i => ({
          produtoNome: i.produtoNome ?? i.nomeRelatorio,
          quantidade: i.quantidade,
          valorTotal: i.valorTotal,
        })),
        ...resolvidos.map(i => ({
          produtoNome: i.sugestoes.find(s => s.produtoId === resolucoes[i.nomeRelatorio])?.produtoNome ?? i.nomeRelatorio,
          quantidade: i.quantidade,
          valorTotal: i.valorTotal,
        })),
      ]

      setDadosConfirmacao({
        totalImportadas: res.totalImportadas,
        totalIgnoradas: res.totalIgnoradas,
        totalNaoEncontradas: res.totalNaoEncontradas,
        valorTotal: itensModal.reduce((sum, i) => sum + i.valorTotal, 0),
        dataVenda,
        operador: usuario?.nome ?? '—',
        nomeArquivo: arquivoSelecionado.name,
        itens: itensModal,
      })
      setResultado(res)
      setEtapa('resultado')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { erros?: string[] } } }
      const msg = err?.response?.data?.erros?.[0] ?? 'Erro ao confirmar importação.'
      setErro(msg)
      setEtapa('preview')
    }
  }

  const reiniciar = () => {
    setEtapa('upload')
    setArquivoSelecionado(null)
    setPreview(null)
    setResultado(null)
    setResolucoes({})
    setSelecionados(new Set())
    setErro(null)
    setDadosConfirmacao(null)
  }

  // ── Seleção ──────────────────────────────────────────────────────────────────

  const toggleSelecionado = (nome: string) => {
    setSelecionados(prev => {
      const next = new Set(prev)
      if (next.has(nome)) next.delete(nome)
      else next.add(nome)
      return next
    })
  }

  const toggleTodos = () => {
    if (!preview) return
    const todos = preview.itens.map(i => i.nomeRelatorio)
    if (selecionados.size === preview.itens.length) {
      setSelecionados(new Set())
    } else {
      setSelecionados(new Set(todos))
    }
  }

  // ── Ações em lote ────────────────────────────────────────────────────────────

  const removerSelecionados = () => {
    if (!preview) return
    const nomesRemover = selecionados
    setPreview({
      ...preview,
      itens: preview.itens.filter(i => !nomesRemover.has(i.nomeRelatorio)),
    })
    setResolucoes(prev => {
      const next = { ...prev }
      nomesRemover.forEach(nome => delete next[nome])
      return next
    })
    setSelecionados(new Set())
  }

  const criarProdutosSelecionados = async () => {
    if (!preview) return
    const paraCriar = preview.itens.filter(
      i => i.status === 'unmatched' && selecionados.has(i.nomeRelatorio)
    )
    if (paraCriar.length === 0) return

    setCriandoEmLote(true)
    setErro(null)

    const resultados = await Promise.allSettled(
      paraCriar.map(async item => {
        const produto = await produtosService.criar({
          nome: item.nomeRelatorio,
          precoVenda: precoUnitario(item),
          categoriaProdutoId: null,
        })
        return { item, produto }
      })
    )

    const criados = new Map<string, Produto>()
    resultados.forEach(r => {
      if (r.status === 'fulfilled') criados.set(r.value.item.nomeRelatorio, r.value.produto)
    })

    setPreview({
      ...preview,
      itens: preview.itens.map(item => {
        const prod = criados.get(item.nomeRelatorio)
        return prod
          ? { ...item, status: 'matched' as const, produtoId: prod.id, produtoNome: prod.nome }
          : item
      }),
    })

    setSelecionados(prev => {
      const next = new Set(prev)
      criados.forEach((_, nome) => next.delete(nome))
      return next
    })

    const falhas = resultados.filter(r => r.status === 'rejected').length
    if (falhas > 0)
      setErro(`${falhas} produto(s) não puderam ser criados. Os demais foram criados com sucesso.`)

    setCriandoEmLote(false)
  }

  // ── Ações individuais ────────────────────────────────────────────────────────

  const handleRemoverItem = (item: ItemPreview) => setItemParaRemover(item)

  const confirmarRemocao = () => {
    if (!itemParaRemover || !preview) return
    setPreview({
      ...preview,
      itens: preview.itens.filter(i => i !== itemParaRemover),
    })
    if (resolucoes[itemParaRemover.nomeRelatorio]) {
      setResolucoes(prev => {
        const next = { ...prev }
        delete next[itemParaRemover.nomeRelatorio]
        return next
      })
    }
    setSelecionados(prev => {
      const next = new Set(prev)
      next.delete(itemParaRemover.nomeRelatorio)
      return next
    })
    setItemParaRemover(null)
  }

  const handleProdutoCriado = (produto: Produto) => {
    if (preview && itemParaAdicionar) {
      setPreview({
        ...preview,
        itens: preview.itens.map(item =>
          item === itemParaAdicionar
            ? { ...item, status: 'matched' as const, produtoId: produto.id, produtoNome: produto.nome }
            : item
        ),
      })
    }
    setItemParaAdicionar(null)
  }

  const totalConfirmados = preview
    ? preview.itens.filter(i => i.status === 'matched').length +
      preview.itens.filter(i => i.status === 'ambiguous' && !!resolucoes[i.nomeRelatorio]).length
    : 0

  return (
    <div className="ada-page space-y-6">
      <div>
        <h1
          className="text-xl font-bold tracking-tight"
          style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
        >
          Importar Vendas via CSV
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--ada-muted)' }}>
          Importe o relatório CSV do PDV para lançar vendas em lote.
        </p>
      </div>

      {erro && (
        <div
          className="rounded-lg px-4 py-3 text-sm flex items-start gap-2"
          style={{ background: 'var(--ada-error-bg)', border: '1px solid var(--ada-error-border)', color: '#DC2626' }}
        >
          <XCircleIcon className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{erro}</span>
        </div>
      )}

      {/* Etapa: Upload */}
      {etapa === 'upload' && (
        <div
          className="rounded-xl border p-6 space-y-4"
          style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}
        >
          <div
            className="rounded-xl border-2 border-dashed p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors"
            style={{ borderColor: 'var(--ada-border)', background: 'var(--ada-bg)' }}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
          >
            <ArrowUpTrayIcon className="h-10 w-10" style={{ color: 'var(--ada-placeholder)' }} aria-hidden="true" />
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--ada-heading)' }}>
                {arquivoSelecionado ? arquivoSelecionado.name : 'Clique ou arraste o CSV aqui'}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--ada-muted)' }}>
                Apenas arquivos CSV · Máximo 10 MB
              </p>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={e => { if (e.target.files?.[0]) handleArquivo(e.target.files[0]) }}
          />
          <button
            onClick={processarCsv}
            disabled={!arquivoSelecionado}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-40"
            style={{ background: 'var(--sb-accent)' }}
          >
            Processar CSV
          </button>
        </div>
      )}

      {/* Etapa: Processando */}
      {etapa === 'processando' && (
        <div
          className="rounded-xl border p-12 flex flex-col items-center gap-3"
          style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}
        >
          <div
            className="h-8 w-8 animate-spin rounded-full"
            style={{ border: '3px solid var(--ada-border-sub)', borderTopColor: '#C4870A' }}
            role="status"
          />
          <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>Extraindo e casando produtos…</p>
        </div>
      )}

      {/* Etapa: Preview */}
      {(etapa === 'preview' || etapa === 'confirmando') && preview && (
        <div className="space-y-6">
          {/* Sumário de contagens */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Encontrados',     value: contagens.matched,   cor: '#15803D', bg: 'var(--ada-success-bg)', border: 'var(--ada-success-border)' },
              { label: 'Ambíguos',        value: contagens.ambiguous, cor: '#B45309', bg: 'var(--ada-warning-bg)', border: 'var(--ada-warning-border)' },
              { label: 'Não encontrados', value: contagens.unmatched, cor: '#DC2626', bg: 'var(--ada-error-bg)',   border: 'var(--ada-error-border)'   },
              { label: 'Ignorados',       value: contagens.ignored,   cor: 'var(--ada-muted)', bg: 'var(--ada-surface-2)', border: 'var(--ada-border)' },
            ].map(c => (
              <div key={c.label} className="rounded-xl p-4 flex flex-col gap-1" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                <span className="text-2xl font-bold" style={{ color: c.cor }}>{c.value}</span>
                <span className="text-xs" style={{ color: 'var(--ada-muted)' }}>{c.label}</span>
              </div>
            ))}
          </div>

          {/* Barra de ações em lote — visível quando há seleção */}
          {selecionados.size > 0 && (
            <div
              className="rounded-xl px-4 py-3 flex flex-wrap items-center gap-3"
              style={{ background: 'var(--ada-surface)', border: '1px solid var(--ada-border)' }}
            >
              <span className="text-sm font-medium" style={{ color: 'var(--ada-heading)' }}>
                {selecionados.size} {selecionados.size === 1 ? 'item selecionado' : 'itens selecionados'}
              </span>

              <div className="flex gap-2 ml-auto flex-wrap">
                <button
                  type="button"
                  onClick={removerSelecionados}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                  style={{ background: 'var(--ada-error-bg)', borderColor: 'var(--ada-error-border)', color: '#DC2626' }}
                >
                  <TrashIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  Remover {selecionados.size} {selecionados.size === 1 ? 'item' : 'itens'}
                </button>

                {naoEncontradosSelecionados > 0 && (
                  <button
                    type="button"
                    onClick={criarProdutosSelecionados}
                    disabled={criandoEmLote}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50"
                    style={{ background: 'var(--ada-surface-2)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)' }}
                  >
                    {criandoEmLote ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full inline-block" style={{ border: '2px solid var(--ada-border)', borderTopColor: '#C4870A' }} />
                        Criando…
                      </>
                    ) : (
                      <>
                        <PlusCircleIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        Criar {naoEncontradosSelecionados} produto{naoEncontradosSelecionados !== 1 ? 's' : ''} não encontrado{naoEncontradosSelecionados !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tabela */}
          <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--ada-border)', background: 'var(--ada-surface-2)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}>
                {preview.itens.length} linhas
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--ada-border)', background: 'var(--ada-surface-2)' }}>
                    {/* Checkbox selecionar todos */}
                    <th className="pl-4 pr-2 py-2.5 w-8">
                      <input
                        ref={checkboxTodosRef}
                        type="checkbox"
                        aria-label="Selecionar todos"
                        checked={selecionados.size === preview.itens.length && preview.itens.length > 0}
                        onChange={toggleTodos}
                        className="rounded"
                        style={{ accentColor: '#C4870A', cursor: 'pointer' }}
                      />
                    </th>
                    {['Status', 'Nome no Relatório', 'Produto no Sistema', 'Qtd.', 'Total Venda', 'Ações'].map(h => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-xs font-semibold"
                        style={{
                          color: 'var(--ada-muted)',
                          textAlign: ['Qtd.', 'Total Venda'].includes(h) ? 'right' : 'left',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.itens.map((item, idx) => (
                    <PreviewRow
                      key={idx}
                      item={item}
                      selecionado={selecionados.has(item.nomeRelatorio)}
                      onToggle={() => toggleSelecionado(item.nomeRelatorio)}
                      resolucao={resolucoes[item.nomeRelatorio] ?? ''}
                      onResolucao={pid => setResolucoes(prev => ({ ...prev, [item.nomeRelatorio]: pid }))}
                      onAdicionar={() => setItemParaAdicionar(item)}
                      onRemover={() => handleRemoverItem(item)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rodapé: data + botões */}
          <div
            className="rounded-xl border p-5 flex flex-col sm:flex-row sm:items-end gap-4"
            style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}
          >
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-text)' }}>
                Data dos lançamentos
              </label>
              <input
                type="date"
                value={dataVenda}
                onChange={e => setDataVenda(e.target.value)}
                className="rounded-lg px-3 py-2 text-sm border outline-none"
                style={{ background: 'var(--ada-bg)', borderColor: 'var(--ada-border)', color: 'var(--ada-text)' }}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--ada-muted)' }}>
                Todos os itens importados usarão esta data.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={reiniciar}
                className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
                style={{ borderColor: 'var(--ada-border)', color: 'var(--ada-text)', background: 'var(--ada-bg)' }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmar}
                disabled={etapa === 'confirmando' || totalConfirmados === 0}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                style={{ background: 'var(--sb-accent)' }}
              >
                {etapa === 'confirmando' ? 'Importando…' : `Confirmar ${totalConfirmados} venda${totalConfirmados !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Etapa: Resultado — tratado pelo modal abaixo */}
      {etapa === 'resultado' && resultado && null}

      {/* Modal: cadastro rápido de produto */}
      {itemParaAdicionar && (
        <QuickCreateProductModal
          nomeInicial={itemParaAdicionar.nomeRelatorio}
          precoInicial={precoUnitario(itemParaAdicionar) || undefined}
          onSalvo={handleProdutoCriado}
          onFechar={() => setItemParaAdicionar(null)}
        />
      )}

      {/* Dialog: confirmação de remoção de linha */}
      {itemParaRemover && (
        <ConfirmRemoveDialog
          nomeItem={itemParaRemover.nomeRelatorio}
          onConfirmar={confirmarRemocao}
          onCancelar={() => setItemParaRemover(null)}
        />
      )}

      {/* Modal: confirmação de importação concluída */}
      {dadosConfirmacao && (
        <ConfirmacaoImportacaoModal
          aberto
          dados={dadosConfirmacao}
          onFechar={reiniciar}
          onVerRelatorio={() => { setDadosConfirmacao(null); navigate('/producao/vendas') }}
        />
      )}
    </div>
  )
}

// ─── PreviewRow ─────────────────────────────────────────────────────────────

function PreviewRow({
  item,
  selecionado,
  onToggle,
  resolucao,
  onResolucao,
  onAdicionar,
  onRemover,
}: {
  item: ItemPreview
  selecionado: boolean
  onToggle: () => void
  resolucao: string
  onResolucao: (pid: string) => void
  onAdicionar: () => void
  onRemover: () => void
}) {
  const cfg = STATUS_CFG[item.status]
  const { Icon } = cfg

  return (
    <tr
      style={{
        borderBottom: '1px solid var(--ada-border-sub)',
        background: selecionado ? 'var(--ada-surface-2)' : undefined,
      }}
    >
      {/* Checkbox */}
      <td className="pl-4 pr-2 py-2.5 w-8">
        <input
          type="checkbox"
          checked={selecionado}
          onChange={onToggle}
          aria-label={`Selecionar ${item.nomeRelatorio}`}
          className="rounded"
          style={{ accentColor: '#C4870A', cursor: 'pointer' }}
        />
      </td>

      {/* Status */}
      <td className="px-4 py-2.5">
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
          style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.cor }}
        >
          <Icon className="h-3 w-3" aria-hidden="true" />
          {cfg.label}
        </span>
      </td>

      {/* Nome no relatório */}
      <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--ada-body)' }}>
        {item.codigoExterno && (
          <span className="mr-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--ada-surface-2)', color: 'var(--ada-muted)' }}>
            {item.codigoExterno}
          </span>
        )}
        {item.nomeRelatorio}
      </td>

      {/* Produto no sistema */}
      <td className="px-4 py-2.5 text-xs">
        {item.status === 'matched' && <span style={{ color: '#15803D' }}>{item.produtoNome}</span>}
        {item.status === 'ambiguous' && (
          <select
            value={resolucao}
            onChange={e => onResolucao(e.target.value)}
            className="rounded-lg px-2 py-1 text-xs border outline-none"
            style={{ background: 'var(--ada-bg)', borderColor: 'var(--ada-warning-border)', color: 'var(--ada-text)' }}
          >
            <option value="">Selecione o produto…</option>
            {item.sugestoes.map(s => (
              <option key={s.produtoId} value={s.produtoId}>{s.produtoNome}</option>
            ))}
          </select>
        )}
        {item.status === 'unmatched' && <span style={{ color: 'var(--ada-muted)' }}>—</span>}
        {item.status === 'ignored' && <span style={{ color: 'var(--ada-muted)', fontStyle: 'italic' }}>item ignorado</span>}
      </td>

      {/* Qtd. */}
      <td className="px-4 py-2.5 text-right text-xs font-mono" style={{ color: 'var(--ada-body)' }}>
        {item.quantidade.toLocaleString('pt-BR')}
      </td>

      {/* Total Venda */}
      <td className="px-4 py-2.5 text-right text-xs font-mono" style={{ color: 'var(--ada-body)' }}>
        {item.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </td>

      {/* Ações */}
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onAdicionar}
            title="Adicionar produto"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#C4870A]/40"
            style={{
              background: 'var(--ada-surface-2)',
              borderColor: 'var(--ada-border)',
              color: 'var(--ada-body)',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--ada-bg)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--ada-surface-2)'}
          >
            <PlusCircleIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Adicionar</span>
          </button>

          <button
            type="button"
            onClick={onRemover}
            title="Remover da lista"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
            style={{
              background: 'var(--ada-surface-2)',
              borderColor: 'var(--ada-border)',
              color: '#DC2626',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--ada-error-bg)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--ada-surface-2)'}
          >
            <TrashIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Remover</span>
          </button>
        </div>
      </td>
    </tr>
  )
}
