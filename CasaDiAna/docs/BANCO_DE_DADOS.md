# Estrutura do Banco de Dados — Casa di Ana

Documento gerado a partir dos arquivos `IEntityTypeConfiguration<T>` e das entidades de domínio do projeto. Reflete o estado real do banco após todas as migrations.

**SGBD:** PostgreSQL 15  
**ORM:** Entity Framework Core 8 + Npgsql  
**Schemas:** `auth`, `estoque`, `producao`

---

## Convenções

- Todos os nomes de tabela e coluna estão em `snake_case`
- PKs são do tipo `uuid` gerado pelo domínio (`Guid.NewGuid()`), exceto `unidades_medida.id` que é `smallint`
- Colunas de auditoria `criado_por` e `atualizado_por` armazenam o UUID do usuário que realizou a operação, mas **não possuem FK explícita** para `auth.usuarios`
- Enums armazenados como `varchar` têm mapeamento explícito via `HasConversion`
- Enums armazenados como `integer` seguem o valor numérico do C# (sem `HasConversion`)
- Propriedades computadas (`CustoTotal` em `ItemEntradaMercadoria`, `Diferenca` em `ItemInventario`) são ignoradas pelo EF (`builder.Ignore`) — não existem como colunas

---

## Schema: `auth`

---

### Tabela: `auth.usuarios`

| Coluna | Tipo | Restrições |
|---|---|---|
| `id` | `uuid` | PK, NOT NULL |
| `nome` | `varchar(150)` | NOT NULL |
| `email` | `varchar(254)` | NOT NULL, UNIQUE |
| `senha_hash` | `text` | NOT NULL |
| `papel` | `varchar(50)` | NOT NULL — armazenado como string do enum |
| `ativo` | `boolean` | NOT NULL |
| `criado_em` | `timestamp` | NOT NULL |
| `atualizado_em` | `timestamp` | NOT NULL |

**Índices:**
- UNIQUE em `email`

**Valores válidos para `papel`:** `Admin`, `Coordenador`, `OperadorCozinha`, `OperadorPanificacao`, `OperadorBar`, `Compras`

**Relacionamentos:** nenhuma FK de saída

---

## Schema: `estoque`

---

### Tabela: `estoque.unidades_medida`

| Coluna | Tipo | Restrições |
|---|---|---|
| `id` | `smallint` | PK, NOT NULL |
| `codigo` | `varchar(10)` | NOT NULL, UNIQUE |
| `descricao` | `varchar(50)` | NOT NULL |

**Índices:**
- UNIQUE em `codigo`

**Dados de seed (imutáveis):**

| id | codigo | descricao |
|---|---|---|
| 1 | KG | Quilograma |
| 2 | G | Grama |
| 3 | L | Litro |
| 4 | ML | Mililitro |
| 5 | UN | Unidade |
| 6 | CX | Caixa |
| 7 | PCT | Pacote |
| 8 | DZ | Dúzia |

**Relacionamentos:** nenhuma FK de saída

---

### Tabela: `estoque.categorias_ingrediente`

| Coluna | Tipo | Restrições |
|---|---|---|
| `id` | `uuid` | PK, NOT NULL |
| `nome` | `varchar(100)` | NOT NULL, UNIQUE |
| `ativo` | `boolean` | NOT NULL |
| `criado_em` | `timestamp` | NOT NULL |
| `atualizado_em` | `timestamp` | NOT NULL |
| `criado_por` | `uuid` | NOT NULL — sem FK |
| `atualizado_por` | `uuid` | NOT NULL — sem FK |

**Índices:**
- UNIQUE em `nome`

**Relacionamentos:** nenhuma FK de saída

---

### Tabela: `estoque.ingredientes`

| Coluna | Tipo | Restrições |
|---|---|---|
| `id` | `uuid` | PK, NOT NULL |
| `nome` | `varchar(150)` | NOT NULL |
| `codigo_interno` | `varchar(30)` | NULL, UNIQUE PARTIAL (WHERE `codigo_interno IS NOT NULL`) |
| `categoria_id` | `uuid` | NULL, FK → `estoque.categorias_ingrediente.id` ON DELETE SET NULL |
| `unidade_medida_id` | `smallint` | NOT NULL, FK → `estoque.unidades_medida.id` ON DELETE RESTRICT |
| `estoque_atual` | `numeric(15,4)` | NOT NULL |
| `estoque_minimo` | `numeric(15,4)` | NOT NULL |
| `estoque_maximo` | `numeric(15,4)` | NULL |
| `custo_unitario` | `numeric(15,4)` | NULL |
| `observacoes` | `text` | NULL |
| `ativo` | `boolean` | NOT NULL |
| `criado_em` | `timestamp` | NOT NULL |
| `atualizado_em` | `timestamp` | NOT NULL |
| `criado_por` | `uuid` | NOT NULL — sem FK |
| `atualizado_por` | `uuid` | NOT NULL — sem FK |

