# Modelagem do Banco de Dados – Módulo de Estoque | Casa di Ana

> **Pré-requisito:** Arquitetura definida em `2026-03-25-arquitetura-modulo-estoque.md`

**Objetivo:** Definir todas as tabelas, colunas, tipos, constraints e índices do módulo de estoque no PostgreSQL.

**Schema:** `estoque` (todas as tabelas ficam isoladas neste schema)

---

## 1. Convenções Adotadas

| Convenção              | Regra                                                                 |
|------------------------|-----------------------------------------------------------------------|
| Nomes de tabela        | `snake_case`, plural, prefixo do schema: `estoque.ingredientes`       |
| Nomes de coluna        | `snake_case`                                                          |
| Chave primária         | `id UUID DEFAULT gen_random_uuid()` em todas as tabelas               |
| Datas                  | `TIMESTAMPTZ` (com fuso horário) para todos os campos de data/hora    |
| Soft delete            | Coluna `ativo BOOLEAN NOT NULL DEFAULT TRUE` onde aplicável           |
| Auditoria              | `criado_em`, `atualizado_em` em todas as tabelas                      |
| Usuário de auditoria   | `criado_por UUID` e `atualizado_por UUID` referenciando `auth.usuarios`|
| Valores monetários     | `NUMERIC(15,4)` para evitar arredondamento de ponto flutuante         |
| Quantidades            | `NUMERIC(15,4)` para suportar frações (ex.: 0,250 kg)                 |

---

## 2. Schema de Autenticação (auth)

> Definido aqui como referência — será detalhado no módulo de autenticação.

```sql
-- Referência apenas (não faz parte do módulo de estoque)
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE auth.usuarios (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome          VARCHAR(150) NOT NULL,
    email         VARCHAR(254) NOT NULL UNIQUE,
    senha_hash    TEXT NOT NULL,
    papel         VARCHAR(50)  NOT NULL,  -- Admin, Coordenador, OperadorCozinha, etc.
    ativo         BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 3. Schema de Estoque

```sql
CREATE SCHEMA IF NOT EXISTS estoque;
```

---

## 4. Tabelas

### 4.1 `estoque.unidades_medida`

Tabela de domínio (lookup) com as unidades de medida disponíveis.

```sql
CREATE TABLE estoque.unidades_medida (
    id        SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    codigo    VARCHAR(10)  NOT NULL UNIQUE,  -- ex.: KG, L, UN, G, ML, CX
    descricao VARCHAR(50)  NOT NULL           -- ex.: Quilograma, Litro, Unidade
);

-- Valores fixos — não editáveis pelo usuário
INSERT INTO estoque.unidades_medida (codigo, descricao) VALUES
    ('KG',  'Quilograma'),
    ('G',   'Grama'),
    ('L',   'Litro'),
    ('ML',  'Mililitro'),
    ('UN',  'Unidade'),
    ('CX',  'Caixa'),
    ('PCT', 'Pacote'),
    ('DZ',  'Dúzia');
