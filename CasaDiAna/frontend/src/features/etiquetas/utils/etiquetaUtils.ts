// ─── Utilitário central de impressão de etiquetas ────────────────────────────

export function imprimirEtiquetaHtml(html: string): void {
  const win = window.open('', '_blank', 'width=600,height=400')
  if (!win) {
    alert(
      'Popup bloqueado pelo navegador. Permita popups para este site e tente novamente.',
    )
    return
  }
  win.document.write(html)
  win.document.close()
  win.onload = () => {
    win.print()
  }
  win.addEventListener('afterprint', () => win.close())
  setTimeout(() => {
    if (!win.closed) win.close()
  }, 8000)
}

const ETIQUETA_COMPLETA = { largura: '100mm', altura: '50mm' }
const ETIQUETA_SIMPLES = { largura: '70mm', altura: '40mm' }
const ETIQUETA_NUTRICIONAL = { largura: '70mm', altura: '130mm' }

export function baseStyle(largura: string, altura: string): string {
  return `
    @page { size: ${largura} ${altura}; margin: 0 !important; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: ${largura};
      min-width: ${largura};
      max-width: ${largura};
      margin: 0 !important;
      padding: 0 !important;
      background: #fff;
      font-family: Arial, Helvetica, sans-serif;
      overflow: visible;
    }
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .etiqueta {
      width: ${largura};
      min-width: ${largura};
      max-width: ${largura};
      height: ${altura};
      min-height: ${altura};
      max-height: ${altura};
      padding: 3mm 4mm;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .etiqueta:not(:last-child) {
      break-after: page;
      page-break-after: always;
    }
  `
}

export interface NutriValues {
  porcao: string
  kcal: string
  kj: string
  carbo: string
  acucares: string
  acucaresAdic: string
  proteinas: string
  gorduras: string
  gordSat: string
  gordTrans: string
  fibra: string
  sodio: string
  porcoesPorEmbalagem: string
  medidaCaseira: string
  vdValorEnergetico: string
  vdCarboidratos: string
  vdAcucaresAdicionados: string
  vdProteinas: string
  vdGordurasTotais: string
  vdGordurasSaturadas: string
  vdGordurasTrans: string
  vdFibraAlimentar: string
  vdSodio: string
}

function zplEscape(value: string): string {
  return value.replace(/[\^~\\]/g, ' ').trim()
}

function zplText(
  x: number,
  y: number,
  text: string,
  width: number,
  height: number,
  font = 22,
  align: 'L' | 'C' | 'R' = 'L',
  lines = 1,
): string {
  return `^FO${x},${y}^A0N,${height},${font}^FB${width},${lines},2,${align},0^FD${zplEscape(text)}^FS`
}

