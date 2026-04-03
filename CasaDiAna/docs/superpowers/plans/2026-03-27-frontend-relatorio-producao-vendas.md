# Relatório Produção/Vendas — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a página de relatório de produção vs. vendas (`/relatorios/producao-vendas`) conectada ao endpoint `/api/relatorios/producao-vendas`, exibindo por produto: produzido, vendido, perda, custo, receita e margens.

**Architecture:** Página com filtros de período + produto opcional, cards de resumo (totais), tabela detalhada por produto com formatação de percentuais e destaque de perdas elevadas. Estende o `relatoriosService` existente. Usa tipos de `src/types/producao.ts`.

**Tech Stack:** React 18, TypeScript, Tailwind CSS v4, Axios, React Router v6

**Pré-requisito:** Plano 1 concluído (`src/types/producao.ts` existe).

---

### Visão Geral dos Arquivos

**Modificar:**
- `frontend/src/features/relatorios/services/relatoriosService.ts` — adicionar método `producaoVendas()`

**Criar:**
- `frontend/src/features/relatorios/pages/ProducaoVendasRelatorioPage.tsx`

**Modificar:**
- `frontend/src/components/layout/Sidebar.tsx` — ativar item "Produção/Vendas"
- `frontend/src/routes/AppRoutes.tsx` — adicionar rota

---

### Task 1: Estender relatoriosService

**Files:**
- Modify: `frontend/src/features/relatorios/services/relatoriosService.ts`

- [ ] **Step 1: Ler o arquivo atual**

Ler `frontend/src/features/relatorios/services/relatoriosService.ts` para verificar o que já existe.

- [ ] **Step 2: Adicionar import e método**

Adicionar no topo do arquivo o import do tipo novo:

```typescript
import type { RelatorioProducaoVendas } from '@/types/producao'
```

Adicionar ao objeto `relatoriosService` o novo método (após os métodos existentes):

```typescript
  producaoVendas: async (de: string, ate: string, produtoId?: string): Promise<RelatorioProducaoVendas> => {
    const params = new URLSearchParams({ de, ate })
    if (produtoId) params.set('produtoId', produtoId)
    const resp = await api.get<ApiResponse<RelatorioProducaoVendas>>(
      `/relatorios/producao-vendas?${params.toString()}`
    )
    return resp.data.dados
  },
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/relatorios/services/relatoriosService.ts
git commit -m "feat(frontend): método producaoVendas no relatoriosService"
```

---

### Task 2: Criar ProducaoVendasRelatorioPage

**Files:**
- Create: `frontend/src/features/relatorios/pages/ProducaoVendasRelatorioPage.tsx`

- [ ] **Step 1: Escrever a página**