```

**Índices:**
- PK em `id` (automático)
- UNIQUE em `codigo` (automático pela constraint)

---

### 4.2 `estoque.categorias_ingrediente`

Agrupamento opcional de ingredientes (ex.: Laticínios, Farináceos, Bebidas).

```sql
CREATE TABLE estoque.categorias_ingrediente (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome          VARCHAR(100) NOT NULL UNIQUE,
    ativo         BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    criado_por    UUID         NOT NULL REFERENCES auth.usuarios(id),
    atualizado_por UUID        NOT NULL REFERENCES auth.usuarios(id)
);
```

**Índices:**
- `idx_categorias_ingrediente_nome` — `(nome)` para busca por nome
- `idx_categorias_ingrediente_ativo` — `(ativo)` para filtrar ativos

---

### 4.3 `estoque.ingredientes`

Cadastro central dos ingredientes gerenciados no estoque.

```sql
CREATE TABLE estoque.ingredientes (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    nome                VARCHAR(150) NOT NULL,
    codigo_interno      VARCHAR(30)  UNIQUE,          -- código alfanumérico opcional
    categoria_id        UUID         REFERENCES estoque.categorias_ingrediente(id),
    unidade_medida_id   SMALLINT     NOT NULL REFERENCES estoque.unidades_medida(id),
    estoque_atual       NUMERIC(15,4) NOT NULL DEFAULT 0,
    estoque_minimo      NUMERIC(15,4) NOT NULL DEFAULT 0,
    estoque_maximo      NUMERIC(15,4),                -- alerta de excesso (opcional)
    observacoes         TEXT,
    ativo               BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    atualizado_em       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    criado_por          UUID         NOT NULL REFERENCES auth.usuarios(id),
    atualizado_por      UUID         NOT NULL REFERENCES auth.usuarios(id)
);
```

**Constraints:**
```sql
ALTER TABLE estoque.ingredientes
    ADD CONSTRAINT chk_estoque_atual_nao_negativo
        CHECK (estoque_atual >= 0),
    ADD CONSTRAINT chk_estoque_minimo_nao_negativo
        CHECK (estoque_minimo >= 0),
    ADD CONSTRAINT chk_estoque_maximo_valido
        CHECK (estoque_maximo IS NULL OR estoque_maximo >= estoque_minimo);
```

**Índices:**
```sql
CREATE INDEX idx_ingredientes_nome        ON estoque.ingredientes (nome);
CREATE INDEX idx_ingredientes_ativo       ON estoque.ingredientes (ativo);
CREATE INDEX idx_ingredientes_categoria   ON estoque.ingredientes (categoria_id);
CREATE INDEX idx_ingredientes_abaixo_min  ON estoque.ingredientes (estoque_atual, estoque_minimo)
    WHERE ativo = TRUE;  -- índice parcial para alerta de estoque baixo
```

---

### 4.4 `estoque.fornecedores`

Cadastro de fornecedores de mercadorias.

```sql
CREATE TABLE estoque.fornecedores (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    razao_social    VARCHAR(200) NOT NULL,
    nome_fantasia   VARCHAR(200),
    cnpj            CHAR(14)     UNIQUE,         -- somente dígitos, sem máscara
    telefone        VARCHAR(20),
    email           VARCHAR(254),
    contato_nome    VARCHAR(150),                -- nome do representante
    observacoes     TEXT,
    ativo           BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    atualizado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    criado_por      UUID         NOT NULL REFERENCES auth.usuarios(id),
    atualizado_por  UUID         NOT NULL REFERENCES auth.usuarios(id)
);
```

**Constraints:**
```sql
ALTER TABLE estoque.fornecedores
    ADD CONSTRAINT chk_cnpj_formato
        CHECK (cnpj IS NULL OR cnpj ~ '^\d{14}$');
```

**Índices:**
```sql
CREATE INDEX idx_fornecedores_razao_social ON estoque.fornecedores (razao_social);
CREATE INDEX idx_fornecedores_cnpj         ON estoque.fornecedores (cnpj) WHERE cnpj IS NOT NULL;
CREATE INDEX idx_fornecedores_ativo        ON estoque.fornecedores (ativo);
```

---

### 4.5 `estoque.entradas_mercadoria`

Cabeçalho do registro de entrada de mercadorias (nota fiscal / pedido).

```sql
CREATE TABLE estoque.entradas_mercadoria (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    fornecedor_id       UUID         NOT NULL REFERENCES estoque.fornecedores(id),
    numero_nota_fiscal  VARCHAR(60),
    data_entrada        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    observacoes         TEXT,
    status              VARCHAR(20)  NOT NULL DEFAULT 'Confirmada',
    -- 'Confirmada' = única situação válida por ora (sem rascunho neste escopo)
    criado_em           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    atualizado_em       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    criado_por          UUID         NOT NULL REFERENCES auth.usuarios(id),  -- quem registrou
    atualizado_por      UUID         NOT NULL REFERENCES auth.usuarios(id)
);
```

**Constraints:**
```sql
ALTER TABLE estoque.entradas_mercadoria
    ADD CONSTRAINT chk_status_entrada
        CHECK (status IN ('Confirmada', 'Cancelada'));