**Constraints CHECK** (definidas no modelo — ver nota abaixo):
- `chk_estoque_atual_nao_negativo`: `estoque_atual >= 0`
- `chk_estoque_minimo_nao_negativo`: `estoque_minimo >= 0`

> **⚠ Nota sobre constraints:** A migration `20260328035529_RemoverCheckEstoqueNaoNegativo` removeu `chk_estoque_atual_nao_negativo` via SQL direto, permitindo estoque negativo em produção. A constraint continua declarada na configuração do modelo mas pode não estar ativa no banco dependendo da ordem de migrations.

**Índices:**
- UNIQUE PARTIAL em `codigo_interno` WHERE `codigo_interno IS NOT NULL`
- Composto em `(categoria_id, nome)`
- Composto parcial em `(estoque_atual, estoque_minimo)` WHERE `ativo = TRUE`

**FKs de saída:**
- `categoria_id` → `estoque.categorias_ingrediente.id` (SET NULL)
- `unidade_medida_id` → `estoque.unidades_medida.id` (RESTRICT)

---

### Tabela: `estoque.fornecedores`

| Coluna | Tipo | Restrições |
|---|---|---|
| `id` | `uuid` | PK, NOT NULL |
| `razao_social` | `varchar(200)` | NOT NULL |
| `nome_fantasia` | `varchar(200)` | NULL |
| `cnpj` | `char(14)` | NULL, UNIQUE PARTIAL (WHERE `cnpj IS NOT NULL`) |
| `telefone` | `varchar(20)` | NULL |
| `email` | `varchar(254)` | NULL |
| `contato_nome` | `varchar(150)` | NULL |
| `observacoes` | `text` | NULL |
| `ativo` | `boolean` | NOT NULL |
| `criado_em` | `timestamp` | NOT NULL |
| `atualizado_em` | `timestamp` | NOT NULL |
| `criado_por` | `uuid` | NOT NULL — sem FK |
| `atualizado_por` | `uuid` | NOT NULL — sem FK |

**Constraint CHECK:**
- `chk_cnpj_formato`: `cnpj IS NULL OR cnpj ~ '^[0-9]{14}$'`

**Índices:**
- UNIQUE PARTIAL em `cnpj` WHERE `cnpj IS NOT NULL`
- em `razao_social`
- em `ativo`

**Relacionamentos:** nenhuma FK de saída

---

### Tabela: `estoque.entradas_mercadoria`

| Coluna | Tipo | Restrições |
|---|---|---|
| `id` | `uuid` | PK, NOT NULL |
| `fornecedor_id` | `uuid` | NOT NULL, FK → `estoque.fornecedores.id` ON DELETE RESTRICT |
| `numero_nota_fiscal` | `varchar(60)` | NULL |
| `data_entrada` | `timestamp` | NOT NULL |
| `observacoes` | `text` | NULL |
| `status` | `varchar(20)` | NOT NULL — armazenado como string do enum |
| `criado_em` | `timestamp` | NOT NULL |
| `atualizado_em` | `timestamp` | NOT NULL |
| `criado_por` | `uuid` | NOT NULL — sem FK |
| `atualizado_por` | `uuid` | NOT NULL — sem FK |

**Valores válidos para `status`:** `Confirmada`, `Cancelada`

**Índices:**
- em `fornecedor_id`
- em `data_entrada`
- PARTIAL em `numero_nota_fiscal` WHERE `numero_nota_fiscal IS NOT NULL`

**FKs de saída:**
- `fornecedor_id` → `estoque.fornecedores.id` (RESTRICT)

---

### Tabela: `estoque.itens_entrada_mercadoria`

| Coluna | Tipo | Restrições |
|---|---|---|
| `id` | `uuid` | PK, NOT NULL |
| `entrada_id` | `uuid` | NOT NULL, FK → `estoque.entradas_mercadoria.id` ON DELETE CASCADE |
| `ingrediente_id` | `uuid` | NOT NULL, FK → `estoque.ingredientes.id` ON DELETE RESTRICT |
| `quantidade` | `numeric(15,4)` | NOT NULL |
| `custo_unitario` | `numeric(15,4)` | NOT NULL |

