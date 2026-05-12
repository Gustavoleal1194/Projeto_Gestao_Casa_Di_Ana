import { useEffect, useRef, useState } from 'react'
import { PrinterIcon, ClockIcon } from '@heroicons/react/24/outline'
import { produtosService } from '@/features/producao/produtos/services/produtosService'
import { ingredientesService } from '@/features/estoque/ingredientes/services/ingredientesService'
import { etiquetasService, type TipoEtiqueta, type HistoricoImpressao, type ModeloNutricional } from '@/lib/etiquetasService'
import type { Produto, ProdutoResumo } from '@/types/producao'
import type { IngredienteResumo } from '@/types/estoque'
import {
  imprimirEtiquetaHtml,
  htmlEtiquetaCompleta,
  htmlEtiquetaSimples,
  baixarEtiquetaNutricionalZpl,
} from '../utils/etiquetaUtils'

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatarData(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString('pt-BR')
}

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

function fmt100(value: number, porcaoG: number): string {
  if (!value || !porcaoG) return '—'
  const v = (value / porcaoG) * 100
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
        width: 300,
        height: 150,
        background: '#FDFAF5',
        border: '2px solid #C4870A',
        outline: '1px solid #C4870A',
        outlineOffset: 3,
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'Georgia, serif',
        boxShadow: '0 4px 20px rgba(196,135,10,0.15)',
      }}>
        {/* Top content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 18px 6px', gap: 4 }}>
          <img src="/images/image.png" alt="Logo" style={{ height: 39, width: 'auto', objectFit: 'contain' }} />

          {/* Ornament */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', margin: '4px 0' }}>
            <div style={{ flex: 1, height: 0.5, background: '#C4870A', opacity: 0.6 }} />
            <span style={{ color: '#C4870A', fontSize: 8 }}>◆</span>
            <div style={{ flex: 1, height: 0.5, background: '#C4870A', opacity: 0.6 }} />
          </div>

          <div style={{ fontSize: 18, fontWeight: 700, color: '#2C1A0E', textAlign: 'center', lineHeight: 1.15, letterSpacing: 0.3 }}>
            {nomeExibido}
          </div>

          <div style={{ fontSize: 8, color: '#8B6347', marginTop: 4 }}>
            Fabricação: {dataPtBr}
          </div>
        </div>

        {/* Validade bar */}
        <div style={{
          background: '#5C3A1E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: '6px 16px',
          margin: '0 12px 9px',
          borderRadius: 2,
        }}>
          <span style={{ fontSize: 8, color: '#C4870A', letterSpacing: 2, textTransform: 'uppercase' }}>
            Válido Até
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#FDFAF5', letterSpacing: 0.5 }}>
            {validade}
          </span>
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
  const kcalNum = Number(nutri.valorEnergeticoKcal) || 0
  const kjNum = Number(nutri.valorEnergeticoKJ) || 0
  const carboNum = Number(nutri.carboidratos) || 0
  const acucaresNum = Number(nutri.acucaresTotais) || 0
  const acucaresAdicNum = Number(nutri.acucaresAdicionados) || 0
  const protNum = Number(nutri.proteinas) || 0
  const gordNum = Number(nutri.gordurasTotais) || 0
  const gordSatNum = Number(nutri.gordurasSaturadas) || 0
  const gordTransNum = Number(nutri.gordurasTrans) || 0
  const fibraNum = Number(nutri.fibraAlimentar) || 0
  const sodioNum = Number(nutri.sodio) || 0
  const porcaoG = parsePorcaoGramas(nutri.porcao || '100g')

  const vdPrev = (v: number, ref: number) => v > 0 ? `${Math.round((v / ref) * 100)}%` : '—'
  const nd = '**'

  const porcaoLabel = nutri.medidaCaseira
    ? `${nutri.porcao || '100g'} (${nutri.medidaCaseira})`
    : (nutri.porcao || '100g')

  type Row = { bold: boolean; indent: 0 | 1 | 2; nome: string; qty: string; vdVal: string; c100: string }
  const rows: Row[] = [
    { bold: true, indent: 0, nome: 'Valor energético', qty: kcalNum > 0 ? `${nutri.valorEnergeticoKcal} kcal / ${nutri.valorEnergeticoKJ} kJ` : '—', vdVal: vdPrev(kcalNum, 2000), c100: kcalNum > 0 ? `${fmt100(kcalNum, porcaoG)} kcal` : '—' },
    { bold: true, indent: 0, nome: 'Carboidratos', qty: carboNum > 0 ? `${nutri.carboidratos} g` : '—', vdVal: vdPrev(carboNum, 300), c100: `${fmt100(carboNum, porcaoG)} g` },
    { bold: false, indent: 1, nome: 'Açúcares totais', qty: acucaresNum > 0 ? `${nutri.acucaresTotais} g` : '—', vdVal: nd, c100: `${fmt100(acucaresNum, porcaoG)} g` },
    { bold: false, indent: 2, nome: 'Açúcares adicionados', qty: acucaresAdicNum > 0 ? `${nutri.acucaresAdicionados} g` : '—', vdVal: nd, c100: `${fmt100(acucaresAdicNum, porcaoG)} g` },
    { bold: true, indent: 0, nome: 'Proteínas', qty: protNum > 0 ? `${nutri.proteinas} g` : '—', vdVal: vdPrev(protNum, 75), c100: `${fmt100(protNum, porcaoG)} g` },
    { bold: true, indent: 0, nome: 'Gorduras totais', qty: gordNum > 0 ? `${nutri.gordurasTotais} g` : '—', vdVal: vdPrev(gordNum, 65), c100: `${fmt100(gordNum, porcaoG)} g` },
    { bold: false, indent: 1, nome: 'Gorduras saturadas', qty: gordSatNum > 0 ? `${nutri.gordurasSaturadas} g` : '—', vdVal: vdPrev(gordSatNum, 22), c100: `${fmt100(gordSatNum, porcaoG)} g` },
    { bold: false, indent: 1, nome: 'Gorduras trans', qty: gordTransNum > 0 ? `${nutri.gordurasTrans} g` : '—', vdVal: nd, c100: `${fmt100(gordTransNum, porcaoG)} g` },
    { bold: true, indent: 0, nome: 'Fibra alimentar', qty: fibraNum > 0 ? `${nutri.fibraAlimentar} g` : '—', vdVal: vdPrev(fibraNum, 25), c100: `${fmt100(fibraNum, porcaoG)} g` },
    { bold: true, indent: 0, nome: 'Sódio', qty: sodioNum > 0 ? `${nutri.sodio} mg` : '—', vdVal: vdPrev(sodioNum, 2300), c100: `${fmt100(sodioNum, porcaoG)} mg` },
  ]

  // suppress unused warning
  void kjNum

  const validadePrev = dataValidade ? formatarDataLocal(dataValidade) : '—'
  const dataFabPrev = formatarDataLocal(dataProducao)

  return (
    <div style={{
      width: 300,
      minHeight: 450,
      border: '2px solid #000',
      fontFamily: "'Arial Narrow', Arial, sans-serif",
      background: '#fff',
      color: '#000',
      fontSize: 0,
    }}>
      {/* Header */}
      <div style={{ background: '#fff', color: '#000', padding: '4px 6px 3px', textAlign: 'center', borderBottom: '1.5px solid #000' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>INFORMAÇÃO NUTRICIONAL</div>
        <div style={{ fontSize: 8, marginTop: 1 }}>{nomeExibido}</div>
      </div>

      {/* Porção */}
      <div style={{ padding: '3px 6px', fontSize: 7.5, borderBottom: '1.5px solid #000', lineHeight: 1.5 }}>
        <strong>Porção:</strong> {porcaoLabel}
        {nutri.porcoesPorEmbalagem ? <><br />{nutri.porcoesPorEmbalagem} porções por embalagem</> : null}
      </div>

      {/* Tabela */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 7 }}>
        <thead>
          <tr style={{ background: '#fff', borderBottom: '1px solid #000' }}>
            <th style={{ fontWeight: 700, padding: '2px 3px', textAlign: 'left', width: '40%' }}>Nutrientes</th>
            <th style={{ fontWeight: 700, padding: '2px 3px', textAlign: 'right', borderLeft: '1px solid #000', width: '24%' }}>Porção</th>
            <th style={{ fontWeight: 700, padding: '2px 3px', textAlign: 'center', borderLeft: '1px solid #000', width: '14%' }}>%VD*</th>
            <th style={{ fontWeight: 700, padding: '2px 3px', textAlign: 'right', borderLeft: '1px solid #000', width: '22%' }}>100g/100ml</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.nome} style={{ borderBottom: '0.5px solid #000' }}>
              <td style={{ fontWeight: r.bold ? 700 : 400, padding: `1px 3px 1px ${r.indent === 2 ? '16px' : r.indent === 1 ? '8px' : '3px'}`, fontSize: 7, lineHeight: 1.3 }}>
                {r.nome}
              </td>
              <td style={{ textAlign: 'right', padding: '1px 3px', borderLeft: '1px solid #000', fontSize: 7, lineHeight: 1.3 }}>
                {r.qty}
              </td>
              <td style={{ textAlign: 'center', padding: '1px 3px', borderLeft: '1px solid #000', fontSize: 7, color: '#333', lineHeight: 1.3 }}>
                {r.vdVal}
              </td>
              <td style={{ textAlign: 'right', padding: '1px 3px', borderLeft: '1px solid #000', fontSize: 7, color: '#555', lineHeight: 1.3 }}>
                {r.c100}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer */}
      <div style={{ padding: '2px 5px', fontSize: 5.5, color: '#333', lineHeight: 1.4, borderTop: '1.5px solid #000', borderBottom: '1px solid #000' }}>
        *Percentual de valores diários fornecidos pela porção. **Valor Diário não estabelecido. Valores diários de referência com base em dieta de 2000 kcal ou 8400 kJ.
      </div>

      {/* Datas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', fontSize: 6.5 }}>
        <span><strong>Fab:</strong> {dataFabPrev}</span>
        <span><strong>Val:</strong> {validadePrev}</span>
        <span style={{ fontStyle: 'italic', opacity: 0.7 }}>Casa di Ana</span>
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
  const [salvandoModelo, setSalvandoModelo] = useState(false)
  const [modeloSalvo, setModeloSalvo] = useState(false)
  const [logoBase64, setLogoBase64] = useState('')
  const [nutri, setNutri] = useState({
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
  })

  const produto = produtoDetalhe

  const previewContainerRef = useRef<HTMLDivElement>(null)
  const [previewScale, setPreviewScale] = useState(1.55)

  useEffect(() => {
    const el = previewContainerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const available = entry.contentRect.width - 48 // 24px padding de cada lado
      const scale = Math.min(1.55, available / 300)
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
          })
        } else {
          setNutri({ porcao: '100g', medidaCaseira: '', porcoesPorEmbalagem: '', valorEnergeticoKcal: '', valorEnergeticoKJ: '', carboidratos: '', acucaresTotais: '', acucaresAdicionados: '', proteinas: '', gordurasTotais: '', gordurasSaturadas: '', gordurasTrans: '', fibraAlimentar: '', sodio: '' })
        }
      })
      .catch(() => {})
  }, [produtoId, tipo])

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
        baixarEtiquetaNutricionalZpl(
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
          }
        )
      }

      if (html) imprimirEtiquetaHtml(html)

      if (!isIngrediente && produto) {
        const novo = await etiquetasService.registrarImpressao({
          produtoId: produto.id,
          tipoEtiqueta: tipo,
          quantidade,
          dataProducao,
        })
        setHistorico(prev => [novo, ...prev])
      }
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
    try {
      await etiquetasService.salvarModeloNutricional(produto.id, {
        porcao: nutri.porcao || '100g',
        valorEnergeticoKcal: Number(nutri.valorEnergeticoKcal) || 0,
        valorEnergeticoKJ: Number(nutri.valorEnergeticoKJ) || 0,
        carboidratos: Number(nutri.carboidratos) || 0,
        acucaresTotais: Number(nutri.acucaresTotais) || 0,
        acucaresAdicionados: Number(nutri.acucaresAdicionados) || 0,
        proteinas: Number(nutri.proteinas) || 0,
        gordurasTotais: Number(nutri.gordurasTotais) || 0,
        gordurasSaturadas: Number(nutri.gordurasSaturadas) || 0,
        gordurasTrans: Number(nutri.gordurasTrans) || 0,
        fibraAlimentar: Number(nutri.fibraAlimentar) || 0,
        sodio: Number(nutri.sodio) || 0,
        porcoesPorEmbalagem: nutri.porcoesPorEmbalagem ? Number(nutri.porcoesPorEmbalagem) : null,
        medidaCaseira: nutri.medidaCaseira || null,
      })
      setModeloSalvo(true)
      setTimeout(() => setModeloSalvo(false), 3000)
    } catch {
      setErro('Erro ao salvar modelo nutricional.')
    } finally {
      setSalvandoModelo(false)
    }
  }

  const tiposOpcoes: { valor: TipoEtiqueta; label: string; desc: string; dim: string }[] = [
    { valor: 1, label: 'Completa', desc: 'Logo + Nome + Validade', dim: '100×50mm' },
    { valor: 2, label: 'Simples', desc: 'Nome + Validade', dim: '70×40mm' },
    { valor: 3, label: 'Nutricional', desc: 'Tabela Nutricional', dim: '100×150mm' },
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
                  { key: 'valorEnergeticoKJ', label: 'Valor energético', unit: 'kJ' },
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
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      value={nutri[key as keyof typeof nutri]}
                      onChange={e => setNutri(n => ({ ...n, [key]: e.target.value }))}
                      className="w-full rounded-lg px-3 py-2 text-sm border outline-none"
                      style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)' }}
                    />
                  </div>
                ))}
              </div>

              <button
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

          <button
            onClick={handleImprimir}
            disabled={(tipoItem === 'produto' ? !produto : !ingredienteId) || imprimindo}
            className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
            style={{ background: 'var(--sb-accent)' }}
          >
            <PrinterIcon className="h-4 w-4" />
            {imprimindo
              ? 'Processando...'
              : tipoItem === 'produto' && tipo === 3
                ? `Gerar ZPL ${quantidade} ${quantidade === 1 ? 'etiqueta' : 'etiquetas'}`
                : `Imprimir ${quantidade} ${quantidade === 1 ? 'etiqueta' : 'etiquetas'}`}
          </button>
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

      {/* Histórico */}
      <div
        className="rounded-xl border"
        style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}
      >
        <div
          className="px-5 py-4 border-b flex items-center gap-2"
          style={{ borderColor: 'var(--ada-border)' }}
        >
          <ClockIcon className="h-4 w-4" style={{ color: 'var(--ada-muted)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
            Histórico de Impressões
          </h2>
          <span
            className="ml-auto text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'var(--ada-hover)', color: 'var(--ada-muted)' }}
          >
            Últimas 100
          </span>
        </div>

        {historico.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>
              Nenhuma impressão registrada ainda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--ada-border)' }}>
                  {['Produto', 'Tipo', 'Qtd', 'Data de Produção', 'Data de Validade', 'Impresso em'].map(h => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: 'var(--ada-muted)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historico.map((h, i) => {
                  const validade = '—'
                  return (
                    <tr
                      key={h.id}
                      style={{
                        borderBottom: '1px solid var(--ada-border)',
                        background: i % 2 === 0 ? 'transparent' : 'var(--ada-hover)',
                      }}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--ada-heading)' }}>
                        {h.produtoNome}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{ background: 'var(--ada-hover)', color: 'var(--ada-body)' }}
                        >
                          {TIPO_LABELS[h.tipoEtiqueta]}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--ada-body)' }}>
                        {h.quantidade}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--ada-body)' }}>
                        {formatarData(h.dataProducao)}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--ada-body)' }}>
                        {validade}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--ada-muted)' }}>
                        {new Date(h.impressoEm).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
