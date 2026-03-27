# Arquitetura – Módulo de Estoque | Casa di Ana

> **Para agentes:** Este documento é um pré-requisito arquitetural. Antes de implementar, gere o plano de tarefas detalhado com o skill `writing-plans`.

**Objetivo:** Definir a arquitetura do módulo de estoque do Sistema de Gestão Operacional Casa di Ana, cobrindo backend, frontend, estrutura de pastas, camadas, autenticação/autorização e organização do domínio.

**Stack:** C# / ASP.NET Core Web API · React · Tailwind CSS · PostgreSQL · Entity Framework Core · JWT · Swagger

---

## 1. Visão Geral do Módulo

O módulo de estoque é responsável por:

| Funcionalidade               | Descrição resumida                                              |
|------------------------------|-----------------------------------------------------------------|
| Gerenciar Ingredientes       | CRUD de ingredientes com unidade de medida e estoque mínimo    |
| Gerenciar Fornecedores       | CRUD de fornecedores com dados de contato                      |
| Registrar Entrada de Mercadorias | Lançamento de entradas vinculadas a fornecedor e ingrediente |
| Realizar Inventário de Estoque | Contagem física com ajuste de saldo                           |
| Emitir Relatório de Estoque  | Posição atual do estoque por ingrediente                       |
| Emitir Relatório de Movimentação | Histórico de entradas, saídas e ajustes por período        |

---

## 2. Arquitetura Backend

### 2.1 Estilo arquitetural

**Clean Architecture** com separação explícita em camadas. O núcleo do domínio não depende de infraestrutura.

```
Domínio ← Aplicação ← Infraestrutura
                    ↑
                  API (Controllers)
```

### 2.2 Camadas e responsabilidades

| Camada         | Projeto C#                        | Responsabilidade                                                  |
|----------------|-----------------------------------|-------------------------------------------------------------------|
| **Domain**     | `CasaDiAna.Domain`                | Entidades, enums, interfaces de repositório, regras de negócio puras |
| **Application**| `CasaDiAna.Application`           | Use cases (Commands/Queries via MediatR), DTOs, validações (FluentValidation) |
| **Infrastructure** | `CasaDiAna.Infrastructure`    | EF Core DbContext, repositórios concretos, migrações, serviços externos |
| **API**        | `CasaDiAna.API`                   | Controllers, middlewares, configuração JWT, Swagger, injeção de dependência |

### 2.3 Padrão de comunicação interna

- **CQRS leve** com MediatR: Commands (escrita) e Queries (leitura) separados por pasta.
- Nenhum controller chama repositório diretamente — tudo passa por MediatR handlers.
- Respostas padronizadas com envelope `ApiResponse<T>` contendo `success`, `data` e `errors`.

### 2.4 Validação

- FluentValidation acoplado ao pipeline do MediatR (behavior de validação).
- Validações de negócio ficam no Domain; validações de entrada ficam nos Validators da Application.

---

## 3. Arquitetura Frontend

### 3.1 Estilo arquitetural

**Feature-based architecture** — código organizado por funcionalidade de negócio, não por tipo técnico.

Cada funcionalidade do módulo de estoque vive em sua própria pasta com seus próprios componentes, hooks e serviços.

### 3.2 Camadas do frontend

| Camada           | Localização                  | Responsabilidade                                          |
|------------------|------------------------------|-----------------------------------------------------------|
| **Pages**        | `features/<feature>/pages/`  | Composição de tela, roteamento                           |
| **Components**   | `features/<feature>/components/` | Componentes visuais da feature                       |
| **Hooks**        | `features/<feature>/hooks/`  | Lógica de estado local e chamadas de API                 |
| **Services**     | `features/<feature>/services/` | Funções de chamada HTTP (axios)                        |
| **Shared**       | `shared/`                    | Componentes e hooks reutilizáveis entre features         |
| **Store**        | `store/`                     | Estado global (Zustand ou Context API) — auth, usuário   |

