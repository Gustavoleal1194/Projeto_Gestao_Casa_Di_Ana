import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { ArrowDownTrayIcon, PrinterIcon } from '@heroicons/react/24/outline'
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
  baixarEtiquetaNutricionalZpl,
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


function parsePorcaoGramas(porcao: string): number {
  const match = porcao.match(/(\d+(?:[.,]\d+)?)\s*(?:g|ml)\b/i)
  return match ? parseFloat(match[1].replace(',', '.')) : 0
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

function fmt100(value: number, porcaoG: number): string {
  if (!porcaoG) return '—'
  const v = (value / porcaoG) * 100
  return v % 1 === 0 ? String(Math.round(v)) : v.toFixed(1)
}

function fmtPeso(value: number, porcaoG: number, pesoG: number): string {
  if (!porcaoG) return '—'
  const v = (value / porcaoG) * pesoG
  return v % 1 === 0 ? String(Math.round(v)) : v.toFixed(1)
}

// ─── Preview das etiquetas ───────────────────────────────────────────────────

interface PreviewProps {
  produto: Produto | null
  nomeOverride?: string
  tipo: TipoEtiqueta
  dataProducao: string
  dataValidade: string
  nutri: {
    porcao: string; valorEnergeticoKcal: string; valorEnergeticoKJ: string;
    carboidratos: string; acucaresTotais: string; acucaresAdicionados: string;
    proteinas: string; gordurasTotais: string; gordurasSaturadas: string;
    gordurasTrans: string; fibraAlimentar: string; sodio: string;
    porcoesPorEmbalagem: string; medidaCaseira: string;
    vdValorEnergetico: string; vdCarboidratos: string; vdAcucaresAdicionados: string;
    vdProteinas: string; vdGordurasTotais: string; vdGordurasSaturadas: string;
    vdGordurasTrans: string; vdFibraAlimentar: string; vdSodio: string;
  }
}

function LabelPreview({ produto, nomeOverride, tipo, dataProducao, dataValidade, nutri }: PreviewProps) {
  const nomeExibido = nomeOverride ?? produto?.nome ?? null
  if (!nomeExibido) {
    return (
      <div
        className="flex-1 flex items-center justify-center rounded-xl border-2 border-dashed"
        style={{ borderColor: 'var(--ada-border)', minHeight: 200 }}
      >
        <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>
          Selecione um item para ver a prévia
        </p>
      </div>
    )
  }

  const validade = dataValidade ? formatarDataLocal(dataValidade) : '—'
  const dataPtBr = formatarDataLocal(dataProducao)

  if (tipo === 1) {
    return (
      <div style={{
        width: 300, height: 150,
        background: '#fff', border: '1.5px solid #222', borderRadius: 2,
        display: 'flex', flexDirection: 'column',
        padding: '6px 9px',
        overflow: 'hidden', fontFamily: 'Georgia, serif',
        boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
      }}>
        {/* Topo: logo */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
          <img src="/images/image.png" alt="Logo" style={{ height: 48, width: 'auto', objectFit: 'contain' }} />
        </div>

        {/* Ornamento */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, margin: '3px 0' }}>
          <div style={{ flex: 1, height: 0.5, background: '#333', opacity: 0.6 }} />
          <span style={{ color: '#333', fontSize: 7 }}>◆</span>
          <div style={{ flex: 1, height: 0.5, background: '#333', opacity: 0.6 }} />
        </div>

        {/* Produto — ocupa espaço restante, igual ao flex:1 da impressão */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#000', textAlign: 'center', lineHeight: 1.2, wordBreak: 'break-word' }}>
          {nomeExibido}
        </div>

        {/* Rodapé: Fab esquerda / Val direita — igual à impressão */}
        <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 9, color: '#333', borderTop: '0.5px solid #333', paddingTop: 3 }}>
          <span>Fab: {dataPtBr}</span>
          <span style={{ fontWeight: 700, color: '#000' }}>Val: {validade}</span>
        </div>
      </div>
    )
  }

  if (tipo === 2) {
    return (
      <div
        style={{
          width: 280,
          height: 160,
          border: '1.5px solid #999',
          borderRadius: 4,
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#fff',
          color: '#000',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.15 }}>{nomeExibido}</div>
        <div style={{ fontSize: 12, marginTop: 8, color: '#333' }}>Val.: {validade}</div>
      </div>
    )
  }

  // Nutricional
  const kcalNum = parseValorNutricional(nutri.valorEnergeticoKcal)
  const carboNum = parseValorNutricional(nutri.carboidratos)
  const acucaresNum = parseValorNutricional(nutri.acucaresTotais)
  const acucaresAdicNum = parseValorNutricional(nutri.acucaresAdicionados)
  const protNum = parseValorNutricional(nutri.proteinas)
  const gordNum = parseValorNutricional(nutri.gordurasTotais)
  const gordSatNum = parseValorNutricional(nutri.gordurasSaturadas)
  const gordTransNum = parseValorNutricional(nutri.gordurasTrans)
  const fibraNum = parseValorNutricional(nutri.fibraAlimentar)
  const sodioNum = parseValorNutricional(nutri.sodio)
  const porcaoG = parsePorcaoGramas(nutri.porcao || '100g')

  const vdManual = (value: string) => value.trim()
  const porcaoLabel = nutri.medidaCaseira
    ? `${nutri.porcao || '100g'} (${nutri.medidaCaseira})`
    : (nutri.porcao || '100g')

  type Row = { bold: boolean; indent: 0 | 1 | 2; nome: string; cem: string; cinquenta: string; vdVal: string }
  const rows: Row[] = [
    { bold: true, indent: 0, nome: 'Valor energético (kcal)', cem: kcalNum > 0 ? fmt100(kcalNum, porcaoG) : '—', cinquenta: kcalNum > 0 ? fmtPeso(kcalNum, porcaoG, 50) : '—', vdVal: vdManual(nutri.vdValorEnergetico) },
    { bold: true, indent: 0, nome: 'Carboidratos (g)', cem: fmt100(carboNum, porcaoG), cinquenta: fmtPeso(carboNum, porcaoG, 50), vdVal: vdManual(nutri.vdCarboidratos) },
    { bold: false, indent: 1, nome: 'Açúcares totais (g)', cem: fmt100(acucaresNum, porcaoG), cinquenta: fmtPeso(acucaresNum, porcaoG, 50), vdVal: '' },
    { bold: false, indent: 2, nome: 'Açúcares adicionados (g)', cem: fmt100(acucaresAdicNum, porcaoG), cinquenta: fmtPeso(acucaresAdicNum, porcaoG, 50), vdVal: vdManual(nutri.vdAcucaresAdicionados) },
    { bold: true, indent: 0, nome: 'Proteínas (g)', cem: fmt100(protNum, porcaoG), cinquenta: fmtPeso(protNum, porcaoG, 50), vdVal: vdManual(nutri.vdProteinas) },
    { bold: true, indent: 0, nome: 'Gorduras totais (g)', cem: fmt100(gordNum, porcaoG), cinquenta: fmtPeso(gordNum, porcaoG, 50), vdVal: vdManual(nutri.vdGordurasTotais) },
    { bold: false, indent: 1, nome: 'Gorduras saturadas (g)', cem: fmt100(gordSatNum, porcaoG), cinquenta: fmtPeso(gordSatNum, porcaoG, 50), vdVal: vdManual(nutri.vdGordurasSaturadas) },
    { bold: false, indent: 1, nome: 'Gorduras trans (g)', cem: fmt100(gordTransNum, porcaoG), cinquenta: fmtPeso(gordTransNum, porcaoG, 50), vdVal: vdManual(nutri.vdGordurasTrans) },
    { bold: true, indent: 0, nome: 'Fibra alimentar (g)', cem: fmt100(fibraNum, porcaoG), cinquenta: fmtPeso(fibraNum, porcaoG, 50), vdVal: vdManual(nutri.vdFibraAlimentar) },
    { bold: true, indent: 0, nome: 'Sódio (mg)', cem: fmt100(sodioNum, porcaoG), cinquenta: fmtPeso(sodioNum, porcaoG, 50), vdVal: vdManual(nutri.vdSodio) },
  ]

  const tableTop = 66
  const tableHeight = 132
  const noteTop = 199.5

  return (
    <div
      style={{
        width: 210,
        height: 390,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Arial Narrow', Arial, sans-serif",
        background: '#fff',
        color: '#000',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 6,
          left: 9,
          width: 196,
          height: 216,
          background: '#fff',
          overflow: 'hidden',
          fontWeight: 700,
        }}
      >
        <div style={{ position: 'absolute', top: 3, left: 3, width: 186, height: 15, fontSize: 18, fontWeight: 700, lineHeight: '15px', textAlign: 'center', overflow: 'hidden' }}>
          INFORMAÇÃO NUTRICIONAL
        </div>
        <div style={{ position: 'absolute', top: 17.55, left: 0, width: 196, height: 1, background: '#000' }} />
        <div style={{ position: 'absolute', top: 22.8, left: 3.75, width: 184.5, height: 17.7, fontSize: 15, fontWeight: 700, lineHeight: '8.7px', textAlign: 'center', overflow: 'hidden', overflowWrap: 'anywhere' }}>
          {nomeExibido}
        </div>
        <div style={{ position: 'absolute', top: 42.9, left: 0, width: 196, height: 1, background: '#000' }} />
        <div style={{ position: 'absolute', top: 47.1, left: 3.75, width: 184.5, height: 18, fontSize: 10.5, lineHeight: '9px', overflow: 'hidden', overflowWrap: 'anywhere' }}>
          <div><strong>Porções por embalagem:</strong> {nutri.porcoesPorEmbalagem || '—'}</div>
          <div><strong>Porção:</strong> {porcaoLabel}</div>
        </div>

        <table style={{ position: 'absolute', top: tableTop, left: 0, width: 196, height: tableHeight, borderTop: '1.14px solid #000', borderBottom: '1.14px solid #000', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed', fontSize: 12, background: '#fff', overflow: 'hidden', zIndex: 1 }}>
          <colgroup>
            <col style={{ width: '56%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '18%' }} />
          </colgroup>
          <thead>
            <tr style={{ height: 12 }}>
              <th style={{ fontWeight: 700, padding: '0 2px', textAlign: 'left', verticalAlign: 'middle', borderBottom: '0.5px solid #000' }}>&nbsp;</th>
              <th style={{ fontWeight: 700, padding: '0 2px', textAlign: 'right', verticalAlign: 'middle', borderLeft: '0.5px solid #000', borderBottom: '0.5px solid #000' }}>100g</th>
              <th style={{ fontWeight: 700, padding: '0 2px', textAlign: 'right', verticalAlign: 'middle', borderLeft: '0.5px solid #000', borderBottom: '0.5px solid #000' }}>50g</th>
              <th style={{ fontWeight: 700, padding: '0 2px', textAlign: 'center', verticalAlign: 'middle', borderLeft: '0.5px solid #000', borderBottom: '0.5px solid #000' }}>%VD(*)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, index) => {
              const bottomBorder = index === rows.length - 1 ? '0' : '0.5px solid #000'
              return (
              <tr key={r.nome} style={{ height: 12 }}>
                <td style={{ fontWeight: 700, padding: `0 2px 0 ${r.indent === 2 ? '6px' : r.indent === 1 ? '5px' : '2px'}`, fontSize: 9.8, lineHeight: 1.18, verticalAlign: 'middle', overflow: 'hidden', overflowWrap: 'normal', whiteSpace: 'nowrap', borderBottom: bottomBorder }}>
                  {r.nome}
                </td>
                <td style={{ fontWeight: 700, textAlign: 'right', padding: '0 2px', borderLeft: '0.5px solid #000', borderBottom: bottomBorder, lineHeight: 1.05, verticalAlign: 'middle', overflow: 'hidden', overflowWrap: 'anywhere' }}>
                  {r.cem}
                </td>
                <td style={{ fontWeight: 700, textAlign: 'right', padding: '0 2px', borderLeft: '0.5px solid #000', borderBottom: bottomBorder, color: '#000', lineHeight: 1.05, verticalAlign: 'middle', overflow: 'hidden', overflowWrap: 'anywhere' }}>
                  {r.cinquenta}
                </td>
                <td style={{ fontWeight: 700, textAlign: 'center', padding: '0 2px', borderLeft: '0.5px solid #000', borderBottom: bottomBorder, lineHeight: 1.05, verticalAlign: 'middle', overflow: 'hidden' }}>
                  {r.vdVal}
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>

        <div style={{ position: 'absolute', top: noteTop, left: 3, width: 190, height: 11, fontSize: 10, lineHeight: 1, overflow: 'hidden', background: '#fff', zIndex: 2, whiteSpace: 'nowrap', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          *percentual de valores diários fornecidos pela porção.
        </div>
        {/* Contorno renderizado por cima de todo o conteúdo — mesmo comportamento do ::after no CSS de impressão */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '1.14px solid #000', pointerEvents: 'none', zIndex: 10, boxSizing: 'border-box' }} />
      </div>
    </div>
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
  })

  const produto = produtoDetalhe

  const previewContainerRef = useRef<HTMLDivElement>(null)
  const [previewScale, setPreviewScale] = useState(1.55)

  useEffect(() => {
    const el = previewContainerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const available = entry.contentRect.width - 48 // 24px padding de cada lado
      const scale = Math.min(1.55, available / 210)
      setPreviewScale(Math.max(0.6, scale))
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
          })
        } else {
          setNutri({ nome: '', porcao: '100g', medidaCaseira: '', porcoesPorEmbalagem: '', valorEnergeticoKcal: '', valorEnergeticoKJ: '', carboidratos: '', acucaresTotais: '', acucaresAdicionados: '', proteinas: '', gordurasTotais: '', gordurasSaturadas: '', gordurasTrans: '', fibraAlimentar: '', sodio: '', ...CAMPOS_VD_VAZIOS })
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
          {
            porcao: nutri.porcao || '100g',
            kcal: nutri.valorEnergeticoKcal || '—',
            kj: nutri.valorEnergeticoKJ || '—',
            carbo: nutri.carboidratos || '—',
            acucares: nutri.acucaresTotais || '—',
            acucaresAdic: nutri.acucaresAdicionados || '—',
            proteinas: nutri.proteinas || '—',
            gorduras: nutri.gordurasTotais || '—',
            gordSat: nutri.gordurasSaturadas || '—',
            gordTrans: nutri.gordurasTrans || '—',
            fibra: nutri.fibraAlimentar || '—',
            sodio: nutri.sodio || '—',
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
          }
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

  const handleGerarZplNutricional = async () => {
    if (!produto) return

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

      baixarEtiquetaNutricionalZpl(
        produto.nome,
        dataPtBr,
        validadePtBr,
        quantidade,
        montarNutriValues(),
      )

      await registrarImpressaoProduto()
    } catch {
      setErro('Erro ao gerar ZPL. Tente novamente.')
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
                      value={nutri[key as keyof typeof nutri]}
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
                        value={nutri[key as keyof typeof nutri]}
                        onChange={e => setNutri(n => ({ ...n, [key]: sanitizeVdInput(e.target.value) }))}
                        className="w-full rounded-lg px-3 py-2 text-sm border outline-none"
                        style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)' }}
                      />
                    </div>
                  ))}
                </div>
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
              <button
                type="button"
                onClick={handleGerarZplNutricional}
                disabled={!produto || imprimindo}
                className="w-full flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition-opacity disabled:opacity-40"
                style={{
                  background: 'var(--ada-bg)',
                  borderColor: 'var(--ada-border)',
                  color: 'var(--ada-body)',
                }}
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                {imprimindo
                  ? 'Processando...'
                  : `Gerar ZPL ${quantidade} ${quantidade === 1 ? 'etiqueta' : 'etiquetas'}`}
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
            <div style={{ transform: `scale(${previewScale})`, transformOrigin: 'center center' }}>
              <LabelPreview
                produto={produto}
                nomeOverride={tipoItem === 'ingrediente' ? (ingredientes.find(i => i.id === ingredienteId)?.nome) : undefined}
                tipo={tipoItem === 'ingrediente' ? 2 : tipo}
                dataProducao={dataProducao}
                dataValidade={dataValidade}
                nutri={nutri}
              />
            </div>
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