function downloadTexto(nomeArquivo: string, conteudo: string, mime = 'text/plain'): void {
  const blob = new Blob([conteudo], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

// ─── Etiqueta Completa (100×50mm) ────────────────────────────────────────────

export function htmlEtiquetaCompleta(
  produtoNome: string,
  dataProducao: string,
  validade: string,
  quantidade: number,
  logoBase64?: string,
): string {
  const topoHtml = logoBase64
    ? `<img src="data:image/png;base64,${logoBase64}" class="logo" alt="Casa di Ana" />`
    : `<span class="marca">Casa di Ana</span>`

  const etiqueta = `
    <div class="etiqueta">
      <div class="topo">${topoHtml}</div>
      <div class="ornamento">
        <div class="linha"></div>
        <div class="diamante">◆</div>
        <div class="linha"></div>
      </div>
      <div class="produto">${produtoNome}</div>
      <div class="rodape">
        <span>Fab: ${dataProducao}</span>
        <span class="val-data">Val: ${validade}</span>
      </div>
    </div>`

  const etiquetas = Array(quantidade).fill(etiqueta).join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=EB+Garamond:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
  <style>
    ${baseStyle(ETIQUETA_COMPLETA.largura, ETIQUETA_COMPLETA.altura)}

    .etiqueta {
      background: #FDFAF5;
      padding: 2mm 3mm;
      justify-content: space-between;
    }

    .topo {
      display: flex;
      justify-content: center;
      align-items: center;
      flex: 0 0 auto;
    }

    .logo {
      height: 13mm;
      width: auto;
      object-fit: contain;
    }

    .marca {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 13pt;
      font-weight: 700;
      color: #2C1A0E;
      letter-spacing: 0.5px;
    }

    .ornamento {
      display: flex;
      align-items: center;
      gap: 2mm;
      flex: 0 0 auto;
      margin: 0.5mm 0;
    }

    .ornamento .linha {
      flex: 1;
      height: 0.3mm;
      background: #C4870A;
      opacity: 0.6;
    }

    .ornamento .diamante {
      color: #C4870A;
      font-size: 5pt;
      line-height: 1;
    }

    .produto {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 14pt;
      font-weight: 700;
      color: #2C1A0E;
      text-align: center;
      line-height: 1.2;
      word-break: break-word;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .rodape {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: Arial, sans-serif;
      font-size: 6pt;
      color: #5C3A1E;
      border-top: 0.3mm solid #C4870A;
      padding-top: 1mm;
      flex: 0 0 auto;
    }

    .val-data {
      font-weight: bold;
      color: #2C1A0E;
    }
  </style>
</head>
<body>${etiquetas}</body>
</html>`
}

// ─── Etiqueta Simples (70×40mm) ──────────────────────────────────────────────

export function htmlEtiquetaSimples(
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

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${baseStyle(ETIQUETA_SIMPLES.largura, ETIQUETA_SIMPLES.altura)}

    .etiqueta {
      border: 0.5mm solid #333;
      justify-content: center;
      align-items: center;
      text-align: center;
      gap: 2.5mm;
    }

    .nome {
      font-size: 12pt;
      font-weight: bold;
      color: #1a1a1a;
      word-break: break-word;
      line-height: 1.15;
      max-height: 21mm;
      overflow: hidden;
    }

    .validade {
      font-size: 9pt;
      color: #333;
    }
  </style>
</head>
<body>${etiquetas}</body>
</html>`
}

// ─── Etiqueta Nutricional (70×130mm) ─────────────────────────────────────────

function parsePorcaoGramas(porcao: string): number {
  const match = porcao.match(/(\d+(?:[.,]\d+)?)\s*(?:g|ml)\b/i)
  return match ? parseFloat(match[1].replace(',', '.')) : 0
}

function parseValorNutricional(value: string): number {
  const match = value.trim().replace(',', '.').match(/-?\d+(?:\.\d+)?/)
  const parsed = match ? Number(match[0]) : 0
  return Number.isFinite(parsed) ? parsed : 0
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

export function zplEtiquetaNutricional(
  produtoNome: string,
  _dataProducao: string,
  _validade: string,
  quantidade: number,
  nutri: NutriValues,
): string {
  const kcal = parseValorNutricional(nutri.kcal)
  const carbo = parseValorNutricional(nutri.carbo)
  const acucares = parseValorNutricional(nutri.acucares)
  const acucaresAdic = parseValorNutricional(nutri.acucaresAdic)
  const prot = parseValorNutricional(nutri.proteinas)
  const gord = parseValorNutricional(nutri.gorduras)
  const gordSat = parseValorNutricional(nutri.gordSat)
  const gordTrans = parseValorNutricional(nutri.gordTrans)
  const fibra = parseValorNutricional(nutri.fibra)
  const sodio = parseValorNutricional(nutri.sodio)
  const porcaoG = parsePorcaoGramas(nutri.porcao)
  const dash = '-'

  const vdManual = (value: string) => value.trim()
  const valor100 = (value: number) => fmt100(value, porcaoG)
  const porcaoLabel = nutri.medidaCaseira
    ? `${nutri.porcao} (${nutri.medidaCaseira})`
    : nutri.porcao

  type Row = { indent: 0 | 1 | 2; bold: boolean; nome: string; cem: string; cinquenta: string; vd: string }
  const rows: Row[] = [
    {
      indent: 0,
      bold: true,
      nome: 'Valor energetico (kcal)',
      cem: kcal > 0 ? fmt100(kcal, porcaoG) : dash,
      cinquenta: kcal > 0 ? fmtPeso(kcal, porcaoG, 50) : dash,
      vd: vdManual(nutri.vdValorEnergetico),
    },
    { indent: 0, bold: true, nome: 'Carboidratos (g)', cem: valor100(carbo), cinquenta: fmtPeso(carbo, porcaoG, 50), vd: vdManual(nutri.vdCarboidratos) },
    { indent: 1, bold: false, nome: 'Acucares totais (g)', cem: valor100(acucares), cinquenta: fmtPeso(acucares, porcaoG, 50), vd: '' },
    { indent: 2, bold: false, nome: 'Acucares adicionados (g)', cem: valor100(acucaresAdic), cinquenta: fmtPeso(acucaresAdic, porcaoG, 50), vd: vdManual(nutri.vdAcucaresAdicionados) },
    { indent: 0, bold: true, nome: 'Proteinas (g)', cem: valor100(prot), cinquenta: fmtPeso(prot, porcaoG, 50), vd: vdManual(nutri.vdProteinas) },
    { indent: 0, bold: true, nome: 'Gorduras totais (g)', cem: valor100(gord), cinquenta: fmtPeso(gord, porcaoG, 50), vd: vdManual(nutri.vdGordurasTotais) },
    { indent: 1, bold: false, nome: 'Gorduras saturadas (g)', cem: valor100(gordSat), cinquenta: fmtPeso(gordSat, porcaoG, 50), vd: vdManual(nutri.vdGordurasSaturadas) },
    { indent: 1, bold: false, nome: 'Gorduras trans (g)', cem: valor100(gordTrans), cinquenta: fmtPeso(gordTrans, porcaoG, 50), vd: vdManual(nutri.vdGordurasTrans) },
    { indent: 0, bold: true, nome: 'Fibra alimentar (g)', cem: valor100(fibra), cinquenta: fmtPeso(fibra, porcaoG, 50), vd: vdManual(nutri.vdFibraAlimentar) },
    { indent: 0, bold: true, nome: 'Sodio (mg)', cem: valor100(sodio), cinquenta: fmtPeso(sodio, porcaoG, 50), vd: vdManual(nutri.vdSodio) },
  ]

  const labelWidth = 800
  const labelHeight = 1200
  const left = 0
  const right = 817
  const tableTop = 205
  const headerHeight = 32
  const rowHeight = 34
  const tableHeight = headerHeight + rows.length * rowHeight
  const noteTop = tableTop + tableHeight + 2
  const col1 = left
  const col2 = 458
  const col3 = 575
  const col4 = 665

  const drawLine = (x: number, y: number, w: number, h: number) => `^FO${x},${y}^GB${w},${h},2^FS`
  const drawBox = (x: number, y: number, w: number, h: number, t = 3) => `^FO${x},${y}^GB${w},${h},${t}^FS`

  const renderLabel = () => {
    const zplRows = rows.map((row, index) => {
      const y = tableTop + headerHeight + index * rowHeight + 8
      const nameX = col1 + 10 + (row.indent * 8)
      const nameFont = row.bold ? 17 : 16
      return [
        zplText(nameX, y, row.nome, col2 - nameX - 8, nameFont, nameFont, 'L', 1),
        zplText(col2 + 6, y, row.cem, col3 - col2 - 12, 19, 19, 'R', 2),
        zplText(col3 + 4, y, row.cinquenta, col4 - col3 - 8, 19, 19, 'R', 2),
        zplText(col4 + 6, y, row.vd, right - col4 - 12, 19, 19, 'C', 1),
      ].join('\n')
    }).join('\n')

    const horizontalLines = Array.from({ length: rows.length - 1 }, (_, index) =>
      drawLine(left, tableTop + headerHeight + (index + 1) * rowHeight, right - left, 1),
    ).join('\n')

    return `^XA
^CI28
^PW${labelWidth}
^LL${labelHeight}
^LH0,0
^LS0
^LT0
^PON
^PR3
${drawBox(0, 0, 817, 606, 2)}
${zplText(left + 8, 8, 'INFORMACAO NUTRICIONAL', right - left - 16, 32, 32, 'C')}
${drawLine(left, 54, right - left, 2)}
${zplText(left + 10, 70, produtoNome, right - left - 20, 26, 26, 'C', 2)}
${drawLine(left, 132, right - left, 2)}
${zplText(left + 10, 142, `Porcoes por embalagem: ${nutri.porcoesPorEmbalagem || '-'}`, right - left - 20, 20, 20, 'L')}
${zplText(left + 10, 166, `Porcao: ${porcaoLabel}`, right - left - 20, 20, 20, 'L')}
${drawLine(left, tableTop, right - left, 2)}
${drawLine(left, tableTop + tableHeight, right - left, 2)}
${drawLine(col2, tableTop, 2, tableHeight)}
${drawLine(col3, tableTop, 2, tableHeight)}
${drawLine(col4, tableTop, 2, tableHeight)}
${drawLine(left, tableTop + headerHeight, right - left, 2)}
${zplText(col2 + 6, tableTop + 6, '100g', col3 - col2 - 12, 21, 21, 'R')}
${zplText(col3 + 4, tableTop + 6, '50g', col4 - col3 - 8, 21, 21, 'R')}
${zplText(col4 + 6, tableTop + 6, '%VD(*)', right - col4 - 12, 21, 21, 'C')}
${horizontalLines}
${zplRows}
${zplText(left + 8, noteTop, '*percentual de valores diarios fornecidos pela porcao.', right - left - 16, 17, 17, 'L', 1)}
^XZ`
  }

  return Array.from({ length: Math.max(1, quantidade) }, renderLabel).join('\n')
}

export function baixarEtiquetaNutricionalZpl(
  produtoNome: string,
  dataProducao: string,
  validade: string,
  quantidade: number,
  nutri: NutriValues,
): void {
  const nomeArquivo = `etiqueta-nutricional-${produtoNome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'produto'}.zpl`

  downloadTexto(nomeArquivo, zplEtiquetaNutricional(produtoNome, dataProducao, validade, quantidade, nutri))
}

export function htmlEtiquetaNutricional(
  produtoNome: string,
  _dataProducao: string,
  _validade: string,
  quantidade: number,
  nutri: NutriValues,
): string {
  const kcal = parseValorNutricional(nutri.kcal)
  const carbo = parseValorNutricional(nutri.carbo)
  const acucares = parseValorNutricional(nutri.acucares)
  const acucaresAdic = parseValorNutricional(nutri.acucaresAdic)
  const prot = parseValorNutricional(nutri.proteinas)
  const gord = parseValorNutricional(nutri.gorduras)
  const gordSat = parseValorNutricional(nutri.gordSat)
  const gordTrans = parseValorNutricional(nutri.gordTrans)
  const fibra = parseValorNutricional(nutri.fibra)
  const sodio = parseValorNutricional(nutri.sodio)
  const porcaoG = parsePorcaoGramas(nutri.porcao)

  const vdManual = (value: string) => value.trim()
  const porcaoLabel = nutri.medidaCaseira
    ? `${nutri.porcao} (${nutri.medidaCaseira})`
    : nutri.porcao

  const row = (
    bold: boolean,
    indent: 0 | 1 | 2,
    nome: string,
    cem: string,
    cinquenta: string,
    vdVal: string,
  ) => {
    const indentClass = indent === 2 ? 'indent-2' : indent === 1 ? 'indent-1' : ''
    return `
    <tr>
      <td class="${bold ? 'bold' : ''} ${indentClass}">
        ${nome}
      </td>
      <td class="num">
        ${cem}
      </td>
      <td class="num">
        ${cinquenta}
      </td>
      <td class="vd">
        ${vdVal}
      </td>
    </tr>`
  }

  const etiqueta = `
    <div class="etiqueta">
      <div class="nutricional">
      <div class="nutri-title">INFORMAÇÃO NUTRICIONAL</div>
      <div class="line title-line"></div>
      <div class="product-name">${produtoNome}</div>
      <div class="line product-line"></div>
      <div class="portion">
        <div><strong>Porções por embalagem:</strong> ${nutri.porcoesPorEmbalagem || '—'}</div>
        <div><strong>Porção:</strong> ${porcaoLabel}</div>
      </div>

      <table class="nutri-table">
        <colgroup>
          <col style="width:56%">
          <col style="width:15%">
          <col style="width:11%">
          <col style="width:18%">
        </colgroup>
        <thead>
          <tr>
            <th>&nbsp;</th>
            <th>100g</th>
            <th>50g</th>
            <th>%VD(*)</th>
          </tr>
        </thead>
        <tbody>
          ${row(true, 0,
            'Valor energético (kcal)',
            kcal > 0 ? fmt100(kcal, porcaoG) : '—',
            kcal > 0 ? fmtPeso(kcal, porcaoG, 50) : '—',
            vdManual(nutri.vdValorEnergetico),
          )}
          ${row(true, 0, 'Carboidratos (g)', fmt100(carbo, porcaoG), fmtPeso(carbo, porcaoG, 50), vdManual(nutri.vdCarboidratos))}
          ${row(false, 1, 'Açúcares totais (g)', fmt100(acucares, porcaoG), fmtPeso(acucares, porcaoG, 50), '')}
          ${row(false, 2, 'Açúcares adicionados (g)', fmt100(acucaresAdic, porcaoG), fmtPeso(acucaresAdic, porcaoG, 50), vdManual(nutri.vdAcucaresAdicionados))}
          ${row(true, 0, 'Proteínas (g)', fmt100(prot, porcaoG), fmtPeso(prot, porcaoG, 50), vdManual(nutri.vdProteinas))}
          ${row(true, 0, 'Gorduras totais (g)', fmt100(gord, porcaoG), fmtPeso(gord, porcaoG, 50), vdManual(nutri.vdGordurasTotais))}
          ${row(false, 1, 'Gorduras saturadas (g)', fmt100(gordSat, porcaoG), fmtPeso(gordSat, porcaoG, 50), vdManual(nutri.vdGordurasSaturadas))}
          ${row(false, 1, 'Gorduras trans (g)', fmt100(gordTrans, porcaoG), fmtPeso(gordTrans, porcaoG, 50), vdManual(nutri.vdGordurasTrans))}
          ${row(true, 0, 'Fibra alimentar (g)', fmt100(fibra, porcaoG), fmtPeso(fibra, porcaoG, 50), vdManual(nutri.vdFibraAlimentar))}
          ${row(true, 0, 'Sódio (mg)', fmt100(sodio, porcaoG), fmtPeso(sodio, porcaoG, 50), vdManual(nutri.vdSodio))}
        </tbody>
      </table>

      <div class="note">
        *percentual de valores diários fornecidos pela porção.
      </div>

      </div>
    </div>`

  const etiquetas = Array(quantidade).fill(etiqueta).join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${baseStyle(ETIQUETA_NUTRICIONAL.largura, ETIQUETA_NUTRICIONAL.altura)}
    @page { size: 70mm 130mm portrait; margin: 0 !important; }
    html, body {
      width: 70mm !important;
      min-width: 70mm !important;
      max-width: 70mm !important;
      height: 130mm !important;
      min-height: 130mm !important;
      max-height: 130mm !important;
      overflow: visible !important;
    }
    .etiqueta {
      position: relative;
      display: block;
      width: 70mm;
      min-width: 70mm;
      max-width: 70mm;
      height: 130mm;
      min-height: 130mm;
      max-height: 130mm;
      padding: 0;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .nutricional {
      position: absolute;
      top: 2mm;
      left: 3mm;
      width: 65.33mm;
      height: 72mm;
      max-height: 72mm;
      font-family: 'Arial Narrow', Arial, sans-serif;
      font-weight: 700;
      overflow: hidden;
      background: #fff;
      color: #000;
    }
    .nutricional::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      box-sizing: border-box;
      border: 0.38mm solid #000;
      pointer-events: none;
      z-index: 10;
    }
    .nutri-title {
      position: absolute;
      top: 1mm;
      left: 1mm;
      width: 62mm;
      height: 5mm;
      font-size: 18px;
      font-weight: 700;
      line-height: 5mm;
      letter-spacing: 0;
      text-align: center;
      color: #000;
      overflow: hidden;
    }
    .line {
      position: absolute;
      left: 0;
      width: 65.33mm;
      height: 0.25mm;
      background: #000;
    }
    .title-line {
      top: 5.85mm;
      height: 0.25mm;
    }
    .product-name {
      position: absolute;
      top: 7.6mm;
      left: 1.25mm;
      width: 61.5mm;
      height: 5.9mm;
      font-size: 15px;
      font-weight: 700;
      line-height: 2.9mm;
      text-align: center;
      color: #000;
      overflow: hidden;
      overflow-wrap: anywhere;
    }
    .product-line {
      top: 14.3mm;
      height: 0.25mm;
    }
    .portion {
      position: absolute;
      top: 16mm;
      left: 1.25mm;
      width: 61.5mm;
      height: 6.5mm;
      font-size: 10.5px;
      line-height: 3.2mm;
      color: #000;
      overflow: hidden;
      overflow-wrap: anywhere;
    }
    .nutri-table {
      position: absolute;
      top: 23mm;
      left: 0;
      width: 65.33mm;
      height: 44mm;
      border-collapse: separate;
      border-spacing: 0;
      table-layout: fixed;
      background: #fff;
      border-top: 0.38mm solid #000;
      border-bottom: 0.38mm solid #000;
      overflow: hidden;
      z-index: 1;
    }
    thead tr,
    tbody tr {
      break-inside: avoid;
      page-break-inside: avoid;
      height: 4mm;
    }
    thead tr {
      height: 3.8mm;
    }
    th,
    td {
      padding: 0.04mm 0.75mm;
      font-size: 12px;
      font-weight: 700;
      line-height: 1;
      vertical-align: top;
      color: #000;
      overflow: hidden;
      overflow-wrap: anywhere;
    }
    th {
      font-weight: 700;
      vertical-align: middle;
      border-bottom: 0.25mm solid #000;
    }
    th:first-child,
    td:first-child {
      text-align: left;
      font-size: 9.8px;
      white-space: nowrap;
      overflow-wrap: normal;
      vertical-align: middle;
    }
    th:nth-child(2),
    th:nth-child(4) {
      text-align: right;
    }
    th:nth-child(3) {
      text-align: center;
    }
    th:not(:first-child),
    td:not(:first-child) {
      border-left: 0.125mm solid #000;
    }
    tbody td {
      border-bottom: 0.125mm solid #000;
    }
    tbody tr:last-child td {
      border-bottom: 0;
    }
    .bold {
      font-weight: bold;
    }
    .indent-1 {
      padding-left: 1.8mm;
    }
    .indent-2 {
      padding-left: 2.4mm;
    }
    .num {
      text-align: right;
      white-space: normal;
    }
    .vd {
      text-align: center;
      white-space: normal;
    }
    .note {
      position: absolute;
      top: 67.2mm;
      left: 1mm;
      width: 62mm;
      height: 3.3mm;
      font-size: 10px;
      line-height: 1;
      color: #000;
      overflow: hidden;
      background: #fff;
      z-index: 2;
      white-space: nowrap;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body>${etiquetas}</body>
</html>`
}