### 3.3 Princípios de UI

- Tailwind CSS com classes utilitárias — sem CSS customizado salvo exceções justificadas.
- Componentes de formulário simples e grandes (acessíveis a usuários com baixa proficiência).
- Feedback imediato em todas as ações (loading states, mensagens de sucesso/erro visíveis).
- Tabelas com paginação e filtros básicos (sem complexidade desnecessária).

---

## 4. Estrutura de Pastas

### 4.1 Backend

```
/CasaDiAna.sln
│
├── src/
│   ├── CasaDiAna.Domain/
│   │   ├── Entities/
│   │   │   ├── Ingrediente.cs
│   │   │   ├── Fornecedor.cs
│   │   │   ├── EntradaMercadoria.cs
│   │   │   ├── ItemEntradaMercadoria.cs
│   │   │   ├── Inventario.cs
│   │   │   └── ItemInventario.cs
│   │   ├── Enums/
│   │   │   └── UnidadeMedida.cs
│   │   └── Interfaces/
│   │       ├── IIngredienteRepository.cs
│   │       ├── IFornecedorRepository.cs
│   │       └── IEntradaMercadoriaRepository.cs
│   │
│   ├── CasaDiAna.Application/
│   │   ├── Common/
│   │   │   ├── ApiResponse.cs
│   │   │   └── ValidationBehavior.cs
│   │   └── Estoque/
│   │       ├── Ingredientes/
│   │       │   ├── Commands/
│   │       │   │   ├── CriarIngrediente/
│   │       │   │   │   ├── CriarIngredienteCommand.cs
│   │       │   │   │   ├── CriarIngredienteHandler.cs
│   │       │   │   │   └── CriarIngredienteValidator.cs
│   │       │   │   └── AtualizarIngrediente/
│   │       │   └── Queries/
│   │       │       └── ListarIngredientes/
│   │       ├── Fornecedores/
│   │       │   ├── Commands/
│   │       │   └── Queries/
│   │       ├── EntradaMercadorias/
│   │       │   ├── Commands/
│   │       │   └── Queries/
│   │       ├── Inventarios/
│   │       │   ├── Commands/
│   │       │   └── Queries/
│   │       └── Relatorios/
│   │           └── Queries/
│   │               ├── RelatorioEstoque/
│   │               └── RelatorioMovimentacao/
│   │
│   ├── CasaDiAna.Infrastructure/
│   │   ├── Persistence/
│   │   │   ├── AppDbContext.cs
│   │   │   ├── Configurations/       ← configurações EF (Fluent API)
│   │   │   └── Migrations/
│   │   └── Repositories/
│   │       ├── IngredienteRepository.cs
│   │       ├── FornecedorRepository.cs
│   │       └── EntradaMercadoriaRepository.cs
│   │
│   └── CasaDiAna.API/
│       ├── Controllers/
│       │   └── Estoque/
│       │       ├── IngredientesController.cs
│       │       ├── FornecedoresController.cs
│       │       ├── EntradasController.cs
│       │       ├── InventariosController.cs
│       │       └── RelatoriosController.cs
│       ├── Middleware/
│       │   └── ExceptionHandlingMiddleware.cs
│       └── Program.cs
│
└── tests/
    ├── CasaDiAna.Domain.Tests/
    ├── CasaDiAna.Application.Tests/
    └── CasaDiAna.API.IntegrationTests/
```

### 4.2 Frontend

