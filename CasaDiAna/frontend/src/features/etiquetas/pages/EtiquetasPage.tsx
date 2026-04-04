import { useEffect, useState } from 'react'
import { PrinterIcon, ClockIcon } from '@heroicons/react/24/outline'
import { produtosService } from '@/features/producao/produtos/services/produtosService'
import { etiquetasService, type TipoEtiqueta, type HistoricoImpressao } from '@/lib/etiquetasService'
import type { Produto } from '@/types/producao'

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatarData(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString('pt-BR')
}

function calcularValidade(dataProducao: string, diasValidade: number | null): string {
  if (!diasValidade) return '—'
  const d = new Date(dataProducao)
  d.setDate(d.getDate() + diasValidade)
  return d.toLocaleDateString('pt-BR')
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
): string {
  const etiqueta = `
    <div class="etiqueta">
      <div class="titulo">INFORMAÇÃO NUTRICIONAL</div>
      <div class="sep-thick"></div>
      <div class="produto">${produtoNome}</div>
      <div class="sep"></div>
      <table>
        <tr><td class="desc">Valor Energético</td><td class="val">___kcal / ___kJ</td></tr>
        <tr><td class="desc">Carboidratos</td><td class="val">___g</td></tr>
        <tr><td class="desc">Açúcares totais</td><td class="val">___g</td></tr>
        <tr><td class="desc">Proteínas</td><td class="val">___g</td></tr>
        <tr><td class="desc">Gorduras totais</td><td class="val">___g</td></tr>
        <tr><td class="desc">Gorduras saturadas</td><td class="val">___g</td></tr>
        <tr><td class="desc">Fibra alimentar</td><td class="val">___g</td></tr>
        <tr><td class="desc">Sódio</td><td class="val">___mg</td></tr>
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
    .sep { height: 0.3mm; background: #666; margin: 1.5mm 0; }
    .produto { font-size: 10pt; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; flex: 1; }
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
}

function LabelPreview({ produto, tipo, dataProducao }: PreviewProps) {
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

  const validade = calcularValidade(dataProducao, produto.diasValidade)
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
      <div style={{ height: 1, background: '#666', margin: '4px 0' }} />
      {[
        ['Valor Energético', '___kcal'],
        ['Carboidratos', '___g'],
        ['Açúcares', '___g'],
        ['Proteínas', '___g'],
        ['Gorduras totais', '___g'],
        ['Gord. saturadas', '___g'],
        ['Fibra alimentar', '___g'],
        ['Sódio', '___mg'],
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
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [produtoId, setProdutoId] = useState('')
  const [tipo, setTipo] = useState<TipoEtiqueta>(1)
  const [dataProducao, setDataProducao] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [quantidade, setQuantidade] = useState(1)
  const [historico, setHistorico] = useState<HistoricoImpressao[]>([])
  const [imprimindo, setImprimindo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const produto = produtos.find(p => p.id === produtoId) ?? null

  useEffect(() => {
    produtosService.listar().then(setProdutos).catch(() => {})
    etiquetasService.listarHistorico().then(setHistorico).catch(() => {})
  }, [])

  const handleImprimir = async () => {
    if (!produto) return
    setImprimindo(true)
    setErro(null)

    try {
      const validade = calcularValidade(dataProducao, produto.diasValidade)
      const dataPtBr = new Date(dataProducao).toLocaleDateString('pt-BR')

      let html = ''
      if (tipo === 1) html = htmlEtiquetaCompleta(produto.nome, dataPtBr, validade, quantidade)
      else if (tipo === 2) html = htmlEtiquetaSimples(produto.nome, validade, quantidade)
      else html = htmlEtiquetaNutricional(produto.nome, dataPtBr, validade, quantidade)

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
                  {p.nome}{p.diasValidade ? ` (${p.diasValidade} dias)` : ' (sem validade)'}
                </option>
              ))}
            </select>
            {produto && !produto.diasValidade && (
              <p className="text-xs mt-1" style={{ color: '#d97706' }}>
                Este produto não tem dias de validade cadastrado. A data de validade aparecerá como —.
              </p>
            )}
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
            <LabelPreview produto={produto} tipo={tipo} dataProducao={dataProducao} />
          </div>
          <p className="text-xs text-center mt-4" style={{ color: 'var(--ada-muted)' }}>
            {TIPO_LABELS[tipo]} · {tiposOpcoes.find(o => o.valor === tipo)?.dim}
            {produto?.diasValidade
              ? ` · Validade: ${calcularValidade(dataProducao, produto.diasValidade)}`
              : ''}
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
                  {['Produto', 'Tipo', 'Qtd', 'Data de Produção', 'Validade', 'Impresso em'].map(h => (
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
                  const prod = produtos.find(p => p.id === h.produtoId)
                  const validade = calcularValidade(h.dataProducao, prod?.diasValidade ?? null)
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