```

**Índices:**
```sql
CREATE INDEX idx_entradas_fornecedor    ON estoque.entradas_mercadoria (fornecedor_id);
CREATE INDEX idx_entradas_data          ON estoque.entradas_mercadoria (data_entrada DESC);
CREATE INDEX idx_entradas_nota_fiscal   ON estoque.entradas_mercadoria (numero_nota_fiscal)
    WHERE numero_nota_fiscal IS NOT NULL;
CREATE INDEX idx_entradas_criado_por    ON estoque.entradas_mercadoria (criado_por);
```

---

### 4.6 `estoque.itens_entrada_mercadoria`

Itens (ingredientes) de cada entrada de mercadoria.

```sql
CREATE TABLE estoque.itens_entrada_mercadoria (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    entrada_id       UUID          NOT NULL REFERENCES estoque.entradas_mercadoria(id)
                                       ON DELETE CASCADE,
    ingrediente_id   UUID          NOT NULL REFERENCES estoque.ingredientes(id),
    quantidade       NUMERIC(15,4) NOT NULL,
    custo_unitario   NUMERIC(15,4) NOT NULL DEFAULT 0,
    custo_total      NUMERIC(15,4) GENERATED ALWAYS AS (quantidade * custo_unitario) STORED
);
```

**Constraints:**
```sql
ALTER TABLE estoque.itens_entrada_mercadoria
    ADD CONSTRAINT chk_quantidade_positiva
        CHECK (quantidade > 0),
    ADD CONSTRAINT chk_custo_unitario_nao_negativo
        CHECK (custo_unitario >= 0),
    ADD CONSTRAINT uq_item_entrada_ingrediente
        UNIQUE (entrada_id, ingrediente_id);  -- mesmo ingrediente não pode aparecer 2x na mesma entrada
```

**Índices:**
```sql
CREATE INDEX idx_itens_entrada_entrada_id     ON estoque.itens_entrada_mercadoria (entrada_id);
CREATE INDEX idx_itens_entrada_ingrediente_id ON estoque.itens_entrada_mercadoria (ingrediente_id);
```

---

### 4.7 `estoque.inventarios`

Cabeçalho de cada inventário realizado.

```sql
CREATE TABLE estoque.inventarios (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    data_realizacao   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    descricao         VARCHAR(200),                   -- ex.: "Inventário mensal - Março/2026"
    status            VARCHAR(20) NOT NULL DEFAULT 'EmAndamento',
    finalizado_em     TIMESTAMPTZ,                   -- preenchido ao finalizar
    observacoes       TEXT,
    criado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    criado_por        UUID        NOT NULL REFERENCES auth.usuarios(id),
    atualizado_por    UUID        NOT NULL REFERENCES auth.usuarios(id)
);
```

**Constraints:**
```sql
ALTER TABLE estoque.inventarios
    ADD CONSTRAINT chk_status_inventario
        CHECK (status IN ('EmAndamento', 'Finalizado', 'Cancelado')),
    ADD CONSTRAINT chk_finalizado_em_consistente
        CHECK (
            (status = 'Finalizado' AND finalizado_em IS NOT NULL) OR
            (status <> 'Finalizado' AND finalizado_em IS NULL)
        );
```

**Índices:**
```sql
CREATE INDEX idx_inventarios_data    ON estoque.inventarios (data_realizacao DESC);
CREATE INDEX idx_inventarios_status  ON estoque.inventarios (status);
CREATE INDEX idx_inventarios_criador ON estoque.inventarios (criado_por);
```

---

### 4.8 `estoque.itens_inventario`

Contagem de cada ingrediente em um inventário.

```sql
CREATE TABLE estoque.itens_inventario (
    id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    inventario_id         UUID          NOT NULL REFERENCES estoque.inventarios(id)
                                            ON DELETE CASCADE,
    ingrediente_id        UUID          NOT NULL REFERENCES estoque.ingredientes(id),
    quantidade_sistema    NUMERIC(15,4) NOT NULL,  -- saldo no sistema no momento da contagem
    quantidade_contada    NUMERIC(15,4) NOT NULL,  -- valor físico contado
    diferenca             NUMERIC(15,4) GENERATED ALWAYS AS
                              (quantidade_contada - quantidade_sistema) STORED,
    observacoes           TEXT
);
```

**Constraints:**
```sql
ALTER TABLE estoque.itens_inventario
    ADD CONSTRAINT chk_quantidade_contada_nao_negativa
        CHECK (quantidade_contada >= 0),
    ADD CONSTRAINT chk_quantidade_sistema_nao_negativa
        CHECK (quantidade_sistema >= 0),
    ADD CONSTRAINT uq_item_inventario_ingrediente
        UNIQUE (inventario_id, ingrediente_id);