```
/frontend/
│
├── src/
│   ├── features/
│   │   └── estoque/
│   │       ├── ingredientes/
│   │       │   ├── pages/
│   │       │   │   ├── IngredientesPage.tsx
│   │       │   │   └── IngredienteFormPage.tsx
│   │       │   ├── components/
│   │       │   │   ├── IngredienteTabela.tsx
│   │       │   │   └── IngredienteForm.tsx
│   │       │   ├── hooks/
│   │       │   │   └── useIngredientes.ts
│   │       │   └── services/
│   │       │       └── ingredientesService.ts
│   │       ├── fornecedores/
│   │       ├── entradas/
│   │       ├── inventarios/
│   │       └── relatorios/
│   │
│   ├── shared/
│   │   ├── components/
│   │   │   ├── Botao.tsx
│   │   │   ├── CampoTexto.tsx
│   │   │   ├── Tabela.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── MensagemErro.tsx
│   │   │   └── Layout.tsx
│   │   └── hooks/
│   │       └── useApi.ts
│   │
│   ├── store/
│   │   └── authStore.ts           ← token JWT, dados do usuário logado
│   │
│   ├── routes/
│   │   └── AppRoutes.tsx
│   │
│   └── lib/
│       └── api.ts                 ← instância axios com interceptor de token
│
├── index.html
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 5. Camadas do Sistema (Visão Completa)

```
┌─────────────────────────────────────────────────────┐
│                     FRONTEND                        │
│  React · Tailwind CSS · Axios · React Router        │
│  Feature-based · Hooks para estado/requisições      │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS / JSON
┌────────────────────▼────────────────────────────────┐
│                  API LAYER                          │
│  ASP.NET Core Controllers · JWT Middleware          │
│  Swagger · Exception Middleware · Rate Limiting     │
└────────────────────┬────────────────────────────────┘
                     │ MediatR
┌────────────────────▼────────────────────────────────┐
│              APPLICATION LAYER                      │
│  Commands · Queries · Handlers · Validators         │
│  DTOs · Mapeamento (Mapster ou manual)              │
└────────────────────┬────────────────────────────────┘
                     │ Interfaces
┌────────────────────▼────────────────────────────────┐
│                DOMAIN LAYER                         │
│  Entidades · Enums · Interfaces de Repositório      │
│  Regras de negócio puras (sem dependência externa)  │
└────────────────────┬────────────────────────────────┘
                     │ EF Core
┌────────────────────▼────────────────────────────────┐
│             INFRASTRUCTURE LAYER                    │
│  AppDbContext · Repositórios concretos              │
│  Migrações · Configurações Fluent API               │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│                  PostgreSQL                         │
└─────────────────────────────────────────────────────┘
```

---

## 6. Estratégia de Autenticação e Autorização

### 6.1 Autenticação — JWT

- Login retorna **Access Token** (curta duração: 1h) + **Refresh Token** (longa duração: 7 dias).
- O frontend armazena o Access Token em **memória (não em localStorage)** e o Refresh Token em **cookie HttpOnly**.
- O interceptor axios renova o token automaticamente quando recebe `401`.
- Endpoint de logout invalida o Refresh Token no banco.

### 6.2 Autorização — Papéis (Roles)

| Papel                    | Código              |
|--------------------------|---------------------|
| Administrador / Gestor   | `Admin`             |
| Coordenador de Produção  | `Coordenador`       |
| Operador de Cozinha      | `OperadorCozinha`   |
| Operador de Panificação  | `OperadorPanificacao` |
| Operador do Bar          | `OperadorBar`       |
| Responsável por Compras  | `Compras`           |

### 6.3 Matriz de permissões — Módulo de Estoque

| Funcionalidade                 | Admin | Coordenador | Compras | Operadores |
|--------------------------------|:-----:|:-----------:|:-------:|:----------:|
| Gerenciar Ingredientes         | ✅    | ✅          | ✅      | ❌         |
| Gerenciar Fornecedores         | ✅    | ❌          | ✅      | ❌         |
| Registrar Entrada de Mercadorias | ✅  | ✅          | ✅      | ❌         |
| Realizar Inventário            | ✅    | ✅          | ❌      | Leitura    |
| Relatório de Estoque           | ✅    | ✅          | ✅      | Leitura    |
| Relatório de Movimentação      | ✅    | ✅          | ✅      | ❌         |

> **Operadores** (Cozinha, Panificação, Bar) têm acesso de leitura ao inventário e relatório de estoque para consulta de disponibilidade no dia a dia.

### 6.4 Implementação no backend

- Claims do JWT incluem `role` e `userId`.
- Controllers usam `[Authorize(Roles = "Admin,Coordenador")]` por ação.
- Policy-based authorization para permissões mais granulares (ex.: leitura vs. escrita).

### 6.5 Proteção de rotas no frontend

- `PrivateRoute` wrapper que valida token e role antes de renderizar a página.
- Menu lateral exibe apenas as opções permitidas para o papel do usuário logado.
- Botões de ação (criar, editar, excluir) são ocultados/desabilitados conforme permissão.

---

## 7. Organização do Domínio (Bounded Context)

### 7.1 Contexto delimitado

O módulo de estoque é um **bounded context isolado**: `Estoque`. Futuros módulos (Produção, Vendas, etc.) consumirão dados de estoque via eventos de domínio ou contratos de API — nunca acesso direto ao banco de estoque.

### 7.2 Entidades centrais

```
Ingrediente
├── id: Guid
├── nome: string
├── unidadeMedida: UnidadeMedida (enum)
├── estoqueAtual: decimal
├── estoqueMinimo: decimal
└── ativo: bool