```tsx
// frontend/src/features/relatorios/pages/ProducaoVendasRelatorioPage.tsx
import { useEffect, useState } from 'react'
import { relatoriosService } from '../services/relatoriosService'
import { produtosService } from '@/features/producao/produtos/services/produtosService'
import type { RelatorioProducaoVendas, RelatorioProducaoVendasItem, ProdutoResumo } from '@/types/producao'

function primeiroDoMes(): string {
  const hoje = new Date()
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
}

function hoje(): string {
  return new Date().toISOString().split('T')[0]
}

function brl(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function pct(v: number | null): string {
  if (v == null) return '—'
  return `${v.toFixed(1)}%`
}

const inputClass =
  'border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'

export function ProducaoVendasRelatorioPage() {
  const [relatorio, setRelatorio] = useState<RelatorioProducaoVendas | null>(null)
  const [produtos, setProdutos] = useState<ProdutoResumo[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [de, setDe] = useState(primeiroDoMes())
  const [ate, setAte] = useState(hoje())
  const [produtoFiltro, setProdutoFiltro] = useState('')

  useEffect(() => {
    produtosService.listar().then(setProdutos).catch(() => {})
    carregar(primeiroDoMes(), hoje())
  }, [])

  const carregar = async (filtroDe: string, filtroAte: string, produtoId?: string) => {
    setLoading(true)
    setErro(null)
    try {
      const data = await relatoriosService.producaoVendas(filtroDe, filtroAte, produtoId || undefined)
      setRelatorio(data)
    } catch {
      setErro('Erro ao carregar relatório.')
    } finally {
      setLoading(false)
    }
  }

  const handleFiltrar = () => carregar(de, ate, produtoFiltro || undefined)

  // Totais calculados no frontend a partir dos itens
  const totais = relatorio?.itens.reduce(
    (acc, item) => ({
      produzido: acc.produzido + item.totalProduzido,
      vendido: acc.vendido + item.totalVendido,
      perda: acc.perda + item.perda,
      custoProducao: acc.custoProducao + item.custoTotalProducao,
      custoPerda: acc.custoPerda + item.custoPerda,
      receita: acc.receita + item.receitaEstimada,
    }),
    { produzido: 0, vendido: 0, perda: 0, custoProducao: 0, custoPerda: 0, receita: 0 }
  )

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-stone-800 mb-6">Relatório Produção / Vendas</h1>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">De</label>
          <input
            type="date"
            value={de}
            onChange={e => setDe(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Até</label>
          <input
            type="date"
            value={ate}
            onChange={e => setAte(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Produto</label>
          <select
            value={produtoFiltro}
            onChange={e => setProdutoFiltro(e.target.value)}
            className={inputClass}
          >
            <option value="">Todos</option>
            {produtos.map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleFiltrar}
          className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-sm font-medium"
        >
          Filtrar
        </button>
      </div>

      {loading && (
        <div className="bg-white rounded-xl shadow-sm py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-amber-700" />
          <p className="text-stone-500 mt-3 text-sm">Carregando relatório...</p>
        </div>
      )}
      {!loading && erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{erro}</div>
      )}
      {!loading && !erro && relatorio && (
        <>
          {/* Cards de resumo */}
          {totais && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4">
                <p className="text-xs text-stone-500 mb-1">Total Produzido</p>
                <p className="text-xl font-semibold text-stone-800">{totais.produzido.toFixed(0)}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4">
                <p className="text-xs text-stone-500 mb-1">Total Vendido</p>
                <p className="text-xl font-semibold text-stone-800">{totais.vendido.toFixed(0)}</p>
              </div>
              <div className={`rounded-xl shadow-sm border p-4 ${totais.perda > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-stone-200'}`}>
                <p className="text-xs text-stone-500 mb-1">Perda Total</p>
                <p className={`text-xl font-semibold ${totais.perda > 0 ? 'text-red-700' : 'text-stone-800'}`}>
                  {totais.perda.toFixed(0)}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4">
                <p className="text-xs text-stone-500 mb-1">Custo Produção</p>
                <p className="text-lg font-semibold text-stone-800">{brl(totais.custoProducao)}</p>
              </div>
              <div className={`rounded-xl shadow-sm border p-4 ${totais.custoPerda > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-stone-200'}`}>
                <p className="text-xs text-stone-500 mb-1">Custo da Perda</p>
                <p className={`text-lg font-semibold ${totais.custoPerda > 0 ? 'text-red-700' : 'text-stone-800'}`}>
                  {brl(totais.custoPerda)}
                </p>
              </div>
              <div className="bg-green-50 rounded-xl shadow-sm border border-green-200 p-4">
                <p className="text-xs text-stone-500 mb-1">Receita Estimada</p>
                <p className="text-lg font-semibold text-green-700">{brl(totais.receita)}</p>
              </div>
            </div>
          )}

          {/* Tabela detalhada */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {relatorio.itens.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-stone-500 text-sm">Nenhum produto com produção ou venda no período.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-stone-50 border-b border-stone-200">
                    <tr>
                      <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Produto</th>
                      <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Preço Venda</th>
                      <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Produzido</th>
                      <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Vendido</th>
                      <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Perda</th>
                      <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Custo Prod.</th>
                      <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Custo Médio</th>
                      <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Receita Est.</th>
                      <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Margem Lucro</th>
                      <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Margem Perda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorio.itens.map((item: RelatorioProducaoVendasItem) => (
                      <tr
                        key={item.produtoId}
                        className={`border-b border-stone-100 transition-colors ${
                          item.margemPerda != null && item.margemPerda > 20
                            ? 'bg-red-50 hover:bg-red-100'
                            : 'hover:bg-amber-50'
                        }`}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-stone-800">{item.produtoNome}</td>
                        <td className="px-4 py-3 text-sm text-stone-600 text-right">{brl(item.precoVenda)}</td>
                        <td className="px-4 py-3 text-sm text-stone-800 text-right">{item.totalProduzido.toFixed(0)}</td>
                        <td className="px-4 py-3 text-sm text-stone-800 text-right">{item.totalVendido.toFixed(0)}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={item.perda > 0 ? 'text-red-600 font-semibold' : 'text-stone-600'}>
                            {item.perda.toFixed(0)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-stone-600 text-right">{brl(item.custoTotalProducao)}</td>
                        <td className="px-4 py-3 text-sm text-stone-600 text-right">{brl(item.custoMedioUnitario)}</td>
                        <td className="px-4 py-3 text-sm text-green-700 font-semibold text-right">{brl(item.receitaEstimada)}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={
                            item.margemLucro == null
                              ? 'text-stone-400'
                              : item.margemLucro >= 30
                              ? 'text-green-600 font-semibold'
                              : item.margemLucro >= 0
                              ? 'text-amber-600'
                              : 'text-red-600 font-semibold'
                          }>
                            {pct(item.margemLucro)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={
                            item.margemPerda == null
                              ? 'text-stone-400'
                              : item.margemPerda > 20
                              ? 'text-red-600 font-semibold'
                              : item.margemPerda > 0
                              ? 'text-amber-600'
                              : 'text-stone-600'
                          }>
                            {pct(item.margemPerda)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/features/relatorios/pages/ProducaoVendasRelatorioPage.tsx
git commit -m "feat(frontend): página de relatório produção/vendas"
```

---

### Task 3: Atualizar Sidebar e AppRoutes

**Files:**
- Modify: `frontend/src/components/layout/Sidebar.tsx`
- Modify: `frontend/src/routes/AppRoutes.tsx`

- [ ] **Step 1: Ativar item na Sidebar**

No arquivo `frontend/src/components/layout/Sidebar.tsx`, localizar o item com `href: '/relatorios/producao-vendas'` e alterar `disponivel: false` para `disponivel: true`:

```typescript
{ label: 'Produção/Vendas', href: '/relatorios/producao-vendas', icon: ChartBarIcon, disponivel: true },
```

- [ ] **Step 2: Adicionar rota no AppRoutes**

No arquivo `frontend/src/routes/AppRoutes.tsx`, adicionar o import:

```typescript
import { ProducaoVendasRelatorioPage } from '@/features/relatorios/pages/ProducaoVendasRelatorioPage'
```

Adicionar a rota dentro do `<Route element={<MainLayout />}>`, junto às outras rotas de relatórios:

```tsx
<Route path="/relatorios/producao-vendas" element={<ProducaoVendasRelatorioPage />} />
```

- [ ] **Step 3: Verificar que o app compila**

```bash
cd frontend && npm run build 2>&1 | tail -20
```

Saída esperada: `✓ built in` sem erros.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/layout/Sidebar.tsx frontend/src/routes/AppRoutes.tsx
git commit -m "feat(frontend): rota e sidebar para relatório produção/vendas"
```

---

## Self-Review

**Spec coverage:**
- ✓ Filtros de período (de/até) + produto opcional
- ✓ Cards de resumo: total produzido, total vendido, perda total, custo produção, custo perda, receita estimada
- ✓ Tabela com todas as colunas do `RelatorioProducaoVendasItemDto`
- ✓ Formatação de moeda (BRL) para custos/receitas
- ✓ Formatação de percentual para margens
- ✓ Destaque visual em linhas com margem de perda > 20%
- ✓ Destaque de margens de lucro: verde ≥ 30%, âmbar 0–30%, vermelho negativo
- ✓ Endpoint `GET /api/relatorios/producao-vendas?de=&ate=&produtoId=`

**Nota sobre `relatoriosService`:** O método `producaoVendas` é adicionado ao objeto literal existente. Não criar um arquivo novo — estender o existente em `src/features/relatorios/services/relatoriosService.ts`.