```

**Índices:**
```sql
CREATE INDEX idx_itens_inventario_inventario_id  ON estoque.itens_inventario (inventario_id);
CREATE INDEX idx_itens_inventario_ingrediente_id ON estoque.itens_inventario (ingrediente_id);
```

---

### 4.9 `estoque.movimentacoes`

**Tabela central de rastreabilidade.** Registra toda movimentação de estoque — entradas, saídas futuras (produção) e ajustes de inventário. Nunca é alterada; apenas inserções.

```sql
CREATE TABLE estoque.movimentacoes (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    ingrediente_id   UUID          NOT NULL REFERENCES estoque.ingredientes(id),
    tipo             VARCHAR(30)   NOT NULL,
    -- 'Entrada'    = entrada de mercadoria
    -- 'Ajuste+'    = ajuste positivo de inventário
    -- 'Ajuste-'    = ajuste negativo de inventário
    -- 'SaidaProducao' = reservado para módulo de produção (futuro)
    quantidade       NUMERIC(15,4) NOT NULL,   -- sempre positivo; o tipo indica a direção
    saldo_apos       NUMERIC(15,4) NOT NULL,   -- saldo do ingrediente após a movimentação
    referencia_tipo  VARCHAR(50),              -- 'EntradaMercadoria', 'Inventario'
    referencia_id    UUID,                     -- id da entidade de origem
    observacoes      TEXT,
    criado_em        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    criado_por       UUID          NOT NULL REFERENCES auth.usuarios(id)
);
```

**Constraints:**
```sql
ALTER TABLE estoque.movimentacoes
    ADD CONSTRAINT chk_tipo_movimentacao
        CHECK (tipo IN ('Entrada', 'Ajuste+', 'Ajuste-', 'SaidaProducao')),
    ADD CONSTRAINT chk_quantidade_positiva
        CHECK (quantidade > 0),
    ADD CONSTRAINT chk_saldo_apos_nao_negativo
        CHECK (saldo_apos >= 0);
```

**Índices:**
```sql
CREATE INDEX idx_movimentacoes_ingrediente  ON estoque.movimentacoes (ingrediente_id);
CREATE INDEX idx_movimentacoes_criado_em    ON estoque.movimentacoes (criado_em DESC);
CREATE INDEX idx_movimentacoes_tipo         ON estoque.movimentacoes (tipo);
CREATE INDEX idx_movimentacoes_referencia   ON estoque.movimentacoes (referencia_tipo, referencia_id)
    WHERE referencia_id IS NOT NULL;
```

> **Importante:** `movimentacoes` é append-only. Nenhuma linha deve ser atualizada ou deletada. Cancelamentos geram uma movimentação compensatória.

---

## 5. Diagrama de Relacionamentos

```
auth.usuarios
    │
    ├──(criado_por / atualizado_por)──────────────────────┐
    │                                                      │
    ▼                                                      ▼
estoque.categorias_ingrediente          estoque.fornecedores
    │                                           │
    │ (categoria_id)                            │ (fornecedor_id)
    ▼                                           ▼
