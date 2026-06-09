import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { PrinterIcon } from '@heroicons/react/24/outline'
import { produtosService } from '@/features/producao/produtos/services/produtosService'
import { ingredientesService } from '@/features/estoque/ingredientes/services/ingredientesService'
import { etiquetasService, type TipoEtiqueta, type HistoricoImpressao, type ModeloNutricional, type ModeloNutricionalResumo } from '@/lib/etiquetasService'
import { ModelosNutricionaisTable } from '../components/ModelosNutricionaisTable'
import { HistoricoImpressoesTable } from '../components/HistoricoImpressoesTable'
import type { Produto, ProdutoResumo } from '@/types/producao'
import type { IngredienteResumo } from '@/types/estoque'
import {
  imprimirEtiquetaHtml,
  htmlEtiquetaCompleta,
  htmlEtiquetaSimples,
  htmlEtiquetaNutricional,
  type NutriValues,
} from '../utils/etiquetaUtils'

// ─── Helpers ────────────────────────────────────────────────────────────────

// Formata datas vindas de input[type=date] (YYYY-MM-DD) sem conversão de timezone
function formatarDataLocal(yyyymmdd: string): string {
  const [year, month, day] = yyyymmdd.split('-')
  return `${day}/${month}/${year}`
}

const TIPO_LABELS: Record<TipoEtiqueta, string> = {
  1: 'Completa',
  2: 'Simples',
  3: 'Nutricional',
}


function parseValorNutricional(value: string): number {
  const match = value.trim().replace(',', '.').match(/-?\d+(?:\.\d+)?/)
  const parsed = match ? Number(match[0]) : 0
  return Number.isFinite(parsed) ? parsed : 0
}

function sanitizeVdInput(value: string): string {
  return value.replace(/[^\d.,]/g, '')
}

const CAMPOS_VD_VAZIOS = {
  vdValorEnergetico: '',
  vdCarboidratos: '',
  vdAcucaresAdicionados: '',
  vdProteinas: '',
  vdGordurasTotais: '',
  vdGordurasSaturadas: '',
  vdGordurasTrans: '',
  vdFibraAlimentar: '',
  vdSodio: '',
}

function parsePorcoesPorEmbalagem(value: string): number | null {
  const parsed = Number(value.trim().replace(',', '.'))
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function obterMensagemErroApi(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback

  const data = error.response?.data as { erros?: string[]; mensagem?: string; message?: string } | undefined
  if (data?.erros?.length) return data.erros.join(' ')
  return data?.mensagem ?? data?.message ?? fallback
}

// ─── Prévia das etiquetas ────────────────────────────────────────────────────

// CSS renderiza 1mm = 96/25.4px. Usamos isso para dar à prévia o tamanho real
// da etiqueta em pixels e então escalar para caber no container.
const MM_TO_PX = 96 / 25.4

const LABEL_DIMS_MM: Record<TipoEtiqueta, { largura: number; altura: number }> = {
  1: { largura: 100, altura: 50 },
  2: { largura: 70, altura: 40 },
  3: { largura: 70, altura: 130 },
}

interface LabelPreviewProps {
  html: string | null
  width: number
  height: number
  scale: number
}

// Renderiza exatamente o mesmo HTML usado na impressão, escalado para caber no
// container. Assim a prévia nunca diverge do que é efetivamente impresso.
function LabelPreview({ html, width, height, scale }: LabelPreviewProps) {
  if (!html) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border-2 border-dashed"
        style={{ borderColor: 'var(--ada-border)', minHeight: 200, minWidth: 200 }}
      >
        <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>
          Selecione um item para ver a prévia
        </p>
      </div>
    )
  }

  return (
    <iframe
      srcDoc={html}
      title="Prévia da etiqueta"
      scrolling="no"
      style={{
        width,
        height,
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        border: '1.5px solid #aaa',
        borderRadius: 2,
        background: '#fff',
        boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
      }}
    />
  )
}

// ─── Componente principal ────────────────────────────────────────────────────

