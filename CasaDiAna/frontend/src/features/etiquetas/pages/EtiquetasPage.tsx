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
  const etiqueta = `
    <div class="etiqueta">
      <div class="titulo">INFORMAÇÃO NUTRICIONAL</div>
      <div class="sep-thick"></div>
      <div class="produto">${produtoNome}</div>
      <div class="porcao">Porção: ${dados.porcao}</div>
      <div class="sep"></div>
      <table>
        <tr><td class="desc">Valor Energético</td><td class="val">${dados.kcal}kcal / ${dados.kj}kJ</td></tr>
        <tr><td class="desc">Carboidratos</td><td class="val">${dados.carbo}g</td></tr>
        <tr><td class="desc">Açúcares totais</td><td class="val">${dados.acucares}g</td></tr>
        <tr><td class="desc">Proteínas</td><td class="val">${dados.proteinas}g</td></tr>
        <tr><td class="desc">Gorduras totais</td><td class="val">${dados.gorduras}g</td></tr>
        <tr><td class="desc">Gorduras saturadas</td><td class="val">${dados.gordSat}g</td></tr>
        <tr><td class="desc">Fibra alimentar</td><td class="val">${dados.fibra}g</td></tr>
        <tr><td class="desc">Sódio</td><td class="val">${dados.sodio}mg</td></tr>
      </table>
      <div class="sep-thick"></div>
      <div class="footer">
        <span>Fab: ${dataProducao}</span>
        <span>Val: ${validade}</span>
        <span>Casa di Ana</span>
      </div>
    </div>`
  const etiquetas = Array(quantidade).fill(etiqueta).join('')
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    @page { size: 80mm 120mm; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; background: #fff; }
    .etiqueta {
      width: 80mm; height: 120mm;
      border: 0.8mm solid #000;
      padding: 3mm;
      display: flex; flex-direction: column;
      page-break-after: always;
    }
    .titulo { font-size: 9pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
    .sep-thick { height: 0.8mm; background: #000; margin: 1.5mm 0; }
    .sep { height: 0.3mm; background: #666; margin: 1mm 0; }
    .produto { font-size: 10pt; font-weight: bold; }
    .porcao { font-size: 7.5pt; color: #444; margin-top: 0.5mm; }
    table { width: 100%; border-collapse: collapse; }
    td { font-size: 7.5pt; padding: 0.8mm 0; border-bottom: 0.2mm solid #ccc; }
    .desc { color: #222; }
    .val { text-align: right; color: #444; }
    .footer { display: flex; justify-content: space-between; font-size: 7pt; color: #444; margin-top: auto; }
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
  return (
    <div
      style={{
        width: 240,
        height: 360,
        border: '2px solid #000',
        borderRadius: 4,
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        color: '#000',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Informação Nutricional
      </div>
      <div style={{ height: 2, background: '#000', margin: '4px 0' }} />
      <div style={{ fontSize: 11, fontWeight: 700 }}>{produto.nome}</div>
      <div style={{ fontSize: 8, color: '#555', marginTop: 2 }}>Porção: {nutri.porcao || '100g'}</div>
      <div style={{ height: 1, background: '#666', margin: '4px 0' }} />
      {[
        ['Valor Energético', `${nutri.valorEnergeticoKcal || '—'}kcal / ${nutri.valorEnergeticoKJ || '—'}kJ`],
        ['Carboidratos', `${nutri.carboidratos || '—'}g`],
        ['Açúcares', `${nutri.acucaresTotais || '—'}g`],
        ['Proteínas', `${nutri.proteinas || '—'}g`],
        ['Gorduras totais', `${nutri.gordurasTotais || '—'}g`],
        ['Gord. saturadas', `${nutri.gordurasSaturadas || '—'}g`],
        ['Fibra alimentar', `${nutri.fibraAlimentar || '—'}g`],
        ['Sódio', `${nutri.sodio || '—'}mg`],
      ].map(([desc, val]) => (
        <div key={desc} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, borderBottom: '0.5px solid #ccc', padding: '2px 0' }}>
          <span>{desc}</span><span style={{ color: '#555' }}>{val}</span>
        </div>
      ))}
      <div style={{ height: 2, background: '#000', margin: '4px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#444', marginTop: 'auto' }}>
        <span>Fab: {dataPtBr}</span>
        <span>Val: {validade}</span>
        <span>Casa di Ana</span>
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