> **Nota:** `custo_total` é propriedade computada (`quantidade × custo_unitario`) — **não existe como coluna**.

**Constraints CHECK:**
- `chk_item_quantidade_positiva`: `quantidade > 0`
- `chk_item_custo_nao_negativo`: `custo_unitario >= 0`

**Índices:**
- UNIQUE composto em `(entrada_id, ingrediente_id)`
- em `ingrediente_id`

**FKs de saída:**
- `entrada_id` → `estoque.entradas_mercadoria.id` (CASCADE)
- `ingrediente_id` → `estoque.ingredientes.id` (RESTRICT)

---

### Tabela: `estoque.movimentacoes`

| Coluna | Tipo | Restrições |
|---|---|---|
| `id` | `uuid` | PK, NOT NULL |
| `ingrediente_id` | `uuid` | NOT NULL, FK → `estoque.ingredientes.id` ON DELETE RESTRICT |
| `tipo` | `varchar(30)` | NOT NULL — armazenado como string do enum |
| `quantidade` | `numeric(15,4)` | NOT NULL |
| `saldo_apos` | `numeric(15,4)` | NOT NULL |
| `referencia_tipo` | `varchar(50)` | NULL |
| `referencia_id` | `uuid` | NULL |
| `observacoes` | `text` | NULL |
| `criado_em` | `timestamp` | NOT NULL |
| `criado_por` | `uuid` | NOT NULL — sem FK |

**Valores válidos para `tipo`:** `Entrada`, `AjustePositivo`, `AjusteNegativo`, `SaidaProducao`

> **Nota sobre `referencia_tipo` / `referencia_id`:** Identificam a origem da movimentação. `referencia_tipo` é uma string descritiva (ex: `"EntradaMercadoria"`, `"InventarioAjuste"`, `"ProducaoDiaria"`, `"CorrecaoEstoque"`). `referencia_id` é o UUID do registro de origem. **Não há FK explícita** — é um padrão de referência polimórfica.

**Constraints CHECK** (definidas no modelo — ver nota abaixo):
- `chk_mov_quantidade_positiva`: `quantidade > 0`
- `chk_mov_saldo_nao_negativo`: `saldo_apos >= 0`

> **⚠ Nota:** A migration `20260328035920_RemoverCheckSaldoMovimentacaoNaoNegativo` removeu `chk_mov_saldo_nao_negativo` via SQL direto.

**Índices:**
- em `ingrediente_id`
- em `criado_em`
- em `tipo`
- PARTIAL composto em `(referencia_tipo, referencia_id)` WHERE `referencia_id IS NOT NULL`

**FKs de saída:**
- `ingrediente_id` → `estoque.ingredientes.id` (RESTRICT)

---

### Tabela: `estoque.inventarios`

| Coluna | Tipo | Restrições |
|---|---|---|
| `id` | `uuid` | PK, NOT NULL |
| `data_realizacao` | `timestamp` | NOT NULL |
| `descricao` | `varchar(200)` | NULL |
| `status` | `varchar(20)` | NOT NULL — armazenado como string do enum |
| `finalizado_em` | `timestamp` | NULL |
| `observacoes` | `text` | NULL |
| `criado_em` | `timestamp` | NOT NULL |
| `atualizado_em` | `timestamp` | NOT NULL |
| `criado_por` | `uuid` | NOT NULL — sem FK |
| `atualizado_por` | `uuid` | NOT NULL — sem FK |

**Valores válidos para `status`:** `EmAndamento`, `Finalizado`, `Cancelado`

**Índices:**
- em `data_realizacao`
- em `status`

**Relacionamentos:** nenhuma FK de saída

---

### Tabela: `estoque.itens_inventario`

| Coluna | Tipo | Restrições |
|---|---|---|
| `id` | `uuid` | PK, NOT NULL |
| `inventario_id` | `uuid` | NOT NULL, FK → `estoque.inventarios.id` ON DELETE CASCADE |
| `ingrediente_id` | `uuid` | NOT NULL, FK → `estoque.ingredientes.id` ON DELETE RESTRICT |
| `quantidade_sistema` | `numeric(15,4)` | NOT NULL |
| `quantidade_contada` | `numeric(15,4)` | NOT NULL |
| `observacoes` | `text` | NULL |

> **Nota:** `diferenca` é propriedade computada (`quantidade_contada - quantidade_sistema`) — **não existe como coluna**.

