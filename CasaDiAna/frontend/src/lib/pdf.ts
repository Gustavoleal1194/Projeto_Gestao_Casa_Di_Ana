import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { EstoqueAtualItem, MovimentacaoRelatorio, EntradaRelatorioResumo, InsumoProducaoDia } from '@/types/estoque'
import type { RelatorioProducaoVendasItem } from '@/types/producao'

const BRAND = 'Casa di Ana'
const PRIMARY = [146, 64, 14] as [number, number, number]   // amber-800
const LIGHT   = [245, 245, 244] as [number, number, number]  // stone-100

function cabecalho(doc: jsPDF, titulo: string, subtitulo?: string) {
  // Fundo do header
  doc.setFillColor(...PRIMARY)
  doc.rect(0, 0, doc.internal.pageSize.width, 22, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(BRAND, 14, 10)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(titulo, 14, 17)

  if (subtitulo) {
    doc.setFontSize(9)
    doc.text(subtitulo, doc.internal.pageSize.width - 14, 17, { align: 'right' })
  }

  // Linha separadora
  doc.setDrawColor(...PRIMARY)
  doc.setLineWidth(0.5)
  doc.line(0, 22, doc.internal.pageSize.width, 22)

  doc.setTextColor(0, 0, 0)
}

function rodape(doc: jsPDF) {
  const total = (doc.internal as any).getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    const w = doc.internal.pageSize.width
    const h = doc.internal.pageSize.height
    doc.setFontSize(8)
    doc.setTextColor(120, 113, 108)
    doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, h - 8)
    doc.text(`Página ${i} de ${total}`, w - 14, h - 8, { align: 'right' })
  }
}

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function pct(v: number | null) {
  return v != null ? `${v.toFixed(1)}%` : '—'
}

// ─── Estoque Atual ────────────────────────────────────────────────────────────
export function gerarPdfEstoqueAtual(itens: EstoqueAtualItem[], apenasAbaixo: boolean) {
  const doc = new jsPDF({ orientation: 'landscape' })
  const subtitulo = `Gerado em ${new Date().toLocaleDateString('pt-BR')}${apenasAbaixo ? ' · Apenas abaixo do mínimo' : ''}`
  cabecalho(doc, 'Relatório de Estoque Atual', subtitulo)

  autoTable(doc, {
    startY: 27,
    head: [['Ingrediente', 'Categoria', 'Un.', 'Estoque Atual', 'Mínimo', 'Máximo', 'Situação']],
    body: itens.map(i => [
      i.nome,
      i.categoriaNome ?? '—',
      i.unidadeMedidaCodigo,
      i.estoqueAtual.toString(),
      i.estoqueMinimo.toString(),
      i.estoqueMaximo?.toString() ?? '—',
      i.estaBaixoDoMinimo ? 'Abaixo do mínimo' : 'OK',
    ]),
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: LIGHT },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'center' },
    },
    didParseCell(data) {
      if (data.column.index === 6 && data.section === 'body') {
        const v = data.cell.raw as string
        if (v === 'Abaixo do mínimo') {
          data.cell.styles.textColor = [185, 28, 28]
          data.cell.styles.fontStyle = 'bold'
        } else {
          data.cell.styles.textColor = [21, 128, 61]
        }
      }
    },
  })

  rodape(doc)
  doc.save(`estoque-atual-${new Date().toISOString().split('T')[0]}.pdf`)
}