Fornecedor
├── id: Guid
├── razaoSocial: string
├── cnpj: string
├── telefone: string
├── email: string
└── ativo: bool

EntradaMercadoria
├── id: Guid
├── fornecedorId: Guid
├── dataEntrada: DateTime
├── numeroNotaFiscal: string?
├── responsavelId: Guid        ← usuário que registrou
└── itens: List<ItemEntradaMercadoria>

ItemEntradaMercadoria
├── id: Guid
├── ingredienteId: Guid
├── quantidade: decimal
└── custoUnitario: decimal

Inventario
├── id: Guid
├── dataRealizacao: DateTime
├── responsavelId: Guid
└── itens: List<ItemInventario>

ItemInventario
├── id: Guid
├── ingredienteId: Guid
├── quantidadeContada: decimal
└── quantidadeSistema: decimal  ← calculado no momento do inventário
```

### 7.3 Eventos de domínio (para integração futura)

Quando outros módulos precisarem reagir a mudanças de estoque, os eventos abaixo serão publicados (não implementar agora):

- `EstoqueAbaixoMinimoEvent` — disparado quando `estoqueAtual < estoqueMinimo`
- `EntradaMercadoriaRegistradaEvent` — quando uma entrada é confirmada
- `InventarioFinalizadoEvent` — quando um inventário é concluído com ajustes

### 7.4 Regras de negócio centrais

1. O estoque de um ingrediente nunca pode ser negativo — rejeitar operações que violem isso.
2. Um inventário só pode ser finalizado uma vez (estado imutável após conclusão).
3. A entrada de mercadorias incrementa `estoqueAtual` automaticamente ao ser confirmada.
4. Ajuste de inventário cria uma movimentação do tipo `Ajuste` para rastreabilidade.

---

## 8. Decisões Técnicas Resumidas

| Decisão                       | Escolha                        | Justificativa                                              |
|-------------------------------|--------------------------------|------------------------------------------------------------|
| Arquitetura backend           | Clean Architecture + CQRS leve | Separação clara, testabilidade, crescimento sustentável   |
| Mediador                      | MediatR                        | Desacopla controllers de handlers, facilita pipeline      |
| Validação                     | FluentValidation + MediatR Behavior | Validação centralizada e reutilizável              |
| Arquitetura frontend          | Feature-based                  | Facilita manutenção, coesão por domínio                   |
| Gerenciamento de estado global | Zustand (simples)             | Mais simples que Redux, suficiente para este escopo       |
| Armazenamento do token        | Memória + cookie HttpOnly      | Segurança contra XSS e CSRF                               |
| ORM                           | EF Core + Fluent API           | Stack definida, sem raw SQL salvo em relatórios complexos |
| Mapeamento DTO                | Mapster                        | Mais performático que AutoMapper, configuração simples    |