**Constraints CHECK:**
- `chk_qtd_sistema_nao_negativa`: `quantidade_sistema >= 0`
- `chk_qtd_contada_nao_negativa`: `quantidade_contada >= 0`

**Índices:**
- UNIQUE composto em `(inventario_id, ingrediente_id)`
- em `ingrediente_id`

**FKs de saída:**
- `inventario_id` → `estoque.inventarios.id` (CASCADE)
- `ingrediente_id` → `estoque.ingredientes.id` (RESTRICT)

---

### Tabela: `estoque.notificacoes_estoque`

| Coluna | Tipo | Restrições |
|---|---|---|
| `id` | `uuid` | PK, NOT NULL |
| `titulo` | `varchar(200)` | NOT NULL |
| `mensagem` | `varchar(1000)` | NOT NULL |
| `tipo` | `integer` | NOT NULL — armazenado como inteiro do enum |
| `data_criacao` | `timestamp` | NOT NULL |
| `lida` | `boolean` | NOT NULL |
| `ingrediente_id` | `uuid` | NOT NULL, FK → `estoque.ingredientes.id` ON DELETE CASCADE |

**Valores de `tipo` (integer):** `1` = Atencao, `2` = Critico, `3` = Zerado

**Índices:**
- Composto `(ingrediente_id, lida)` com nome `ix_notificacoes_estoque_ingrediente_lida`
- em `data_criacao` com nome `ix_notificacoes_estoque_data_criacao`

**FKs de saída:**
- `ingrediente_id` → `estoque.ingredientes.id` (CASCADE)

---

## Schema: `producao`

---

### Tabela: `producao.categorias_produto`

| Coluna | Tipo | Restrições |
|---|---|---|
| `id` | `uuid` | PK, NOT NULL |
| `nome` | `varchar(100)` | NOT NULL, UNIQUE |
| `ativo` | `boolean` | NOT NULL |
| `criado_em` | `timestamp` | NOT NULL |
| `atualizado_em` | `timestamp` | NOT NULL |
| `criado_por` | `uuid` | NOT NULL — sem FK |
| `atualizado_por` | `uuid` | NOT NULL — sem FK |

**Índices:**
- UNIQUE em `nome`

**Relacionamentos:** nenhuma FK de saída

---

### Tabela: `producao.produtos`

| Coluna | Tipo | Restrições |
|---|---|---|
| `id` | `uuid` | PK, NOT NULL |
| `nome` | `varchar(150)` | NOT NULL, UNIQUE |
| `categoria_produto_id` | `uuid` | NULL, FK → `producao.categorias_produto.id` ON DELETE SET NULL |
| `descricao` | `text` | NULL |
| `preco_venda` | `numeric(15,2)` | NOT NULL |
| `ativo` | `boolean` | NOT NULL |
| `criado_em` | `timestamp` | NOT NULL |
| `atualizado_em` | `timestamp` | NOT NULL |
| `criado_por` | `uuid` | NOT NULL — sem FK |
| `atualizado_por` | `uuid` | NOT NULL — sem FK |

**Índices:**
- UNIQUE em `nome`

**FKs de saída:**
- `categoria_produto_id` → `producao.categorias_produto.id` (SET NULL)

---

### Tabela: `producao.itens_ficha_tecnica`

| Coluna | Tipo | Restrições |
|---|---|---|
| `id` | `uuid` | PK, NOT NULL |
| `produto_id` | `uuid` | NOT NULL, FK → `producao.produtos.id` ON DELETE CASCADE |
| `ingrediente_id` | `uuid` | NOT NULL, FK → `estoque.ingredientes.id` ON DELETE RESTRICT |
| `quantidade_por_unidade` | `numeric(15,4)` | NOT NULL |

**Índices:**
- UNIQUE composto em `(produto_id, ingrediente_id)`

**FKs de saída:**
- `produto_id` → `producao.produtos.id` (CASCADE)
- `ingrediente_id` → `estoque.ingredientes.id` (RESTRICT)

---

### Tabela: `producao.producoes_diarias`

| Coluna | Tipo | Restrições |
|---|---|---|
| `id` | `uuid` | PK, NOT NULL |
| `produto_id` | `uuid` | NOT NULL, FK → `producao.produtos.id` ON DELETE RESTRICT |
| `data` | `timestamp` | NOT NULL |
| `quantidade_produzida` | `numeric(15,4)` | NOT NULL |
| `custo_total` | `numeric(15,2)` | NOT NULL |
| `observacoes` | `text` | NULL |
| `criado_em` | `timestamp` | NOT NULL |
| `criado_por` | `uuid` | NOT NULL — sem FK |