// ─── Movimentações ────────────────────────────────────────────────────────────
export function gerarPdfMovimentacoes(
  movs: MovimentacaoRelatorio[],
  de: string,
  ate: string,
) {
  const doc = new jsPDF({ orientation: 'landscape' })
  cabecalho(doc, 'Relatório de Movimentações de Estoque', `Período: ${de} a ${ate}`)

  autoTable(doc, {
    startY: 27,
    head: [['Data/Hora', 'Ingrediente', 'Un.', 'Tipo', 'Quantidade', 'Saldo Após', 'Referência']],
    body: movs.map(m => {
      const sinal = m.tipo.includes('Saida') || m.tipo.includes('Negativo') ? '-' : '+'
      return [
        new Date(m.criadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
        m.ingredienteNome,
        m.unidadeMedidaCodigo,
        m.tipo,
        `${sinal}${m.quantidade}`,
        m.saldoApos.toString(),
        m.referenciaTipo ?? '—',
      ]
    }),
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: LIGHT },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
    didParseCell(data) {
      if (data.column.index === 4 && data.section === 'body') {
        const v = data.cell.raw as string
        data.cell.styles.textColor = v.startsWith('-') ? [185, 28, 28] : [21, 128, 61]
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  rodape(doc)
  doc.save(`movimentacoes-${de}-${ate}.pdf`)
}

// ─── Entradas ─────────────────────────────────────────────────────────────────
export function gerarPdfEntradas(resumo: EntradaRelatorioResumo, de: string, ate: string) {
  const doc = new jsPDF({ orientation: 'landscape' })
  cabecalho(doc, 'Relatório de Entradas de Mercadoria', `Período: ${de} a ${ate}`)

  // Resumo
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  let y = 30
  doc.text(`Total de Entradas: ${resumo.totalEntradas}`, 14, y)
  doc.text(`Confirmadas: ${resumo.totalEntradasConfirmadas}`, 70, y)
  doc.text(`Custo Total (Confirmadas): ${brl(resumo.custoTotalConfirmadas)}`, 120, y)
  y += 8

  autoTable(doc, {
    startY: y,
    head: [['Fornecedor', 'Nota Fiscal', 'Data', 'Status', 'Itens', 'Custo Total']],
    body: resumo.entradas.map(e => [
      e.fornecedorNome,
      e.numeroNotaFiscal ?? '—',
      new Date(e.dataEntrada + 'T12:00:00').toLocaleDateString('pt-BR'),
      e.status,
      e.totalItens.toString(),
      brl(e.custoTotal),
    ]),
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: LIGHT },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      3: { halign: 'center' },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
    didParseCell(data) {
      if (data.column.index === 3 && data.section === 'body') {
        const v = data.cell.raw as string
        data.cell.styles.textColor = v === 'Confirmada' ? [21, 128, 61] : [185, 28, 28]
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  rodape(doc)
  doc.save(`entradas-${de}-${ate}.pdf`)
}

// ─── Produção / Vendas ────────────────────────────────────────────────────────
export function gerarPdfProducaoVendas(
  itens: RelatorioProducaoVendasItem[],
  de: string,
  ate: string,
) {
  const doc = new jsPDF({ orientation: 'landscape' })
  cabecalho(doc, 'Relatório de Produção e Vendas', `Período: ${de} a ${ate}`)

  // Totais
  const tot = itens.reduce(
    (a, i) => ({
      produzido: a.produzido + i.totalProduzido,
      vendido: a.vendido + i.totalVendido,
      perda: a.perda + i.perda,
      custoProducao: a.custoProducao + i.custoTotalProducao,
      custoPerda: a.custoPerda + i.custoPerda,
      receita: a.receita + i.receitaEstimada,
    }),
    { produzido: 0, vendido: 0, perda: 0, custoProducao: 0, custoPerda: 0, receita: 0 },
  )

  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  let y = 30
  doc.text(`Produzido: ${tot.produzido.toFixed(0)}`, 14, y)
  doc.text(`Vendido: ${tot.vendido.toFixed(0)}`, 55, y)
  doc.text(`Perda: ${tot.perda.toFixed(0)}`, 96, y)
  doc.text(`Custo Produção: ${brl(tot.custoProducao)}`, 130, y)
  doc.text(`Custo Perda: ${brl(tot.custoPerda)}`, 185, y)
  doc.text(`Receita Estimada: ${brl(tot.receita)}`, 230, y)
  y += 8

  autoTable(doc, {
    startY: y,
    head: [['Produto', 'Preço Venda', 'Produzido', 'Vendido', 'Perda', 'Custo Prod.', 'Custo Médio', 'Receita Est.', 'Mg. Lucro', 'Mg. Perda']],
    body: itens.map(i => [
      i.produtoNome,
      brl(i.precoVenda),
      i.totalProduzido.toFixed(0),
      i.totalVendido.toFixed(0),
      i.perda.toFixed(0),
      brl(i.custoTotalProducao),
      brl(i.custoMedioUnitario),
      brl(i.receitaEstimada),
      pct(i.margemLucro),
      pct(i.margemPerda),
    ]),
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles: { fillColor: LIGHT },
    styles: { fontSize: 7.5, cellPadding: 3 },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right' },
      8: { halign: 'right' },
      9: { halign: 'right' },
    },
    didParseCell(data) {
      if (data.section !== 'body') return
      if (data.column.index === 4 && Number(data.cell.raw) > 0) {
        data.cell.styles.textColor = [185, 28, 28]
        data.cell.styles.fontStyle = 'bold'
      }
      if (data.column.index === 7) {
        data.cell.styles.textColor = [21, 128, 61]
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  rodape(doc)
  doc.save(`producao-vendas-${de}-${ate}.pdf`)
}

// ─── Insumos por Produção ─────────────────────────────────────────────────────
export function gerarPdfInsumosProducao(
  itens: InsumoProducaoDia[],
  de: string,
  ate: string,
) {
  const doc = new jsPDF({ orientation: 'landscape' })
  cabecalho(doc, 'Insumos por Produção', `Período: ${de} a ${ate}`)

  const totalQtd = itens.reduce((a, i) => a + i.quantidade, 0)
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text(`Total de lançamentos: ${itens.length}`, 14, 30)

  autoTable(doc, {
    startY: 38,
    head: [['Data', 'Produto', 'Ingrediente', 'Quantidade', 'Un.']],
    body: itens.map(i => [
      i.data,
      i.produtoNome,
      i.ingredienteNome,
      i.quantidade.toFixed(3),
      i.unidadeMedidaCodigo,
    ]),
    foot: [['', '', 'Total', totalQtd.toFixed(3), '']],
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    footStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: LIGHT },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      3: { halign: 'right' },
      4: { halign: 'center' },
    },
  })

  rodape(doc)
  doc.save(`insumos-producao-${de}-${ate}.pdf`)
}
