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
const ETIQUETA_NUTRICIONAL = { largura: '100mm', altura: '150mm' }

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

// ─── Etiqueta Nutricional (100×150mm) ────────────────────────────────────────

function parsePorcaoGramas(porcao: string): number {
  const match = porcao.match(/(\d+(?:[.,]\d+)?)\s*(?:g|ml)\b/i)
  return match ? parseFloat(match[1].replace(',', '.')) : 0
}

function fmt100(value: number, porcaoG: number): string {
  if (!value || !porcaoG) return '—'
  const v = (value / porcaoG) * 100
  return v % 1 === 0 ? String(Math.round(v)) : v.toFixed(1)
}

function fmtPeso(value: number, porcaoG: number, pesoG: number): string {
  if (!value || !porcaoG) return '—'
  const v = (value / porcaoG) * pesoG
  return v % 1 === 0 ? String(Math.round(v)) : v.toFixed(1)
}

export function zplEtiquetaNutricional(
  produtoNome: string,
  dataProducao: string,
  validade: string,
  quantidade: number,
  nutri: NutriValues,
): string {
  const kcal = Number(nutri.kcal) || 0
  const kj = Number(nutri.kj) || 0
  const carbo = Number(nutri.carbo) || 0
  const acucares = Number(nutri.acucares) || 0
  const acucaresAdic = Number(nutri.acucaresAdic) || 0
  const prot = Number(nutri.proteinas) || 0
  const gord = Number(nutri.gorduras) || 0
  const gordSat = Number(nutri.gordSat) || 0
  const gordTrans = Number(nutri.gordTrans) || 0
  const fibra = Number(nutri.fibra) || 0
  const sodio = Number(nutri.sodio) || 0
  const porcaoG = parsePorcaoGramas(nutri.porcao)
  const dash = '-'

  const vd = (value: number, ref: number) =>
    value > 0 ? `${Math.round((value / ref) * 100)}%` : dash
  const valor100 = (value: number, unit: string) => `${fmt100(value, porcaoG)} ${unit}`
  const porcaoLabel = nutri.medidaCaseira
    ? `${nutri.porcao} (${nutri.medidaCaseira})`
    : nutri.porcao

  type Row = { indent: 0 | 1 | 2; bold: boolean; nome: string; cem: string; cinquenta: string; vd: string }
  const rows: Row[] = [
    {
      indent: 0,
      bold: true,
      nome: 'Valor energetico',
      cem: kcal > 0 ? `${fmt100(kcal, porcaoG)} kcal / ${fmt100(kj, porcaoG)} kJ` : dash,
      cinquenta: kcal > 0 ? `${fmtPeso(kcal, porcaoG, 50)} kcal / ${fmtPeso(kj, porcaoG, 50)} kJ` : dash,
      vd: vd(kcal, 2000),
    },
    { indent: 0, bold: true, nome: 'Carboidratos', cem: valor100(carbo, 'g'), cinquenta: `${fmtPeso(carbo, porcaoG, 50)} g`, vd: vd(carbo, 300) },
    { indent: 1, bold: false, nome: 'Acucares totais', cem: valor100(acucares, 'g'), cinquenta: `${fmtPeso(acucares, porcaoG, 50)} g`, vd: '**' },
    { indent: 2, bold: false, nome: 'Acucares adicionados', cem: valor100(acucaresAdic, 'g'), cinquenta: `${fmtPeso(acucaresAdic, porcaoG, 50)} g`, vd: '**' },
    { indent: 0, bold: true, nome: 'Proteinas', cem: valor100(prot, 'g'), cinquenta: `${fmtPeso(prot, porcaoG, 50)} g`, vd: vd(prot, 75) },
    { indent: 0, bold: true, nome: 'Gorduras totais', cem: valor100(gord, 'g'), cinquenta: `${fmtPeso(gord, porcaoG, 50)} g`, vd: vd(gord, 65) },
    { indent: 1, bold: false, nome: 'Gorduras saturadas', cem: valor100(gordSat, 'g'), cinquenta: `${fmtPeso(gordSat, porcaoG, 50)} g`, vd: vd(gordSat, 22) },
    { indent: 1, bold: false, nome: 'Gorduras trans', cem: valor100(gordTrans, 'g'), cinquenta: `${fmtPeso(gordTrans, porcaoG, 50)} g`, vd: '**' },
    { indent: 0, bold: true, nome: 'Fibra alimentar', cem: valor100(fibra, 'g'), cinquenta: `${fmtPeso(fibra, porcaoG, 50)} g`, vd: vd(fibra, 25) },
    { indent: 0, bold: true, nome: 'Sodio', cem: valor100(sodio, 'mg'), cinquenta: `${fmtPeso(sodio, porcaoG, 50)} mg`, vd: vd(sodio, 2300) },
  ]

  const labelWidth = 800
  const labelHeight = 1200
  const left = 0
  const right = 800
  const tableTop = 185
  const headerHeight = 40
  const rowHeight = 45
  const tableHeight = headerHeight + rows.length * rowHeight
  const col1 = left
  const col2 = 350
  const col3 = 505
  const col4 = 602

  const drawLine = (x: number, y: number, w: number, h: number) => `^FO${x},${y}^GB${w},${h},2^FS`
  const drawBox = (x: number, y: number, w: number, h: number, t = 3) => `^FO${x},${y}^GB${w},${h},${t}^FS`

  const renderLabel = () => {
    const zplRows = rows.map((row, index) => {
      const y = tableTop + headerHeight + index * rowHeight + 11
      const nameX = col1 + 10 + (row.indent * 18)
      const nameFont = row.bold ? 22 : 21
      return [
        zplText(nameX, y, row.nome, col2 - nameX - 8, nameFont, nameFont, 'L', 1),
        zplText(col2 + 6, y, row.cem, col3 - col2 - 12, 19, 19, 'R', 2),
        zplText(col3 + 4, y, row.cinquenta, col4 - col3 - 8, 19, 19, 'R', 2),
        zplText(col4 + 6, y, row.vd, right - col4 - 12, 19, 19, 'C', 1),
      ].join('\n')
    }).join('\n')

    const horizontalLines = Array.from({ length: rows.length + 1 }, (_, index) =>
      drawLine(left, tableTop + headerHeight + index * rowHeight, right - left, 1),
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
${drawBox(0, 0, 800, 1110, 3)}
${zplText(left + 8, 8, 'INFORMACAO NUTRICIONAL', right - left - 16, 32, 32, 'C')}
${drawLine(left, 54, right - left, 2)}
${zplText(left + 10, 70, produtoNome, right - left - 20, 26, 26, 'C', 2)}
${drawLine(left, 132, right - left, 2)}
${zplText(left + 10, 148, `Porcao: ${porcaoLabel}${nutri.porcoesPorEmbalagem ? ` - ${nutri.porcoesPorEmbalagem} porcoes por embalagem` : ''}`, right - left - 20, 20, 20, 'L', 2)}
${drawBox(left, tableTop, right - left, tableHeight, 2)}
${drawLine(col2, tableTop, 1, tableHeight)}
${drawLine(col3, tableTop, 1, tableHeight)}
${drawLine(col4, tableTop, 1, tableHeight)}
${drawLine(left, tableTop + headerHeight, right - left, 2)}
${zplText(col2 + 6, tableTop + 13, '100g', col3 - col2 - 12, 21, 21, 'R')}
${zplText(col3 + 4, tableTop + 13, '50g', col4 - col3 - 8, 21, 21, 'R')}
${zplText(col4 + 6, tableTop + 13, '%VD(*)', right - col4 - 12, 21, 21, 'C')}
${horizontalLines}
${zplRows}
${zplText(left + 8, tableTop + tableHeight + 18, '*Percentual de valores diarios fornecidos pela porcao. **Valor Diario nao estabelecido. Valores diarios de referencia com base em uma dieta de 2000 kcal ou 8400 kJ.', right - left - 16, 17, 17, 'L', 4)}
${drawLine(left, 1010, right - left, 2)}
${zplText(left + 8, 1030, `Fab: ${dataProducao}`, 220, 21, 21, 'L')}
${zplText(left + 260, 1030, `Val: ${validade}`, 220, 21, 21, 'L')}
${zplText(right - 210, 1030, 'Casa di Ana', 200, 21, 21, 'R')}
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
  dataProducao: string,
  validade: string,
  quantidade: number,
  nutri: NutriValues,
): string {
  const kcal = Number(nutri.kcal) || 0
  const kj = Number(nutri.kj) || 0
  const carbo = Number(nutri.carbo) || 0
  const acucares = Number(nutri.acucares) || 0
  const acucaresAdic = Number(nutri.acucaresAdic) || 0
  const prot = Number(nutri.proteinas) || 0
  const gord = Number(nutri.gorduras) || 0
  const gordSat = Number(nutri.gordSat) || 0
  const gordTrans = Number(nutri.gordTrans) || 0
  const fibra = Number(nutri.fibra) || 0
  const sodio = Number(nutri.sodio) || 0
  const porcaoG = parsePorcaoGramas(nutri.porcao)

  const vd = (v: number, ref: number) =>
    v > 0 ? `${Math.round((v / ref) * 100)}%` : '—'
  const nd = '**'

  const porcaoLabel = nutri.medidaCaseira
    ? `${nutri.porcao} (${nutri.medidaCaseira})`
    : nutri.porcao

  const porcoesPorEmb = nutri.porcoesPorEmbalagem
    ? `${nutri.porcoesPorEmbalagem} porções por embalagem`
    : ''

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
      <td class="num muted">
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
      <div class="portion"><strong>Porção:</strong> ${porcaoLabel}${porcoesPorEmb ? ` - ${porcoesPorEmb}` : ''}</div>

      <table class="nutri-table">
        <colgroup>
          <col style="width:43.75%">
          <col style="width:19.375%">
          <col style="width:12.125%">
          <col style="width:24.75%">
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
            'Valor energético',
            kcal > 0 ? `${fmt100(kcal, porcaoG)} kcal / ${fmt100(kj, porcaoG)} kJ` : '—',
            kcal > 0 ? `${fmtPeso(kcal, porcaoG, 50)} kcal / ${fmtPeso(kj, porcaoG, 50)} kJ` : '—',
            vd(kcal, 2000),
          )}
          ${row(true, 0, 'Carboidratos', `${fmt100(carbo, porcaoG)} g`, `${fmtPeso(carbo, porcaoG, 50)} g`, vd(carbo, 300))}
          ${row(false, 1, 'Açúcares totais', `${fmt100(acucares, porcaoG)} g`, `${fmtPeso(acucares, porcaoG, 50)} g`, nd)}
          ${row(false, 2, 'Açúcares adicionados', `${fmt100(acucaresAdic, porcaoG)} g`, `${fmtPeso(acucaresAdic, porcaoG, 50)} g`, nd)}
          ${row(true, 0, 'Proteínas', `${fmt100(prot, porcaoG)} g`, `${fmtPeso(prot, porcaoG, 50)} g`, vd(prot, 75))}
          ${row(true, 0, 'Gorduras totais', `${fmt100(gord, porcaoG)} g`, `${fmtPeso(gord, porcaoG, 50)} g`, vd(gord, 65))}
          ${row(false, 1, 'Gorduras saturadas', `${fmt100(gordSat, porcaoG)} g`, `${fmtPeso(gordSat, porcaoG, 50)} g`, vd(gordSat, 22))}
          ${row(false, 1, 'Gorduras trans', `${fmt100(gordTrans, porcaoG)} g`, `${fmtPeso(gordTrans, porcaoG, 50)} g`, nd)}
          ${row(true, 0, 'Fibra alimentar', `${fmt100(fibra, porcaoG)} g`, `${fmtPeso(fibra, porcaoG, 50)} g`, vd(fibra, 25))}
          ${row(true, 0, 'Sódio', `${fmt100(sodio, porcaoG)} mg`, `${fmtPeso(sodio, porcaoG, 50)} mg`, vd(sodio, 2300))}
        </tbody>
      </table>

      <div class="note">
        *Percentual de valores diários fornecidos pela porção. **Valor Diário não estabelecido. Valores diários de referência com base em uma dieta de 2000 kcal ou 8400 kJ.
      </div>

      <div class="line footer-line"></div>
      <div class="footer">
        <span><strong>Fab:</strong> ${dataProducao}</span>
        <span><strong>Val:</strong> ${validade}</span>
        <span style="font-style:italic;">Casa di Ana</span>
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
    @page { size: 100mm 150mm portrait; margin: 0 !important; }
    html, body {
      width: 100mm !important;
      min-width: 100mm !important;
      max-width: 100mm !important;
      height: 150mm !important;
      min-height: 150mm !important;
      max-height: 150mm !important;
      overflow: visible !important;
    }
    .etiqueta {
      position: relative;
      display: block;
      width: 100mm;
      min-width: 100mm;
      max-width: 100mm;
      height: 150mm;
      min-height: 150mm;
      max-height: 150mm;
      padding: 0;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .nutricional {
      position: absolute;
      top: 2mm;
      left: 3mm;
      width: 94mm;
      height: 138.75mm;
      max-height: 138.75mm;
      border: 0.38mm solid #000;
      font-family: 'Arial Narrow', Arial, sans-serif;
      overflow: hidden;
      background: #fff;
      color: #000;
    }
    .nutri-title {
      position: absolute;
      top: 1mm;
      left: 1mm;
      width: 92mm;
      height: 5mm;
      font-size: 16px;
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
      width: 94mm;
      height: 0.25mm;
      background: #000;
    }
    .title-line {
      top: 6.75mm;
      height: 0.25mm;
    }
    .product-name {
      position: absolute;
      top: 8.75mm;
      left: 1.25mm;
      width: 91.5mm;
      height: 6.8mm;
      font-size: 13px;
      font-weight: 700;
      line-height: 3.35mm;
      text-align: center;
      color: #000;
      overflow: hidden;
      overflow-wrap: anywhere;
    }
    .product-line {
      top: 16.5mm;
      height: 0.25mm;
    }
    .portion {
      position: absolute;
      top: 18.5mm;
      left: 1.25mm;
      width: 91.5mm;
      height: 4.25mm;
      font-size: 10px;
      line-height: 2.1mm;
      color: #000;
      overflow: hidden;
      overflow-wrap: anywhere;
    }
    .nutri-table {
      position: absolute;
      top: 23.125mm;
      left: 0;
      width: 94mm;
      height: 61.25mm;
      border-collapse: collapse;
      table-layout: fixed;
      background: #fff;
      border: 0.25mm solid #000;
    }
    thead tr,
    tbody tr {
      break-inside: avoid;
      page-break-inside: avoid;
      height: 5.625mm;
      border-bottom: 0.125mm solid #000;
    }
    thead tr {
      height: 5mm;
      border-bottom: 0.25mm solid #000;
    }
    th,
    td {
      padding: 0.35mm 0.75mm;
      font-size: 10px;
      line-height: 1.18;
      vertical-align: top;
      color: #000;
      overflow: hidden;
      overflow-wrap: anywhere;
    }
    th {
      font-weight: 700;
      vertical-align: middle;
    }
    th:first-child,
    td:first-child {
      text-align: left;
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
    .bold {
      font-weight: bold;
    }
    .indent-1 {
      padding-left: 3mm;
    }
    .indent-2 {
      padding-left: 5.25mm;
    }
    .num {
      text-align: right;
      white-space: normal;
    }
    .vd {
      text-align: center;
      white-space: normal;
    }
    .muted {
      color: #444;
    }
    .note {
      position: absolute;
      top: 86.625mm;
      left: 1mm;
      width: 92mm;
      height: 18mm;
      font-size: 8.5px;
      line-height: 1.22;
      color: #000;
      overflow: hidden;
    }
    .footer-line {
      top: 126.25mm;
      height: 0.25mm;
    }
    .footer {
      position: absolute;
      top: 128.75mm;
      left: 1mm;
      width: 92mm;
      height: 5mm;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 2mm;
      font-size: 10px;
      line-height: 1.2;
      color: #000;
      overflow: hidden;
      white-space: nowrap;
    }
  </style>
</head>
<body>${etiquetas}</body>
</html>`
}