**Índices:**
- Composto em `(produto_id, data)`
- em `data`

**FKs de saída:**
- `produto_id` → `producao.produtos.id` (RESTRICT)

---

### Tabela: `producao.vendas_diarias`

| Coluna | Tipo | Restrições |
|---|---|---|
| `id` | `uuid` | PK, NOT NULL |
| `produto_id` | `uuid` | NOT NULL, FK → `producao.produtos.id` ON DELETE RESTRICT |
| `data` | `timestamp` | NOT NULL |
| `quantidade_vendida` | `numeric(15,4)` | NOT NULL |
| `criado_em` | `timestamp` | NOT NULL |
| `criado_por` | `uuid` | NOT NULL — sem FK |

**Índices:**
- Composto em `(produto_id, data)`
- em `data`

**FKs de saída:**
- `produto_id` → `producao.produtos.id` (RESTRICT)

---

### Tabela: `producao.perdas_produto`

| Coluna | Tipo | Restrições |
|---|---|---|
| `id` | `uuid` | PK, NOT NULL |
| `produto_id` | `uuid` | NOT NULL, FK → `producao.produtos.id` ON DELETE RESTRICT |
| `data` | `timestamp` | NOT NULL |
| `quantidade` | `numeric(15,4)` | NOT NULL |
| `justificativa` | `varchar(500)` | NOT NULL |
| `criado_em` | `timestamp` | NOT NULL |
| `criado_por` | `uuid` | NOT NULL — sem FK |

**Índices:**
- Composto em `(produto_id, data)`
- em `data`

**FKs de saída:**
- `produto_id` → `producao.produtos.id` (RESTRICT)

---

### Tabela: `producao.historico_impressao_etiquetas`

| Coluna | Tipo | Restrições |
|---|---|---|
| `id` | `uuid` | PK, NOT NULL |
| `produto_id` | `uuid` | NOT NULL, FK → `producao.produtos.id` ON DELETE RESTRICT |
| `tipo_etiqueta` | `integer` | NOT NULL — armazenado como inteiro do enum |
| `quantidade` | `integer` | NOT NULL |
| `data_producao` | `timestamp` | NOT NULL |
| `impresso_por` | `uuid` | NOT NULL — sem FK |
| `impresso_em` | `timestamp` | NOT NULL |

**Valores de `tipo_etiqueta` (integer):** `1` = Completa, `2` = Simples, `3` = Nutricional

**Índices:**
- em `produto_id` com nome `ix_historico_impressao_etiquetas_produto_id`
- em `impresso_em` com nome `ix_historico_impressao_etiquetas_impresso_em`

**FKs de saída:**
- `produto_id` → `producao.produtos.id` (RESTRICT)

---

### Tabela: `producao.modelos_etiqueta_nutricional`

| Coluna | Tipo | Restrições |
|---|---|---|
| `id` | `uuid` | PK, NOT NULL |
| `produto_id` | `uuid` | NOT NULL, FK → `producao.produtos.id` ON DELETE CASCADE, UNIQUE |
| `porcao` | `varchar(50)` | NOT NULL |
| `valor_energetico_kcal` | `numeric(10,2)` | NOT NULL |
| `valor_energetico_kj` | `numeric(10,2)` | NOT NULL |
| `carboidratos` | `numeric(10,2)` | NOT NULL |
| `acucares_totais` | `numeric(10,2)` | NOT NULL |
| `proteinas` | `numeric(10,2)` | NOT NULL |
| `gorduras_totais` | `numeric(10,2)` | NOT NULL |
| `gorduras_saturadas` | `numeric(10,2)` | NOT NULL |
| `fibra_alimentar` | `numeric(10,2)` | NOT NULL |
| `sodio` | `numeric(10,2)` | NOT NULL |
| `criado_em` | `timestamp` | NOT NULL |
| `atualizado_em` | `timestamp` | NOT NULL |

> Relação 1:1 com `producao.produtos` — cada produto tem no máximo um modelo nutricional.

**Índices:**
- UNIQUE em `produto_id` com nome `ix_modelos_etiqueta_nutricional_produto_id`

**FKs de saída:**
- `produto_id` → `producao.produtos.id` (CASCADE)

---

## Mapa de Relacionamentos