estoque.ingredientes ◄──────── estoque.itens_entrada_mercadoria
    │   ▲                                       │
    │   │ (ingrediente_id)                      │ (entrada_id)
    │   │                                       ▼
    │   ├──────────────────── estoque.entradas_mercadoria
    │   │
    │   │ (ingrediente_id)
    │   ├──────────────────── estoque.itens_inventario
    │   │                             │ (inventario_id)
    │   │                             ▼
    │   │                    estoque.inventarios
    │   │
    │   └──────────────────── estoque.movimentacoes
    │                                 ▲
    └─────────────────────────────────┘
        (saldo_apos reflete estoque_atual do ingrediente)

estoque.unidades_medida ──(unidade_medida_id)──► estoque.ingredientes
```

---

## 6. Estratégia de Atualização do Saldo

O campo `estoque_atual` em `estoque.ingredientes` é mantido **sincronizado via lógica de aplicação** (não triggers), para manter o controle na camada de domínio:

| Evento                              | Ação no banco                                                          |
|-------------------------------------|------------------------------------------------------------------------|
| Entrada de mercadoria confirmada    | `estoque_atual += quantidade` para cada item + inserção em `movimentacoes` |
| Inventário finalizado               | `estoque_atual = quantidade_contada` para itens com diferença ≠ 0 + inserção em `movimentacoes` com tipo `Ajuste+` ou `Ajuste-` |
| Entrada cancelada                   | `estoque_atual -= quantidade` dos itens + movimentação compensatória  |

> **Por que na aplicação e não em triggers?** Triggers dificultam testes unitários, ocultam lógica de negócio e complicam migrações. O handler de aplicação executa as duas operações em uma única transação, garantindo consistência.

---

## 7. Índices para Relatórios

Índices adicionais pensados especificamente para as queries dos relatórios:

```sql
-- Relatório de Estoque: ingredientes ativos com saldo abaixo do mínimo
CREATE INDEX idx_relatorio_estoque_critico
    ON estoque.ingredientes (categoria_id, nome)
    WHERE ativo = TRUE;

-- Relatório de Movimentação: filtro por período e ingrediente
CREATE INDEX idx_relatorio_movimentacao_periodo
    ON estoque.movimentacoes (ingrediente_id, criado_em DESC);

-- Relatório de Movimentação: filtro só por período (visão geral)
CREATE INDEX idx_relatorio_movimentacao_geral
    ON estoque.movimentacoes (criado_em DESC, tipo);
```

---

## 8. Considerações de Segurança e Integridade

| Ponto                         | Decisão                                                                 |
|-------------------------------|-------------------------------------------------------------------------|
| Deleção de ingredientes       | Soft delete (`ativo = FALSE`) — nunca excluir fisicamente               |
| Deleção de fornecedores       | Soft delete — histórico de entradas deve ser preservado                 |
| Deleção de entradas           | Não permitida — cancelamento via status `Cancelada` + movimentação compensatória |
| Deleção de inventários        | Apenas `EmAndamento` pode ser cancelado; `Finalizado` é imutável        |
| Deleção de movimentações      | **Nunca permitida** — tabela append-only                                |
| CNPJ do fornecedor            | Validado por regex no banco + regra de negócio na aplicação             |
| Transações                    | Todas as operações que alteram `estoque_atual` + inserem em `movimentacoes` devem estar em uma única transação |

---

## 9. Resumo das Tabelas

| Tabela                             | Linhas esperadas | Observação                          |
|------------------------------------|-----------------|--------------------------------------|
| `estoque.unidades_medida`          | ~10 (fixas)     | Lookup imutável                      |
| `estoque.categorias_ingrediente`   | ~20             | Gerenciado pelo Admin                |
| `estoque.ingredientes`             | ~200            | Crescimento lento                    |
| `estoque.fornecedores`             | ~50             | Crescimento lento                    |
| `estoque.entradas_mercadoria`      | ~1.000/ano      | Alta leitura em relatórios           |
| `estoque.itens_entrada_mercadoria` | ~5.000/ano      | JOIN frequente com entradas          |
| `estoque.inventarios`              | ~12/ano         | Inventários mensais esperados        |
| `estoque.itens_inventario`         | ~2.400/ano      | ~200 ingredientes × 12 inventários   |
| `estoque.movimentacoes`            | ~8.000/ano      | Tabela mais consultada em relatórios |
