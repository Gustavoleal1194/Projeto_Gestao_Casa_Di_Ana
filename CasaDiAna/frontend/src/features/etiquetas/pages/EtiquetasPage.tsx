import { useEffect, useState } from 'react'
import { PrinterIcon, ClockIcon } from '@heroicons/react/24/outline'
import { produtosService } from '@/features/producao/produtos/services/produtosService'
import { etiquetasService, type TipoEtiqueta, type HistoricoImpressao, type ModeloNutricional } from '@/lib/etiquetasService'
import type { Produto, ProdutoResumo } from '@/types/producao'

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatarData(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString('pt-BR')
}

const TIPO_LABELS: Record<TipoEtiqueta, string> = {
  1: 'Completa',
  2: 'Simples',
  3: 'Nutricional',
}

// ─── Geradores de HTML das etiquetas ────────────────────────────────────────

function htmlEtiquetaCompleta(
  produtoNome: string,
  dataProducao: string,
  validade: string,
  quantidade: number,
): string {
  const etiqueta = `
    <div class="etiqueta">
      <div class="marca">CASA DI ANA</div>
      <div class="sep"></div>
      <div class="nome">${produtoNome}</div>
      <div class="footer">
        <div class="linha"><span class="lbl">FABRICAÇÃO:</span> ${dataProducao}</div>
        <div class="linha validade"><span class="lbl">VÁLIDO ATÉ:</span> ${validade}</div>
      </div>
    </div>`
  const etiquetas = Array(quantidade).fill(etiqueta).join('')
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    @page { size: 100mm 50mm; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; background: #fff; }
    .etiqueta {
      width: 100mm; height: 50mm;
      border: 0.5mm solid #333;
      padding: 3mm 4mm;
      display: flex; flex-direction: column;
      page-break-after: always;
    }
    .marca { font-size: 7pt; font-weight: bold; letter-spacing: 2px; color: #555; text-transform: uppercase; }
    .sep { height: 0.3mm; background: #333; margin: 2mm 0; }
    .nome { font-size: 16pt; font-weight: bold; color: #1a1a1a; flex: 1; display: flex; align-items: center; word-break: break-word; }
    .footer { margin-top: auto; }
    .linha { font-size: 8pt; color: #333; margin-top: 1mm; }
    .validade { font-weight: bold; font-size: 9pt; color: #000; }
    .lbl { color: #666; }
  </style></head><body>${etiquetas}</body></html>`
}

function htmlEtiquetaSimples(
  produtoNome: string,
  validade: string,
  quantidade: number,
): string {
  const etiqueta = `
    <div class="etiqueta">
      <div class="nome">${produtoNome}</div>
      <div class="validade">Val.: ${validade}</div>
    </div>`
  const etiquetas = Array(quantidade).fill(etiqueta).join('')
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    @page { size: 70mm 30mm; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; background: #fff; }
    .etiqueta {
      width: 70mm; height: 30mm;
      border: 0.5mm solid #333;
      padding: 3mm;
      display: flex; flex-direction: column; justify-content: center;
      page-break-after: always;
    }
    .nome { font-size: 11pt; font-weight: bold; color: #1a1a1a; word-break: break-word; }
    .validade { font-size: 9pt; color: #333; margin-top: 2mm; }
  </style></head><body>${etiquetas}</body></html>`
}

function htmlEtiquetaNutricional(
  produtoNome: string,
  dataProducao: string,
  validade: string,
  quantidade: number,
  dados: {
    porcao: string; kcal: string; kj: string; carbo: string; acucares: string;
    proteinas: string; gorduras: string; gordSat: string; fibra: string; sodio: string;
  } = { porcao: '100g', kcal: '—', kj: '—', carbo: '—', acucares: '—', proteinas: '—', gorduras: '—', gordSat: '—', fibra: '—', sodio: '—' },
): string {
  const kcal = Number(dados.kcal) || 0
  const kj = Number(dados.kj) || 0
  const carbo = Number(dados.carbo) || 0
  const prot = Number(dados.proteinas) || 0
  const gord = Number(dados.gorduras) || 0
  const gordSat = Number(dados.gordSat) || 0
  const fibra = Number(dados.fibra) || 0
  const sodio = Number(dados.sodio) || 0

  const vdKcal = kcal > 0 ? `${Math.round((kcal / 2000) * 100)}%` : '—'
  const vdCarbo = carbo > 0 ? `${Math.round((carbo / 300) * 100)}%` : '—'
  const vdProt = prot > 0 ? `${Math.round((prot / 75) * 100)}%` : '—'
  const vdGord = gord > 0 ? `${Math.round((gord / 65) * 100)}%` : '—'
  const vdGordSat = gordSat > 0 ? `${Math.round((gordSat / 22) * 100)}%` : '—'
  const vdFibra = fibra > 0 ? `${Math.round((fibra / 25) * 100)}%` : '—'
  const vdSodio = sodio > 0 ? `${Math.round((sodio / 2300) * 100)}%` : '—'

  // kj used in vd calculations above for completeness
  void kj

  const row = (bold: boolean, indent: boolean, nome: string, qty: string, vd: string) => `
    <tr style="border-bottom: 0.3mm solid #000;">
      <td style="font-weight:${bold ? 'bold' : 'normal'}; padding: 0.6mm ${indent ? '3mm' : '1mm'} 0.6mm 1mm; font-size:6.5pt;">
        ${nome}
      </td>
      <td style="text-align:right; padding: 0.6mm 1mm; font-size:6.5pt; border-left:0.3mm solid #000; white-space:nowrap;">
        ${qty}
      </td>
      <td style="text-align:center; padding: 0.6mm 1mm; font-size:6.5pt; border-left:0.3mm solid #000; white-space:nowrap;">
        ${vd}
      </td>
    </tr>`

  const etiqueta = `
    <div style="width:76mm; border:0.8mm solid #000; font-family:Arial Narrow, Arial, sans-serif; display:flex; flex-direction:column; page-break-after:always; background:#fff;">

      <!-- Topo: nome do produto + datas -->
      <div style="background:#000; color:#fff; padding:1.5mm 2mm 0.5mm;">
        <div style="font-size:8pt; font-weight:bold; text-align:center; letter-spacing:0.5px;">INFORMAÇÃO NUTRICIONAL</div>
        <div style="font-size:7pt; text-align:center; margin-top:0.5mm;">${produtoNome}</div>
      </div>

      <!-- Porção -->
      <div style="padding:1.2mm 2mm; font-size:7pt; border-bottom:0.6mm solid #000;">
        <strong>Porção:</strong> ${dados.porcao}
      </div>

      <!-- Cabeçalho da tabela -->
      <table style="width:100%; border-collapse:collapse; border-bottom:0.6mm solid #000;">
        <colgroup>
          <col style="width:55%">
          <col style="width:27%">
          <col style="width:18%">
        </colgroup>
        <thead>
          <tr style="background:#e8e8e8;">
            <th style="font-size:6pt; font-weight:bold; padding:0.8mm 1mm; text-align:left; border-bottom:0.3mm solid #000;">Nutrientes</th>
            <th style="font-size:6pt; font-weight:bold; padding:0.8mm 1mm; text-align:right; border-left:0.3mm solid #000; border-bottom:0.3mm solid #000;">Qtd por porção</th>
            <th style="font-size:6pt; font-weight:bold; padding:0.8mm 1mm; text-align:center; border-left:0.3mm solid #000; border-bottom:0.3mm solid #000;">%VD*</th>
          </tr>
        </thead>
        <tbody>
          ${row(true, false, 'Valor Energético', `${dados.kcal} kcal<br><span style="font-weight:normal">${dados.kj} kJ</span>`, vdKcal)}
          ${row(true, false, 'Carboidratos', `${dados.carbo} g`, vdCarbo)}
          ${row(false, true, '&nbsp;&nbsp;Açúcares totais', `${dados.acucares} g`, '**')}
          ${row(true, false, 'Proteínas', `${dados.proteinas} g`, vdProt)}
          ${row(true, false, 'Gorduras totais', `${dados.gorduras} g`, vdGord)}
          ${row(false, true, '&nbsp;&nbsp;Gorduras saturadas', `${dados.gordSat} g`, vdGordSat)}
          ${row(true, false, 'Fibra alimentar', `${dados.fibra} g`, vdFibra)}
          ${row(true, false, 'Sódio', `${dados.sodio} mg`, vdSodio)}
        </tbody>
      </table>

      <!-- Footer %VD -->
      <div style="padding:1.2mm 1.5mm; font-size:5.5pt; color:#222; line-height:1.3; border-bottom:0.6mm solid #000;">
        *% Valores Diários com base em uma dieta de 2000 kcal ou 8400 kJ. Seus valores diários podem ser maiores ou menores dependendo de suas necessidades energéticas. **Valor Diário não estabelecido.
      </div>

      <!-- Validade -->
      <div style="display:flex; justify-content:space-between; padding:1.2mm 2mm; font-size:6.5pt;">
        <span><strong>Fab:</strong> ${dataProducao}</span>
        <span><strong>Val:</strong> ${validade}</span>
        <span style="font-style:italic;">Casa di Ana</span>
      </div>
    </div>`

  const etiquetas = Array(quantidade).fill(etiqueta).join('')
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    @page { size: 80mm 130mm; margin: 2mm; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background: #fff; }
  </style></head><body>${etiquetas}</body></html>`
}

// ─── Preview das etiquetas ───────────────────────────────────────────────────

interface PreviewProps {
  produto: Produto | null
  tipo: TipoEtiqueta
  dataProducao: string
  dataValidade: string
  nutri: {
    porcao: string; valorEnergeticoKcal: string; valorEnergeticoKJ: string;
    carboidratos: string; acucaresTotais: string; proteinas: string;
    gordurasTotais: string; gordurasSaturadas: string; fibraAlimentar: string; sodio: string;
  }
}

function LabelPreview({ produto, tipo, dataProducao, dataValidade, nutri }: PreviewProps) {
  if (!produto) {
    return (
      <div
        className="flex-1 flex items-center justify-center rounded-xl border-2 border-dashed"
        style={{ borderColor: 'var(--ada-border)', minHeight: 200 }}
      >
        <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>
          Selecione um produto para ver a prévia
        </p>
      </div>
    )
  }

  const validade = dataValidade ? new Date(dataValidade).toLocaleDateString('pt-BR') : '—'
  const dataPtBr = new Date(dataProducao).toLocaleDateString('pt-BR')

  if (tipo === 1) {
    return (
      <div
        style={{
          width: 300,
          height: 150,
          border: '1.5px solid #999',
          borderRadius: 4,
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          color: '#000',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#555' }}>
          CASA DI ANA
        </div>
        <div style={{ height: 1, background: '#333', margin: '6px 0' }} />
        <div style={{ fontSize: 18, fontWeight: 700, flex: 1, display: 'flex', alignItems: 'center' }}>
          {produto.nome}
        </div>
        <div style={{ fontSize: 10, color: '#444' }}>
          FABRICAÇÃO: {dataPtBr}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#000', marginTop: 2 }}>
          VÁLIDO ATÉ: {validade}
        </div>
      </div>
    )
  }

  if (tipo === 2) {
    return (
      <div
        style={{
          width: 210,
          height: 90,
          border: '1.5px solid #999',
          borderRadius: 4,
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#fff',
          color: '#000',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700 }}>{produto.nome}</div>
        <div style={{ fontSize: 11, marginTop: 6, color: '#333' }}>Val.: {validade}</div>
      </div>
    )
  }

  // Nutricional
  const kcalNum = Number(nutri.valorEnergeticoKcal) || 0
  const kjNum = Number(nutri.valorEnergeticoKJ) || 0
  const carboNum = Number(nutri.carboidratos) || 0
  const acucaresNum = Number(nutri.acucaresTotais) || 0
  const protNum = Number(nutri.proteinas) || 0
  const gordNum = Number(nutri.gordurasTotais) || 0
  const gordSatNum = Number(nutri.gordurasSaturadas) || 0
  const fibraNum = Number(nutri.fibraAlimentar) || 0
  const sodioNum = Number(nutri.sodio) || 0

  // suppress unused warning — kjNum used for display consistency
  void kjNum

  const vd = (v: number, ref: number) => ref === 0 ? '**' : v > 0 ? `${Math.round((v / ref) * 100)}%` : '—'

  const rows: [boolean, boolean, string, string, string][] = [
    [true, false, 'Valor Energético', kcalNum > 0 ? `${nutri.valorEnergeticoKcal} kcal / ${nutri.valorEnergeticoKJ} kJ` : '—', vd(kcalNum, 2000)],
    [true, false, 'Carboidratos', carboNum > 0 ? `${nutri.carboidratos} g` : '—', vd(carboNum, 300)],
    [false, true, 'Açúcares totais', acucaresNum > 0 ? `${nutri.acucaresTotais} g` : '—', '**'],
    [true, false, 'Proteínas', protNum > 0 ? `${nutri.proteinas} g` : '—', vd(protNum, 75)],
    [true, false, 'Gorduras totais', gordNum > 0 ? `${nutri.gordurasTotais} g` : '—', vd(gordNum, 65)],
    [false, true, 'Gord. saturadas', gordSatNum > 0 ? `${nutri.gordurasSaturadas} g` : '—', vd(gordSatNum, 22)],
    [true, false, 'Fibra alimentar', fibraNum > 0 ? `${nutri.fibraAlimentar} g` : '—', vd(fibraNum, 25)],
    [true, false, 'Sódio', sodioNum > 0 ? `${nutri.sodio} mg` : '—', vd(sodioNum, 2300)],
  ]

  const validadePrev = dataValidade ? new Date(dataValidade).toLocaleDateString('pt-BR') : '—'
  const dataFabPrev = new Date(dataProducao).toLocaleDateString('pt-BR')

  return (
    <div style={{
      width: 228,
      border: '2px solid #000',
      fontFamily: "'Arial Narrow', Arial, sans-serif",
      background: '#fff',
      color: '#000',
      fontSize: 0,
    }}>
      {/* Header */}
      <div style={{ background: '#000', color: '#fff', padding: '4px 6px 3px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', letterSpacing: 0.5 }}>
          INFORMAÇÃO NUTRICIONAL
        </div>
        <div style={{ fontSize: 8, textAlign: 'center', marginTop: 1, opacity: 0.9 }}>
          {produto.nome}
        </div>
      </div>

      {/* Porção */}
      <div style={{ padding: '3px 6px', fontSize: 8, borderBottom: '1.5px solid #000' }}>
        <strong>Porção:</strong> {nutri.porcao || '100g'}
      </div>

      {/* Tabela */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 7.5 }}>
        <thead>
          <tr style={{ background: '#e8e8e8', borderBottom: '1px solid #000' }}>
            <th style={{ fontWeight: 700, padding: '2px 4px', textAlign: 'left', width: '54%' }}>Nutrientes</th>
            <th style={{ fontWeight: 700, padding: '2px 4px', textAlign: 'right', borderLeft: '1px solid #000', width: '28%' }}>Qtd / porção</th>
            <th style={{ fontWeight: 700, padding: '2px 4px', textAlign: 'center', borderLeft: '1px solid #000', width: '18%' }}>%VD*</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([bold, indent, nome, qty, vdVal]) => (
            <tr key={nome} style={{ borderBottom: '0.5px solid #000' }}>
              <td style={{
                fontWeight: bold ? 700 : 400,
                padding: `1.5px ${indent ? '10px' : '4px'} 1.5px 4px`,
                fontSize: 7.5,
              }}>
                {nome}
              </td>
              <td style={{ textAlign: 'right', padding: '1.5px 4px', borderLeft: '1px solid #000', fontSize: 7.5 }}>
                {qty}
              </td>
              <td style={{ textAlign: 'center', padding: '1.5px 4px', borderLeft: '1px solid #000', fontSize: 7.5, color: '#333' }}>
                {vdVal}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer %VD */}
      <div style={{
        padding: '3px 5px',
        fontSize: 6,
        color: '#333',
        lineHeight: 1.4,
        borderTop: '1.5px solid #000',
        borderBottom: '1px solid #000',
      }}>
        *% VD com base em dieta de 2000 kcal. **VD não estabelecido.
      </div>

      {/* Datas */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '3px 6px',
        fontSize: 7,
      }}>
        <span><strong>Fab:</strong> {dataFabPrev}</span>
        <span><strong>Val:</strong> {validadePrev}</span>
        <span style={{ fontStyle: 'italic', opacity: 0.7 }}>Casa di Ana</span>
      </div>
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────

export function EtiquetasPage() {
  const [produtos, setProdutos] = useState<ProdutoResumo[]>([])
  const [produtoId, setProdutoId] = useState('')
  const [produtoDetalhe, setProdutoDetalhe] = useState<Produto | null>(null)
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
  const [nutri, setNutri] = useState({
    porcao: '100g',
    valorEnergeticoKcal: '',
    valorEnergeticoKJ: '',
    carboidratos: '',
    acucaresTotais: '',
    proteinas: '',
    gordurasTotais: '',
    gordurasSaturadas: '',
    fibraAlimentar: '',
    sodio: '',
  })

  const produto = produtoDetalhe

  useEffect(() => {
    produtosService.listar().then(setProdutos).catch(() => {})
    etiquetasService.listarHistorico().then(setHistorico).catch(() => {})
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
            valorEnergeticoKcal: String(modelo.valorEnergeticoKcal),
            valorEnergeticoKJ: String(modelo.valorEnergeticoKJ),
            carboidratos: String(modelo.carboidratos),
            acucaresTotais: String(modelo.acucaresTotais),
            proteinas: String(modelo.proteinas),
            gordurasTotais: String(modelo.gordurasTotais),
            gordurasSaturadas: String(modelo.gordurasSaturadas),
            fibraAlimentar: String(modelo.fibraAlimentar),
            sodio: String(modelo.sodio),
          })
        } else {
          setNutri({ porcao: '100g', valorEnergeticoKcal: '', valorEnergeticoKJ: '', carboidratos: '', acucaresTotais: '', proteinas: '', gordurasTotais: '', gordurasSaturadas: '', fibraAlimentar: '', sodio: '' })
        }
      })
      .catch(() => {})
  }, [produtoId, tipo])

  const handleImprimir = async () => {
    if (!produto) return
    setImprimindo(true)
    setErro(null)

    if (!dataValidade) {
      setErro('Informe a data de validade.')
      setImprimindo(false)
      return
    }

    try {
      const validadePtBr = new Date(dataValidade).toLocaleDateString('pt-BR')
      const dataPtBr = new Date(dataProducao).toLocaleDateString('pt-BR')

      let html = ''
      if (tipo === 1) html = htmlEtiquetaCompleta(produto.nome, dataPtBr, validadePtBr, quantidade)
      else if (tipo === 2) html = htmlEtiquetaSimples(produto.nome, validadePtBr, quantidade)
      else html = htmlEtiquetaNutricional(
        produto.nome,
        dataPtBr,
        validadePtBr,
        quantidade,
        {
          porcao: nutri.porcao || '100g',
          kcal: nutri.valorEnergeticoKcal || '—',
          kj: nutri.valorEnergeticoKJ || '—',
          carbo: nutri.carboidratos || '—',
          acucares: nutri.acucaresTotais || '—',
          proteinas: nutri.proteinas || '—',
          gorduras: nutri.gordurasTotais || '—',
          gordSat: nutri.gordurasSaturadas || '—',
          fibra: nutri.fibraAlimentar || '—',
          sodio: nutri.sodio || '—',
        }
      )

      const win = window.open('', '_blank', 'width=600,height=400')
      if (win) {
        win.document.write(html)
        win.document.close()
        win.focus()
        win.print()
        setTimeout(() => win.close(), 1000)
      }

      const novo = await etiquetasService.registrarImpressao({
        produtoId: produto.id,
        tipoEtiqueta: tipo,
        quantidade,
        dataProducao,
      })
      setHistorico(prev => [novo, ...prev])
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
        proteinas: Number(nutri.proteinas) || 0,
        gordurasTotais: Number(nutri.gordurasTotais) || 0,
        gordurasSaturadas: Number(nutri.gordurasSaturadas) || 0,
        fibraAlimentar: Number(nutri.fibraAlimentar) || 0,
        sodio: Number(nutri.sodio) || 0,
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
    { valor: 2, label: 'Simples', desc: 'Nome + Validade', dim: '70×30mm' },
    { valor: 3, label: 'Nutricional', desc: 'Tabela Nutricional', dim: '80×120mm' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1
          className="text-2xl font-semibold"
          style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
        >
          Etiquetas
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--ada-muted)' }}>
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

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-text)' }}>
              Produto <span className="text-red-500">*</span>
            </label>
            <select
              value={produtoId}
              onChange={e => setProdutoId(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none"
              style={{
                background: 'var(--ada-bg)',
                borderColor: 'var(--ada-border)',
                color: 'var(--ada-text)',
              }}
            >
              <option value="">Selecione um produto...</option>
              {produtos.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-text)' }}>
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
                    color: tipo === op.valor ? '#fff' : 'var(--ada-text)',
                  }}
                >
                  <div className="text-xs font-semibold">{op.label}</div>
                  <div className="text-[10px] mt-0.5 opacity-75">{op.dim}</div>
                </button>
              ))}
            </div>
          </div>

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
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ada-text)' }}>Porção</label>
                <input
                  type="text"
                  placeholder="Ex: 100g"
                  value={nutri.porcao}
                  onChange={e => setNutri(n => ({ ...n, porcao: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 text-sm border outline-none"
                  style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)', color: 'var(--ada-text)' }}
                />
              </div>

              {/* Grid 2 colunas para os campos numéricos */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'valorEnergeticoKcal', label: 'Calorias (kcal)', unit: 'kcal' },
                  { key: 'valorEnergeticoKJ', label: 'Calorias (kJ)', unit: 'kJ' },
                  { key: 'carboidratos', label: 'Carboidratos', unit: 'g' },
                  { key: 'acucaresTotais', label: 'Açúcares totais', unit: 'g' },
                  { key: 'proteinas', label: 'Proteínas', unit: 'g' },
                  { key: 'gordurasTotais', label: 'Gorduras totais', unit: 'g' },
                  { key: 'gordurasSaturadas', label: 'Gord. saturadas', unit: 'g' },
                  { key: 'fibraAlimentar', label: 'Fibra alimentar', unit: 'g' },
                  { key: 'sodio', label: 'Sódio', unit: 'mg' },
                ].map(({ key, label, unit }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ada-text)' }}>
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
                      style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)', color: 'var(--ada-text)' }}
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
                  color: modeloSalvo ? '#fff' : 'var(--ada-text)',
                  border: '1px solid var(--ada-border)',
                }}
              >
                {salvandoModelo ? 'Salvando...' : modeloSalvo ? 'Modelo salvo!' : 'Salvar modelo nutricional'}
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-text)' }}>
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
                color: 'var(--ada-text)',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-text)' }}>
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
                color: 'var(--ada-text)',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ada-text)' }}>
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
                color: 'var(--ada-text)',
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
          <div className="flex-1 flex items-center justify-center">
            <LabelPreview produto={produto} tipo={tipo} dataProducao={dataProducao} dataValidade={dataValidade} nutri={nutri} />
          </div>
          <p className="text-xs text-center mt-4" style={{ color: 'var(--ada-muted)' }}>
            {TIPO_LABELS[tipo]} · {tiposOpcoes.find(o => o.valor === tipo)?.dim}
            {dataValidade ? ` · Validade: ${new Date(dataValidade).toLocaleDateString('pt-BR')}` : ''}
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
                          style={{ background: 'var(--ada-hover)', color: 'var(--ada-text)' }}
                        >
                          {TIPO_LABELS[h.tipoEtiqueta]}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--ada-text)' }}>
                        {h.quantidade}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--ada-text)' }}>
                        {formatarData(h.dataProducao)}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--ada-text)' }}>
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