```
auth.usuarios
  (sem FK de saída — referenciado por criado_por/atualizado_por como UUID sem FK explícita)

estoque.unidades_medida ◄── estoque.ingredientes.unidade_medida_id (RESTRICT)

estoque.categorias_ingrediente ◄── estoque.ingredientes.categoria_id (SET NULL)

estoque.ingredientes
  ◄── estoque.itens_entrada_mercadoria.ingrediente_id (RESTRICT)
  ◄── estoque.movimentacoes.ingrediente_id (RESTRICT)
  ◄── estoque.itens_inventario.ingrediente_id (RESTRICT)
  ◄── estoque.notificacoes_estoque.ingrediente_id (CASCADE)
  ◄── producao.itens_ficha_tecnica.ingrediente_id (RESTRICT)

estoque.fornecedores ◄── estoque.entradas_mercadoria.fornecedor_id (RESTRICT)

estoque.entradas_mercadoria ◄── estoque.itens_entrada_mercadoria.entrada_id (CASCADE)

estoque.inventarios ◄── estoque.itens_inventario.inventario_id (CASCADE)

producao.categorias_produto ◄── producao.produtos.categoria_produto_id (SET NULL)

producao.produtos
  ◄── producao.itens_ficha_tecnica.produto_id (CASCADE)
  ◄── producao.producoes_diarias.produto_id (RESTRICT)
  ◄── producao.vendas_diarias.produto_id (RESTRICT)
  ◄── producao.perdas_produto.produto_id (RESTRICT)
  ◄── producao.historico_impressao_etiquetas.produto_id (RESTRICT)
  ◄── producao.modelos_etiqueta_nutricional.produto_id (CASCADE, UNIQUE)
```

---

## Formato dbdiagram.io (DBML)

