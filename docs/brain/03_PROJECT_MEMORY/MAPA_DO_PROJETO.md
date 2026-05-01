---
name: MAPA_DO_PROJETO – árvore comentada
description: Mapa real das pastas do repositório e seu papel
type: project_memory
status: existente
ultima_atualizacao: 2026-04-30
---

# 🗂️ Mapa do projeto

```
ProjetoGestao/                            ← raiz do repo
├── CasaDiAna/                            ← solução .NET + frontend
│   ├── CasaDiAna.sln
│   ├── docker-compose.yml · Dockerfile · render.yaml
│   ├── src/
│   │   ├── CasaDiAna.Domain/
│   │   │   ├── Entities/                 ← 21 entidades de domínio
│   │   │   ├── Enums/                    ← 6 enums
│   │   │   ├── Interfaces/               ← contratos
│   │   │   └── Exceptions/               ← DomainException
│   │   ├── CasaDiAna.Application/
│   │   │   ├── Auth/ Categorias/ CategoriasProduto/ Common/
│   │   │   ├── Entradas/ Estoque/ Etiquetas/ Fornecedores/
│   │   │   ├── ImportacaoVendas/ Ingredientes/ Inventarios/
│   │   │   ├── Notificacoes/ Perdas/ ProducaoDiaria/ Produtos/
│   │   │   ├── Relatorios/ UnidadesMedida/ Usuarios/ VendasDiarias/
│   │   │   └── (cada módulo: Commands/ Queries/ Dtos/ Validators/)
│   │   ├── CasaDiAna.Infrastructure/
│   │   │   ├── Persistence/
│   │   │   │   ├── AppDbContext.cs · AppDbContextFactory.cs
│   │   │   │   ├── Configurations/       ← IEntityTypeConfiguration<T>
│   │   │   │   └── Migrations/           ← 17 migrations (CriacaoInicial..ZerarEstoqueNegativo..AddRecebidoPorToEntradas)
│   │   │   ├── Repositories/             ← um repo por agregado
│   │   │   └── Services/                 ← JwtService, CurrentUserService,
│   │   │                                   NotificacaoEstoqueService,
│   │   │                                   TotpService, CsvVendasParser
│   │   └── CasaDiAna.API/
│   │       ├── Controllers/              ← 18 controllers REST
│   │       ├── Middleware/               ← ExceptionHandlingMiddleware
│   │       └── Program.cs                ← bootstrap, migrations, seed, rate limit
│   ├── tests/
│   │   └── CasaDiAna.Application.Tests/  ← xUnit + Moq + FluentAssertions
│   ├── frontend/
│   │   ├── package.json (React 19, Vite 8, Tailwind 4)
│   │   ├── nginx.conf · Dockerfile
│   │   └── src/
│   │       ├── App.tsx · main.tsx · index.css (CSS vars --ada-*)
│   │       ├── routes/                   ← AppRoutes.tsx
│   │       ├── store/authStore.ts        ← Zustand
│   │       ├── lib/                      ← api.ts (Axios), pdf.ts, etiquetasService, notificacoesService
│   │       ├── components/               ← form/, layout/, ui/
│   │       ├── shared/                   ← components/, hooks/
│   │       ├── hooks/                    ← hooks gerais
│   │       └── features/
│   │           ├── auth/                 ← LoginPage + 2FA + hero
│   │           ├── dashboard/
│   │           ├── estoque/{categorias,correcao,ingredientes,unidades}
│   │           ├── entradas/
│   │           ├── etiquetas/
│   │           ├── fornecedores/
│   │           ├── inventarios/
│   │           ├── minha-conta/
│   │           ├── notificacoes/
│   │           ├── producao/{categorias-produto,importacao-vendas,perdas,producao-diaria,produtos,vendas-diarias}
│   │           ├── relatorios/
│   │           ├── usuarios/
│   │           └── design_libs/          ← UNTRACKED — ver [[OPEN_LOOPS]]
│   ├── docs/
│   │   ├── BANCO_DE_DADOS.md             ← schema atualizado
│   │   └── superpowers/                  ← (subset do `docs/` da raiz)
│   ├── README.md · CLAUDE.md
│   └── appsettings.{Development.,}json   ← em src/CasaDiAna.API
├── docs/
│   ├── superpowers/
│   │   ├── plans/                        ← 24+ planos por feature
│   │   └── specs/                        ← design specs
│   └── brain/                            ← este BrainOS
├── .obsidian/                            ← vault config (untracked)
├── .junie/ · .agents/ · .claude/         ← agentes
├── README.md
└── skills-lock.json
```

## O que está fora do CasaDiAna/

- `docs/superpowers/` — planos e specs (a fonte oficial dos próximos passos).
- `docs/brain/` — este BrainOS.
- `src/` na raiz — contém apenas `obj/` (parece resíduo de build); a fonte real é `CasaDiAna/src/`. **a_confirmar** se pode ser limpo, ver [[OPEN_LOOPS]].
- `.obsidian/` — config de vault local; está untracked e não deve ser commitado por padrão.