export function EtiquetasPage() {
  const [tipoItem, setTipoItem] = useState<'produto' | 'ingrediente'>('produto')
  const [produtos, setProdutos] = useState<ProdutoResumo[]>([])
  const [produtoId, setProdutoId] = useState('')
  const [produtoDetalhe, setProdutoDetalhe] = useState<Produto | null>(null)
  const [ingredientes, setIngredientes] = useState<IngredienteResumo[]>([])
  const [ingredienteId, setIngredienteId] = useState('')
  const [tipo, setTipo] = useState<TipoEtiqueta>(1)
  const [dataProducao, setDataProducao] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [dataValidade, setDataValidade] = useState('')
  const [quantidade, setQuantidade] = useState(1)
  const [historico, setHistorico] = useState<HistoricoImpressao[]>([])
  const [imprimindo, setImprimindo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [modeloNutricional, setModeloNutricional] = useState<ModeloNutricional | null>(null)
  const [modelosDisponiveis, setModelosDisponiveis] = useState<ModeloNutricionalResumo[]>([])
  const [salvandoModelo, setSalvandoModelo] = useState(false)
  const [modeloSalvo, setModeloSalvo] = useState(false)
  const [logoBase64, setLogoBase64] = useState('')
  const [nutri, setNutri] = useState({
    nome: '',
    porcao: '100g',
    medidaCaseira: '',
    porcoesPorEmbalagem: '',
    valorEnergeticoKcal: '',
    valorEnergeticoKJ: '',
    carboidratos: '',
    acucaresTotais: '',
    acucaresAdicionados: '',
    proteinas: '',
    gordurasTotais: '',
    gordurasSaturadas: '',
    gordurasTrans: '',
    fibraAlimentar: '',
    sodio: '',
    ...CAMPOS_VD_VAZIOS,
    alergicoAlimentar: '',
    contemGluten: false,
    contemLactose: false,
    loteFabricacao: '',
    ingredientes: '',
  })

  const produto = produtoDetalhe

  const previewContainerRef = useRef<HTMLDivElement>(null)
  const [previewBox, setPreviewBox] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = previewContainerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      setPreviewBox({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    produtosService.listar().then(lista => {
      setProdutos(lista)
      if (lista.length > 0) setProdutoId(lista[0].id)
    }).catch(() => {})
    etiquetasService.listarHistorico().then(setHistorico).catch(() => {})
    etiquetasService.listarModelosNutricionais().then(setModelosDisponiveis).catch(() => {})
    ingredientesService.listar().then(lista => {
      setIngredientes(lista)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/images/image.png')
      .then(r => r.blob())
      .then(blob => new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve((reader.result as string).split(',')[1])
        reader.readAsDataURL(blob)
      }))
      .then(setLogoBase64)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!produtoId) { setProdutoDetalhe(null); return }
    produtosService.obterPorId(produtoId).then(setProdutoDetalhe).catch(() => setProdutoDetalhe(null))
  }, [produtoId])

  useEffect(() => {
    if (!produtoId || tipo !== 3) return
    etiquetasService.obterModeloNutricional(produtoId)
      .then(modelo => {
        setModeloNutricional(modelo)
        if (modelo) {
          setNutri({
            nome: modelo.nome ?? '',
            porcao: modelo.porcao,
            medidaCaseira: modelo.medidaCaseira ?? '',
            porcoesPorEmbalagem: modelo.porcoesPorEmbalagem != null ? String(modelo.porcoesPorEmbalagem) : '',
            valorEnergeticoKcal: String(modelo.valorEnergeticoKcal),
            valorEnergeticoKJ: String(modelo.valorEnergeticoKJ),
            carboidratos: String(modelo.carboidratos),
            acucaresTotais: String(modelo.acucaresTotais),
            acucaresAdicionados: String(modelo.acucaresAdicionados),
            proteinas: String(modelo.proteinas),
            gordurasTotais: String(modelo.gordurasTotais),
            gordurasSaturadas: String(modelo.gordurasSaturadas),
            gordurasTrans: String(modelo.gordurasTrans),
            fibraAlimentar: String(modelo.fibraAlimentar),
            sodio: String(modelo.sodio),
            vdValorEnergetico: modelo.vdValorEnergetico ?? '',
            vdCarboidratos: modelo.vdCarboidratos ?? '',
            vdAcucaresAdicionados: modelo.vdAcucaresAdicionados ?? '',
            vdProteinas: modelo.vdProteinas ?? '',
            vdGordurasTotais: modelo.vdGordurasTotais ?? '',
            vdGordurasSaturadas: modelo.vdGordurasSaturadas ?? '',
            vdGordurasTrans: modelo.vdGordurasTrans ?? '',
            vdFibraAlimentar: modelo.vdFibraAlimentar ?? '',
            vdSodio: modelo.vdSodio ?? '',
            alergicoAlimentar: modelo.alergicoAlimentar ?? '',
            contemGluten: modelo.contemGluten,
            contemLactose: modelo.contemLactose,
            loteFabricacao: modelo.loteFabricacao ?? '',
            ingredientes: modelo.ingredientes ?? '',
          })
        } else {
          setNutri({ nome: '', porcao: '100g', medidaCaseira: '', porcoesPorEmbalagem: '', valorEnergeticoKcal: '', valorEnergeticoKJ: '', carboidratos: '', acucaresTotais: '', acucaresAdicionados: '', proteinas: '', gordurasTotais: '', gordurasSaturadas: '', gordurasTrans: '', fibraAlimentar: '', sodio: '', ...CAMPOS_VD_VAZIOS, alergicoAlimentar: '', contemGluten: false, contemLactose: false, loteFabricacao: '', ingredientes: '' })
        }
      })
      .catch(() => {})
  }, [produtoId, tipo])

  const montarNutriValues = (): NutriValues => ({
    porcao: nutri.porcao || '100g',
    kcal: nutri.valorEnergeticoKcal || '-',
    kj: nutri.valorEnergeticoKJ || '-',
    carbo: nutri.carboidratos || '-',
    acucares: nutri.acucaresTotais || '-',
    acucaresAdic: nutri.acucaresAdicionados || '-',
    proteinas: nutri.proteinas || '-',
    gorduras: nutri.gordurasTotais || '-',
    gordSat: nutri.gordurasSaturadas || '-',
    gordTrans: nutri.gordurasTrans || '-',
    fibra: nutri.fibraAlimentar || '-',
    sodio: nutri.sodio || '-',
    porcoesPorEmbalagem: nutri.porcoesPorEmbalagem || '',
    medidaCaseira: nutri.medidaCaseira || '',
    vdValorEnergetico: nutri.vdValorEnergetico,
    vdCarboidratos: nutri.vdCarboidratos,
    vdAcucaresAdicionados: nutri.vdAcucaresAdicionados,
    vdProteinas: nutri.vdProteinas,
    vdGordurasTotais: nutri.vdGordurasTotais,
    vdGordurasSaturadas: nutri.vdGordurasSaturadas,
    vdGordurasTrans: nutri.vdGordurasTrans,
    vdFibraAlimentar: nutri.vdFibraAlimentar,
    vdSodio: nutri.vdSodio,
    alergicoAlimentar: nutri.alergicoAlimentar,
    contemGluten: nutri.contemGluten,
    contemLactose: nutri.contemLactose,
    loteFabricacao: nutri.loteFabricacao,
    ingredientes: nutri.ingredientes,
  })

  const registrarImpressaoProduto = async () => {
    if (!produto) return

    const novo = await etiquetasService.registrarImpressao({
      produtoId: produto.id,
      tipoEtiqueta: tipo,
      quantidade,
      dataProducao,
    })
    setHistorico(prev => [novo, ...prev])
  }

  const handleImprimir = async () => {
    const isIngrediente = tipoItem === 'ingrediente'
    const nomeParaImpressao = isIngrediente
      ? ingredientes.find(i => i.id === ingredienteId)?.nome ?? ''
      : produto?.nome ?? ''

    if (!nomeParaImpressao) return
    setImprimindo(true)
    setErro(null)

    if (!dataValidade) {
      setErro('Informe a data de validade.')
      setImprimindo(false)
      return
    }

    try {
      const validadePtBr = formatarDataLocal(dataValidade)
      const dataPtBr = formatarDataLocal(dataProducao)

      let html = ''
      if (isIngrediente || tipo === 2) {
        html = htmlEtiquetaSimples(nomeParaImpressao, validadePtBr, quantidade)
      } else if (tipo === 1) {
        html = htmlEtiquetaCompleta(nomeParaImpressao, dataPtBr, validadePtBr, quantidade, logoBase64)
      } else {
        html = htmlEtiquetaNutricional(
          nomeParaImpressao,
          dataPtBr,
          validadePtBr,
          quantidade,
          montarNutriValues(),
        )
      }

      if (html) imprimirEtiquetaHtml(html)

      if (!isIngrediente) await registrarImpressaoProduto()
    } catch {
      setErro('Erro ao registrar impressão. A etiqueta pode ter sido impressa mesmo assim.')
    } finally {
      setImprimindo(false)
    }
  }

  const handleSalvarModelo = async () => {
    if (!produto) return
    setSalvandoModelo(true)
    setModeloSalvo(false)
    setErro(null)
    try {
      const modeloAtualizado = await etiquetasService.salvarModeloNutricional(produto.id, {
        porcao: nutri.porcao || '100g',
        valorEnergeticoKcal: parseValorNutricional(nutri.valorEnergeticoKcal),
        valorEnergeticoKJ: parseValorNutricional(nutri.valorEnergeticoKJ),
        carboidratos: parseValorNutricional(nutri.carboidratos),
        acucaresTotais: parseValorNutricional(nutri.acucaresTotais),
        acucaresAdicionados: parseValorNutricional(nutri.acucaresAdicionados),
        proteinas: parseValorNutricional(nutri.proteinas),
        gordurasTotais: parseValorNutricional(nutri.gordurasTotais),
        gordurasSaturadas: parseValorNutricional(nutri.gordurasSaturadas),
        gordurasTrans: parseValorNutricional(nutri.gordurasTrans),
        fibraAlimentar: parseValorNutricional(nutri.fibraAlimentar),
        sodio: parseValorNutricional(nutri.sodio),
        porcoesPorEmbalagem: parsePorcoesPorEmbalagem(nutri.porcoesPorEmbalagem),
        medidaCaseira: nutri.medidaCaseira || null,
        vdValorEnergetico: nutri.vdValorEnergetico || null,
        vdCarboidratos: nutri.vdCarboidratos || null,
        vdAcucaresAdicionados: nutri.vdAcucaresAdicionados || null,
        vdProteinas: nutri.vdProteinas || null,
        vdGordurasTotais: nutri.vdGordurasTotais || null,
        vdGordurasSaturadas: nutri.vdGordurasSaturadas || null,
        vdGordurasTrans: nutri.vdGordurasTrans || null,
        vdFibraAlimentar: nutri.vdFibraAlimentar || null,
        vdSodio: nutri.vdSodio || null,
        nome: nutri.nome || null,
        alergicoAlimentar: nutri.alergicoAlimentar || null,
        contemGluten: nutri.contemGluten,
        contemLactose: nutri.contemLactose,
        loteFabricacao: nutri.loteFabricacao || null,
        ingredientes: nutri.ingredientes || null,
      })
      setModeloNutricional(modeloAtualizado)
      setModeloSalvo(true)
      setTimeout(() => setModeloSalvo(false), 3000)
      etiquetasService.listarModelosNutricionais().then(setModelosDisponiveis).catch(() => {})
    } catch (error) {
      setErro(obterMensagemErroApi(error, 'Erro ao salvar modelo nutricional.'))
    } finally {
      setSalvandoModelo(false)
    }
  }

  const handleRenomear = async (produtoId: string, nome: string | null) => {
    await etiquetasService.renomearModelo(produtoId, nome)
    etiquetasService.listarModelosNutricionais().then(setModelosDisponiveis).catch(() => {})
  }

  const handleExcluir = async (produtoId: string) => {
    await etiquetasService.excluirModelo(produtoId)
    etiquetasService.listarModelosNutricionais().then(setModelosDisponiveis).catch(() => {})
  }

  const tiposOpcoes: { valor: TipoEtiqueta; label: string; desc: string; dim: string }[] = [
    { valor: 1, label: 'Completa', desc: 'Logo + Nome + Validade', dim: '100×50mm' },
    { valor: 2, label: 'Simples', desc: 'Nome + Validade', dim: '70×40mm' },
    { valor: 3, label: 'Nutricional', desc: 'Tabela Nutricional', dim: '70×130mm' },
  ]

  // ── Prévia: gera o mesmo HTML da impressão (1 cópia) e o escala para caber ──
  const previewTipo: TipoEtiqueta = tipoItem === 'ingrediente' ? 2 : tipo
  const nomePreview =
    tipoItem === 'ingrediente'
      ? ingredientes.find(i => i.id === ingredienteId)?.nome ?? null
      : produto?.nome ?? null

  const previewHtml = ((): string | null => {
    if (!nomePreview) return null
    const validade = dataValidade ? formatarDataLocal(dataValidade) : '—'
    const dataPtBr = formatarDataLocal(dataProducao)
    if (previewTipo === 1) return htmlEtiquetaCompleta(nomePreview, dataPtBr, validade, 1, logoBase64)
    if (previewTipo === 2) return htmlEtiquetaSimples(nomePreview, validade, 1)
    return htmlEtiquetaNutricional(nomePreview, dataPtBr, validade, 1, montarNutriValues())
  })()

  const previewDims = LABEL_DIMS_MM[previewTipo]
  const previewWidth = previewDims.largura * MM_TO_PX
  const previewHeight = previewDims.altura * MM_TO_PX
  const previewScale = ((): number => {
    const padding = 32 // respiro dentro do container
    const fit = Math.min(
      1,
      (previewBox.width - padding) / previewWidth,
      (previewBox.height - padding) / previewHeight,
    )
    return Number.isFinite(fit) && fit > 0 ? fit : 1
  })()

  return (
    <div className="ada-page space-y-6">
      <div>
        <h1
          className="text-xl font-bold tracking-tight"
          style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
        >
          Etiquetas
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--ada-muted)' }}>
          Gere e imprima etiquetas térmicas para os produtos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Configuração ── */}
        <div
          className="rounded-xl border p-6 space-y-5"
          style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}
          >
            Configurar Impressão
          </p>

          {/* Toggle Produto / Ingrediente */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-body)' }}>
              Tipo de Item
            </label>
            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--ada-border)' }}>
              {(['produto', 'ingrediente'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTipoItem(t)
                    if (t === 'ingrediente') {
                      setTipo(2)
                      const ativos = ingredientes.filter(i => i.ativo)
                      if (ativos.length > 0) setIngredienteId(ativos[0].id)
                    } else {
                      if (produtos.length > 0) setProdutoId(p => p || produtos[0].id)
                    }
                  }}
                  className="flex-1 py-2 text-sm font-medium transition-colors"
                  style={{
                    background: tipoItem === t ? 'var(--sb-accent)' : 'var(--ada-bg)',
                    color: tipoItem === t ? '#fff' : 'var(--ada-body)',
                  }}
                >
                  {t === 'produto' ? 'Produto' : 'Ingrediente'}
                </button>
              ))}
            </div>
          </div>

          {/* Seletor de produto ou ingrediente */}
          {tipoItem === 'produto' ? (
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-body)' }}>
                Produto <span className="text-red-500">*</span>
              </label>
              <select
                value={produtoId}
                onChange={e => setProdutoId(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none"
                style={{
                  background: 'var(--ada-bg)',
                  borderColor: 'var(--ada-border)',
                  color: 'var(--ada-body)',
                }}
              >
                <option value="">Selecione um produto...</option>
                {produtos.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-body)' }}>
                Ingrediente <span className="text-red-500">*</span>
              </label>
              <select
                value={ingredienteId}
                onChange={e => setIngredienteId(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none"
                style={{
                  background: 'var(--ada-bg)',
                  borderColor: 'var(--ada-border)',
                  color: 'var(--ada-body)',
                }}
              >
                <option value="">Selecione um ingrediente...</option>
                {ingredientes.filter(i => i.ativo).map(i => (
                  <option key={i.id} value={i.id}>{i.nome}</option>
                ))}
              </select>
            </div>
          )}

          {/* Tipo de etiqueta — só disponível para produtos */}
          {tipoItem === 'produto' && (
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-body)' }}>
                Tipo de Etiqueta
              </label>
              <div className="grid grid-cols-3 gap-2">
                {tiposOpcoes.map(op => (
                  <button
                    key={op.valor}
                    type="button"
                    onClick={() => setTipo(op.valor)}
                    className="rounded-lg border p-2.5 text-left transition-colors"
                    style={{
                      background: tipo === op.valor ? 'var(--sb-accent)' : 'var(--ada-bg)',
                      borderColor: tipo === op.valor ? 'var(--sb-accent)' : 'var(--ada-border)',
                      color: tipo === op.valor ? '#fff' : 'var(--ada-body)',
                    }}
                  >
                    <div className="text-xs font-semibold">{op.label}</div>
                    <div className="text-[10px] mt-0.5 opacity-75">{op.dim}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dados nutricionais — só aparece quando tipo = Nutricional */}
          {tipo === 3 && (
            <div
              className="rounded-lg border p-4 space-y-3"
              style={{ borderColor: 'var(--ada-border)', background: 'var(--ada-bg)' }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--ada-muted)' }}>
                  Tabela Nutricional
                </p>
                {modeloNutricional && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--ada-hover)', color: 'var(--ada-muted)' }}>
                    Modelo salvo
                  </span>
                )}
              </div>

              {modelosDisponiveis.filter(m => m.produtoId !== produtoId).length > 0 && (
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ada-body)' }}>
                    Carregar de modelo salvo
                  </label>
                  <select
                    value=""
                    onChange={e => {
                      const m = modelosDisponiveis.find(x => x.id === e.target.value)
                      if (!m) return
                      setNutri({
                        nome: m.nome ?? '',
                        porcao: m.porcao,
                        medidaCaseira: m.medidaCaseira ?? '',
                        porcoesPorEmbalagem: m.porcoesPorEmbalagem != null ? String(m.porcoesPorEmbalagem) : '',
                        valorEnergeticoKcal: String(m.valorEnergeticoKcal),
                        valorEnergeticoKJ: String(m.valorEnergeticoKJ),
                        carboidratos: String(m.carboidratos),
                        acucaresTotais: String(m.acucaresTotais),
                        acucaresAdicionados: String(m.acucaresAdicionados),
                        proteinas: String(m.proteinas),
                        gordurasTotais: String(m.gordurasTotais),
                        gordurasSaturadas: String(m.gordurasSaturadas),
                        gordurasTrans: String(m.gordurasTrans),
                        fibraAlimentar: String(m.fibraAlimentar),
                        sodio: String(m.sodio),
                        vdValorEnergetico: m.vdValorEnergetico ?? '',
                        vdCarboidratos: m.vdCarboidratos ?? '',
                        vdAcucaresAdicionados: m.vdAcucaresAdicionados ?? '',
                        vdProteinas: m.vdProteinas ?? '',
                        vdGordurasTotais: m.vdGordurasTotais ?? '',
                        vdGordurasSaturadas: m.vdGordurasSaturadas ?? '',
                        vdGordurasTrans: m.vdGordurasTrans ?? '',
                        vdFibraAlimentar: m.vdFibraAlimentar ?? '',
                        vdSodio: m.vdSodio ?? '',
                        alergicoAlimentar: m.alergicoAlimentar ?? '',
                        contemGluten: m.contemGluten,
                        contemLactose: m.contemLactose,
                        loteFabricacao: m.loteFabricacao ?? '',
                        ingredientes: m.ingredientes ?? '',
                      })
                    }}
                    className="w-full rounded-lg px-3 py-2 text-sm border outline-none"
                    style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)' }}
                  >
                    <option value="">Selecione um modelo...</option>
                    {modelosDisponiveis
                      .filter(m => m.produtoId !== produtoId)
                      .map(m => (
                        <option key={m.id} value={m.id}>{m.produtoNome}</option>
                      ))
                    }
                  </select>
                </div>
              )}

              {/* Nome do modelo */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ada-body)' }}>Nome do modelo</label>
                <input
                  type="text"
                  placeholder={produto?.nome ?? 'Ex: Bolo de Cenoura 50g'}
                  value={nutri.nome}
                  onChange={e => setNutri(n => ({ ...n, nome: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 text-sm border outline-none"
                  style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)' }}
                />
              </div>

              {/* Porção */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ada-body)' }}>Porção</label>
                  <input
                    type="text"
                    placeholder="Ex: 50g"
                    value={nutri.porcao}
                    onChange={e => setNutri(n => ({ ...n, porcao: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2 text-sm border outline-none"
                    style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ada-body)' }}>Medida caseira</label>
                  <input
                    type="text"
                    placeholder="Ex: 1 fatia"
                    value={nutri.medidaCaseira}
                    onChange={e => setNutri(n => ({ ...n, medidaCaseira: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2 text-sm border outline-none"
                    style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)' }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ada-body)' }}>
                  Porções por embalagem
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ex: 10"
                  value={nutri.porcoesPorEmbalagem}
                  onChange={e => setNutri(n => ({ ...n, porcoesPorEmbalagem: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 text-sm border outline-none"
                  style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)' }}
                />
              </div>

              {/* Grid 2 colunas para os campos numéricos */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'valorEnergeticoKcal', label: 'Valor energético', unit: 'kcal' },
                  { key: 'carboidratos', label: 'Carboidratos', unit: 'g' },
                  { key: 'acucaresTotais', label: 'Açúcares totais', unit: 'g' },
                  { key: 'acucaresAdicionados', label: 'Açúcares adicionados', unit: 'g' },
                  { key: 'proteinas', label: 'Proteínas', unit: 'g' },
                  { key: 'gordurasTotais', label: 'Gorduras totais', unit: 'g' },
                  { key: 'gordurasSaturadas', label: 'Gord. saturadas', unit: 'g' },
                  { key: 'gordurasTrans', label: 'Gorduras trans', unit: 'g' },
                  { key: 'fibraAlimentar', label: 'Fibra alimentar', unit: 'g' },
                  { key: 'sodio', label: 'Sódio', unit: 'mg' },
                ].map(({ key, label, unit }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ada-body)' }}>
                      {label} <span className="font-normal" style={{ color: 'var(--ada-muted)' }}>({unit})</span>
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={nutri[key as keyof typeof nutri] as string}
                      onChange={e => setNutri(n => ({ ...n, [key]: e.target.value }))}
                      className="w-full rounded-lg px-3 py-2 text-sm border outline-none"
                      style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)' }}
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--ada-muted)' }}>
                  %VD manual
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'vdValorEnergetico', label: 'Valor energético' },
                    { key: 'vdCarboidratos', label: 'Carboidratos' },
                    { key: 'vdAcucaresAdicionados', label: 'Açúcares adicionados' },
                    { key: 'vdProteinas', label: 'Proteínas' },
                    { key: 'vdGordurasTotais', label: 'Gorduras totais' },
                    { key: 'vdGordurasSaturadas', label: 'Gord. saturadas' },
                    { key: 'vdGordurasTrans', label: 'Gorduras trans' },
                    { key: 'vdFibraAlimentar', label: 'Fibra alimentar' },
                    { key: 'vdSodio', label: 'Sódio' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ada-body)' }}>
                        {label}
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={nutri[key as keyof typeof nutri] as string}
                        onChange={e => setNutri(n => ({ ...n, [key]: sanitizeVdInput(e.target.value) }))}
                        className="w-full rounded-lg px-3 py-2 text-sm border outline-none"
                        style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Ingredientes */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--ada-muted)' }}>
                  Ingredientes
                </p>
                <textarea
                  rows={3}
                  placeholder="Ex: Farinha de trigo, açúcar, ovos, manteiga, fermento..."
                  value={nutri.ingredientes}
                  onChange={e => setNutri(n => ({ ...n, ingredientes: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 text-sm border outline-none resize-none"
                  style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)' }}
                />
              </div>

              {/* Alergênicos alimentares */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--ada-muted)' }}>
                  Alergênicos alimentares
                </p>
                <input
                  type="text"
                  placeholder="Ex: amendoim, castanha, leite, soja..."
                  value={nutri.alergicoAlimentar}
                  onChange={e => setNutri(n => ({ ...n, alergicoAlimentar: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 text-sm border outline-none"
                  style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)' }}
                />
              </div>

              {/* Glúten */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--ada-muted)' }}>
                  Glúten
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nutri.contemGluten}
                    onChange={e => setNutri(n => ({ ...n, contemGluten: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm" style={{ color: 'var(--ada-body)' }}>
                    {nutri.contemGluten ? 'Contém glúten' : 'Não contém glúten'}
                  </span>
                </label>
              </div>

              {/* Lactose */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--ada-muted)' }}>
                  Lactose
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nutri.contemLactose}
                    onChange={e => setNutri(n => ({ ...n, contemLactose: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm" style={{ color: 'var(--ada-body)' }}>
                    {nutri.contemLactose ? 'Contém lactose (será impresso)' : 'Não contém lactose (não será impresso)'}
                  </span>
                </label>
              </div>

              {/* Lote de fabricação */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ada-body)' }}>
                  Lote de fabricação
                </label>
                <input
                  type="text"
                  placeholder="Ex: 2026-001"
                  value={nutri.loteFabricacao}
                  onChange={e => setNutri(n => ({ ...n, loteFabricacao: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 text-sm border outline-none"
                  style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)' }}
                />
              </div>

              <button
                type="button"
                onClick={handleSalvarModelo}
                disabled={!produto || salvandoModelo}
                className="w-full rounded-lg px-3 py-2 text-xs font-semibold transition-opacity disabled:opacity-40"
                style={{
                  background: modeloSalvo ? 'var(--ada-success-text, #16a34a)' : 'var(--ada-hover)',
                  color: modeloSalvo ? '#fff' : 'var(--ada-body)',
                  border: '1px solid var(--ada-border)',
                }}
              >
                {salvandoModelo ? 'Salvando...' : modeloSalvo ? 'Modelo salvo!' : 'Salvar modelo nutricional'}
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-body)' }}>
              Data de Produção
            </label>
            <input
              type="date"
              value={dataProducao}
              onChange={e => setDataProducao(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none"
              style={{
                background: 'var(--ada-bg)',
                borderColor: 'var(--ada-border)',
                color: 'var(--ada-body)',
                colorScheme: 'dark',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-body)' }}>
              Data de Validade <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={dataValidade}
              onChange={e => setDataValidade(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none"
              style={{
                background: 'var(--ada-bg)',
                borderColor: 'var(--ada-border)',
                color: 'var(--ada-body)',
                colorScheme: 'dark',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-body)' }}>
              Quantidade de Etiquetas
            </label>
            <input
              type="number"
              min={1}
              max={500}
              value={quantidade}
              onChange={e => setQuantidade(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none"
              style={{
                background: 'var(--ada-bg)',
                borderColor: 'var(--ada-border)',
                color: 'var(--ada-body)',
              }}
            />
          </div>

          {erro && (
            <p
              className="text-sm rounded-lg px-3 py-2"
              style={{ background: 'var(--ada-error-bg)', color: 'var(--ada-error-text)' }}
            >
              {erro}
            </p>
          )}

          {tipoItem === 'produto' && tipo === 3 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={handleImprimir}
                disabled={!produto || imprimindo}
                className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                style={{ background: 'var(--sb-accent)' }}
              >
                <PrinterIcon className="h-4 w-4" />
                {imprimindo
                  ? 'Processando...'
                  : `Imprimir ${quantidade} ${quantidade === 1 ? 'etiqueta' : 'etiquetas'}`}
              </button>
            </div>
          ) : (
            <button
              onClick={handleImprimir}
              disabled={(tipoItem === 'produto' ? !produto : !ingredienteId) || imprimindo}
              className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
              style={{ background: 'var(--sb-accent)' }}
            >
              <PrinterIcon className="h-4 w-4" />
              {imprimindo
                ? 'Processando...'
                : `Imprimir ${quantidade} ${quantidade === 1 ? 'etiqueta' : 'etiquetas'}`}
            </button>
          )}
        </div>

        {/* ── Prévia ── */}
        <div
          className="rounded-xl border p-6 flex flex-col"
          style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-5"
            style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}
          >
            Prévia da Etiqueta
          </p>
          <div ref={previewContainerRef} className="flex-1 flex items-center justify-center overflow-hidden py-4">
            <LabelPreview
              html={previewHtml}
              width={previewWidth}
              height={previewHeight}
              scale={previewScale}
            />
          </div>
          <p className="text-xs text-center mt-4" style={{ color: 'var(--ada-muted)' }}>
            {TIPO_LABELS[tipo]} · {tiposOpcoes.find(o => o.valor === tipo)?.dim}
            {dataValidade ? ` · Validade: ${formatarDataLocal(dataValidade)}` : ''}
          </p>
        </div>
      </div>

      <ModelosNutricionaisTable modelos={modelosDisponiveis} onRenomear={handleRenomear} onExcluir={handleExcluir} />

      <HistoricoImpressoesTable historico={historico} />
    </div>
  )
}