Compatível com [https://dbdiagram.io](https://dbdiagram.io) — cole diretamente no editor.

```dbml
// Casa di Ana — Database Schema
// Schemas: auth, estoque, producao

Table auth_usuarios [headercolor: #e74c3c] {
  id uuid [pk, not null]
  nome varchar(150) [not null]
  email varchar(254) [not null, unique]
  senha_hash text [not null]
  papel varchar(50) [not null, note: 'Admin | Coordenador | OperadorCozinha | OperadorPanificacao | OperadorBar | Compras']
  ativo boolean [not null]
  criado_em timestamp [not null]
  atualizado_em timestamp [not null]
}

Table estoque_unidades_medida [headercolor: #3498db] {
  id smallint [pk, not null]
  codigo varchar(10) [not null, unique]
  descricao varchar(50) [not null]
}

Table estoque_categorias_ingrediente [headercolor: #3498db] {
  id uuid [pk, not null]
  nome varchar(100) [not null, unique]
  ativo boolean [not null]
  criado_em timestamp [not null]
  atualizado_em timestamp [not null]
  criado_por uuid [not null]
  atualizado_por uuid [not null]
}

Table estoque_ingredientes [headercolor: #3498db] {
  id uuid [pk, not null]
  nome varchar(150) [not null]
  codigo_interno varchar(30) [null, unique, note: 'PARTIAL: WHERE codigo_interno IS NOT NULL']
  categoria_id uuid [null, ref: > estoque_categorias_ingrediente.id]
  unidade_medida_id smallint [not null, ref: > estoque_unidades_medida.id]
  estoque_atual numeric_15_4 [not null, note: 'CHECK >= 0 (removido por migration 20260328035529)']
  estoque_minimo numeric_15_4 [not null, note: 'CHECK >= 0']
  estoque_maximo numeric_15_4 [null]
  custo_unitario numeric_15_4 [null]
  observacoes text [null]
  ativo boolean [not null]
  criado_em timestamp [not null]
  atualizado_em timestamp [not null]
  criado_por uuid [not null]
  atualizado_por uuid [not null]
}

Table estoque_fornecedores [headercolor: #3498db] {
  id uuid [pk, not null]
  razao_social varchar(200) [not null]
  nome_fantasia varchar(200) [null]
  cnpj char(14) [null, unique, note: 'PARTIAL: WHERE cnpj IS NOT NULL. CHECK: ^[0-9]{14}$']
  telefone varchar(20) [null]
  email varchar(254) [null]
  contato_nome varchar(150) [null]
  observacoes text [null]
  ativo boolean [not null]
  criado_em timestamp [not null]
  atualizado_em timestamp [not null]
  criado_por uuid [not null]
  atualizado_por uuid [not null]
}

Table estoque_entradas_mercadoria [headercolor: #3498db] {
  id uuid [pk, not null]
  fornecedor_id uuid [not null, ref: > estoque_fornecedores.id]
  numero_nota_fiscal varchar(60) [null]
  data_entrada timestamp [not null]
  observacoes text [null]
  status varchar(20) [not null, note: 'Confirmada | Cancelada']
  criado_em timestamp [not null]
  atualizado_em timestamp [not null]
  criado_por uuid [not null]
  atualizado_por uuid [not null]
}

Table estoque_itens_entrada_mercadoria [headercolor: #3498db] {
  id uuid [pk, not null]
  entrada_id uuid [not null, ref: > estoque_entradas_mercadoria.id]
  ingrediente_id uuid [not null, ref: > estoque_ingredientes.id]
  quantidade numeric_15_4 [not null, note: 'CHECK > 0']
  custo_unitario numeric_15_4 [not null, note: 'CHECK >= 0']

  indexes {
    (entrada_id, ingrediente_id) [unique]
  }
}

Table estoque_movimentacoes [headercolor: #3498db] {
  id uuid [pk, not null]
  ingrediente_id uuid [not null, ref: > estoque_ingredientes.id]
  tipo varchar(30) [not null, note: 'Entrada | AjustePositivo | AjusteNegativo | SaidaProducao']
  quantidade numeric_15_4 [not null, note: 'CHECK > 0']
  saldo_apos numeric_15_4 [not null, note: 'CHECK >= 0 (removido por migration 20260328035920)']
  referencia_tipo varchar(50) [null, note: 'Ex: EntradaMercadoria, InventarioAjuste, ProducaoDiaria']
  referencia_id uuid [null, note: 'UUID do registro de origem - sem FK explícita']
  observacoes text [null]
  criado_em timestamp [not null]
  criado_por uuid [not null]
}

Table estoque_inventarios [headercolor: #3498db] {
  id uuid [pk, not null]
  data_realizacao timestamp [not null]
  descricao varchar(200) [null]
  status varchar(20) [not null, note: 'EmAndamento | Finalizado | Cancelado']
  finalizado_em timestamp [null]
  observacoes text [null]
  criado_em timestamp [not null]
  atualizado_em timestamp [not null]
  criado_por uuid [not null]
  atualizado_por uuid [not null]
}

Table estoque_itens_inventario [headercolor: #3498db] {
  id uuid [pk, not null]
  inventario_id uuid [not null, ref: > estoque_inventarios.id]
  ingrediente_id uuid [not null, ref: > estoque_ingredientes.id]
  quantidade_sistema numeric_15_4 [not null, note: 'CHECK >= 0']
  quantidade_contada numeric_15_4 [not null, note: 'CHECK >= 0']
  observacoes text [null]
  note: 'diferenca = quantidade_contada - quantidade_sistema (coluna NÃO existe, calculada no domínio)'

  indexes {
    (inventario_id, ingrediente_id) [unique]
  }
}

Table estoque_notificacoes_estoque [headercolor: #3498db] {
  id uuid [pk, not null]
  titulo varchar(200) [not null]
  mensagem varchar(1000) [not null]
  tipo integer [not null, note: '1=Atencao | 2=Critico | 3=Zerado']
  data_criacao timestamp [not null]
  lida boolean [not null]
  ingrediente_id uuid [not null, ref: > estoque_ingredientes.id]
}

Table producao_categorias_produto [headercolor: #27ae60] {
  id uuid [pk, not null]
  nome varchar(100) [not null, unique]
  ativo boolean [not null]
  criado_em timestamp [not null]
  atualizado_em timestamp [not null]
  criado_por uuid [not null]
  atualizado_por uuid [not null]
}

Table producao_produtos [headercolor: #27ae60] {
  id uuid [pk, not null]
  nome varchar(150) [not null, unique]
  categoria_produto_id uuid [null, ref: > producao_categorias_produto.id]
  descricao text [null]
  preco_venda numeric_15_2 [not null]
  ativo boolean [not null]
  criado_em timestamp [not null]
  atualizado_em timestamp [not null]
  criado_por uuid [not null]
  atualizado_por uuid [not null]
}

Table producao_itens_ficha_tecnica [headercolor: #27ae60] {
  id uuid [pk, not null]
  produto_id uuid [not null, ref: > producao_produtos.id]
  ingrediente_id uuid [not null, ref: > estoque_ingredientes.id]
  quantidade_por_unidade numeric_15_4 [not null]

  indexes {
    (produto_id, ingrediente_id) [unique]
  }
}

Table producao_producoes_diarias [headercolor: #27ae60] {
  id uuid [pk, not null]
  produto_id uuid [not null, ref: > producao_produtos.id]
  data timestamp [not null]
  quantidade_produzida numeric_15_4 [not null]
  custo_total numeric_15_2 [not null]
  observacoes text [null]
  criado_em timestamp [not null]
  criado_por uuid [not null]
}

Table producao_vendas_diarias [headercolor: #27ae60] {
  id uuid [pk, not null]
  produto_id uuid [not null, ref: > producao_produtos.id]
  data timestamp [not null]
  quantidade_vendida numeric_15_4 [not null]
  criado_em timestamp [not null]
  criado_por uuid [not null]
}

Table producao_perdas_produto [headercolor: #27ae60] {
  id uuid [pk, not null]
  produto_id uuid [not null, ref: > producao_produtos.id]
  data timestamp [not null]
  quantidade numeric_15_4 [not null]
  justificativa varchar(500) [not null]
  criado_em timestamp [not null]
  criado_por uuid [not null]
}

Table producao_historico_impressao_etiquetas [headercolor: #27ae60] {
  id uuid [pk, not null]
  produto_id uuid [not null, ref: > producao_produtos.id]
  tipo_etiqueta integer [not null, note: '1=Completa | 2=Simples | 3=Nutricional']
  quantidade integer [not null]
  data_producao timestamp [not null]
  impresso_por uuid [not null, note: 'UUID do usuário - sem FK explícita']
  impresso_em timestamp [not null]
}

Table producao_modelos_etiqueta_nutricional [headercolor: #27ae60] {
  id uuid [pk, not null]
  produto_id uuid [not null, unique, ref: > producao_produtos.id]
  porcao varchar(50) [not null]
  valor_energetico_kcal numeric_10_2 [not null]
  valor_energetico_kj numeric_10_2 [not null]
  carboidratos numeric_10_2 [not null]
  acucares_totais numeric_10_2 [not null]
  proteinas numeric_10_2 [not null]
  gorduras_totais numeric_10_2 [not null]
  gorduras_saturadas numeric_10_2 [not null]
  fibra_alimentar numeric_10_2 [not null]
  sodio numeric_10_2 [not null]
  criado_em timestamp [not null]
  atualizado_em timestamp [not null]
}
```

---

## Observações Finais

### Colunas computadas que não existem no banco

| Entidade | Propriedade C# | Razão |
|---|---|---|
| `ItemEntradaMercadoria` | `CustoTotal` | `builder.Ignore()` — calculada como `Quantidade × CustoUnitario` |
| `ItemInventario` | `Diferenca` | `builder.Ignore()` — calculada como `QuantidadeContada - QuantidadeSistema` |

### Enums armazenados como string (via `HasConversion`)

| Tabela | Coluna | Tipo no banco | Valores |
|---|---|---|---|
| `auth.usuarios` | `papel` | `varchar(50)` | `Admin`, `Coordenador`, `OperadorCozinha`, `OperadorPanificacao`, `OperadorBar`, `Compras` |
| `estoque.entradas_mercadoria` | `status` | `varchar(20)` | `Confirmada`, `Cancelada` |
| `estoque.inventarios` | `status` | `varchar(20)` | `EmAndamento`, `Finalizado`, `Cancelado` |
| `estoque.movimentacoes` | `tipo` | `varchar(30)` | `Entrada`, `AjustePositivo`, `AjusteNegativo`, `SaidaProducao` |

### Enums armazenados como integer (sem `HasConversion`)

| Tabela | Coluna | Tipo no banco | Valores |
|---|---|---|---|
| `estoque.notificacoes_estoque` | `tipo` | `integer` | `1` = Atencao, `2` = Critico, `3` = Zerado |
| `producao.historico_impressao_etiquetas` | `tipo_etiqueta` | `integer` | `1` = Completa, `2` = Simples, `3` = Nutricional |

### Constraints removidas por migrations

| Tabela | Constraint | Migration que removeu |
|---|---|---|
| `estoque.ingredientes` | `chk_estoque_atual_nao_negativo` | `20260328035529_RemoverCheckEstoqueNaoNegativo` |
| `estoque.movimentacoes` | `chk_mov_saldo_nao_negativo` | `20260328035920_RemoverCheckSaldoMovimentacaoNaoNegativo` |

Ambas foram removidas intencionalmente para permitir estoque negativo — decisão de domínio documentada no `CLAUDE.md`.
