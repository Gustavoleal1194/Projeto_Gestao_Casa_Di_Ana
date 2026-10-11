# Confirmação da importação recalculada no servidor — Design

**Data:** 2026-10-11
**Status:** aprovado em conversa (abordagem A)
**Origem:** alerta da revisão de segurança após o push da feature de taxa de serviço e entregas (`262d3fd`).

## 1. Problema

O `POST /api/importacao-vendas/confirmar` confia em dados enviados pela tela:

| Dado | Hoje | Risco |
|---|---|---|
| `Hash` | vem da tela | um hash inventado burla o bloqueio de reimportação do mesmo CSV |
| `Itens[].Quantidade` | vem da tela | vira `VendaDiaria` sem relação com o CSV |
| `TotalTaxaServico`, `TotalEntregas` | vêm da tela | inflam receita e repasses no fechamento |
| `PeriodoDe/Ate`, contagens | vêm da tela | registro de auditoria da importação não confiável |

Na tela o usuário só toma três decisões: **data de venda**, **resolução** de linhas não encontradas/ambíguas (escolher o produto) e **remoção** de linhas. Quantidades e valores nunca são editados, então tudo pode ser recalculado do CSV.

## 2. Objetivo

O servidor passa a ser a única fonte de hash, quantidades, valores, totais de repasse, período e contagens. A tela envia o arquivo e as decisões do usuário.

Fora do escopo: guardar a prévia no servidor; mudar a regra de casamento por nome; mudar o `ResultadoImportacaoDto`.

## 3. Contrato da API

`POST /api/importacao-vendas/confirmar` passa a `multipart/form-data` (como a prévia):

| Campo | Tipo | Observação |
|---|---|---|
| `arquivo` | arquivo | o mesmo CSV da prévia; mesmas regras: obrigatório, `.csv`, até 10 MB |
| `dataVenda` | data | obrigatória, não futura (regra atual) |
| `resolucoes[i].nomeRelatorio` | string | nome exatamente como veio na prévia |
| `resolucoes[i].produtoId` | Guid | produto escolhido pelo usuário |
| `linhasRemovidas[i]` | string | `nomeRelatorio` de linha tirada na prévia (produto ou repasse) |

O nome do arquivo vem do próprio `IFormFile`. Resposta: `ApiResponse<ResultadoImportacaoDto>` (201), sem mudança.

As validações de arquivo (vazio, extensão, tamanho) hoje ficam inline em `Preview`. Passam a um helper privado do controller usado pelos dois endpoints — sem duplicação.

## 4. Backend

### 4.1 `AnalisadorRelatorioVendas` (novo, Application/ImportacaoVendas/Services)

Extrai do `ProcessarPreviewVendasCommandHandler` a lógica de análise, para a prévia e a confirmação usarem a mesma regra:

- `Analisar(byte[] csv, IReadOnlyList<Produto> produtosAtivos) → RelatorioAnalisado`
- Parseia via `IVendasParser` (erro de parse → `DomainException("Falha ao processar o arquivo CSV: ...")`; zero linhas → `DomainException` atual).
- Para cada linha: `ClassificadorLinhaVenda` → `Repasse`; senão casamento por `NormalizadorNome` → `Matched` / `Ambiguous` / `Unmatched`.
- `RelatorioAnalisado` expõe `Hash`, `PeriodoDe`, `PeriodoAte`, `Itens` (`ItemPreviewDto`).

É um serviço injetável (depende de `IVendasParser`), registrado na DI. O handler da prévia passa a: analisar → checar hash duplicado → montar `PreviewImportacaoDto` (contagens e somas como hoje).

### 4.2 `ConfirmarImportacaoCommand` (novo formato)

```
ConfirmarImportacaoCommand(
    byte[] CsvBytes,
    string NomeArquivo,
    DateTime DataVenda,
    IReadOnlyList<ResolucaoLinhaDto> Resolucoes,
    IReadOnlyList<string> LinhasRemovidas)

ResolucaoLinhaDto(string NomeRelatorio, Guid ProdutoId)
```

`ItemConfirmarDto` deixa de existir.

### 4.3 Handler de confirmação

1. Carrega produtos (`ListarAsync(apenasAtivos: false)`) e analisa o CSV com o `AnalisadorRelatorioVendas` (casando contra os ativos).
2. Hash recalculado já importado → `DomainException("Este arquivo já foi importado anteriormente.")`.
3. Valida as decisões contra o relatório analisado (comparação **exata** de `nomeRelatorio`); cada problema vira uma mensagem, todas juntas numa `DomainException` (422):
   - resolução ou remoção com nome que não existe no CSV;
   - resolução para linha `Matched` ou `Repasse` (só `Unmatched`/`Ambiguous` aceitam resolução);
   - resolução com produto inexistente ou inativo.
4. Aplica as decisões, linha a linha (nomes repetidos recebem a mesma decisão):
   - removida → fora de tudo;
   - `Repasse` → soma em taxa de serviço ou entregas (`ValorTotal` do CSV);
   - `Matched` → venda do produto casado pelo servidor;
   - `Unmatched`/`Ambiguous` com resolução → venda do produto resolvido;
   - `Unmatched`/`Ambiguous` sem resolução → conta como não encontrada.
   - Quantidade sempre a do CSV; linhas com quantidade ≤ 0 não geram venda (ficam fora, sem erro).
5. Nada a importar (zero vendas e zero repasse) → `DomainException("Nenhum item ou repasse confirmado para importação.")`.
6. Grava `VendaDiaria` e `ImportacaoVendas.Criar(...)` com período, contagens e totais calculados. Contagens: `totalLinhas` = linhas do CSV; `totalImportadas` = vendas criadas; `totalIgnoradas` = linhas removidas; `totalNaoEncontradas` = produtos sem resolução.
7. Snapshot de `ConfiguracaoRepasse` como hoje.

### 4.4 Validator

`CsvBytes` não vazio; `NomeArquivo` obrigatório; `DataVenda` (regra atual); `Resolucoes[i]`: `NomeRelatorio` e `ProdutoId` obrigatórios. Saem as regras de totais e de itens (o servidor calcula).

## 5. Frontend

- `importacaoVendasService.confirmar(arquivo, dataVenda, resolucoes, linhasRemovidas)` monta `FormData` com chaves indexadas (`resolucoes[0].nomeRelatorio`, `linhasRemovidas[0]`), igual ao padrão do `preview`.
- `ImportacaoVendasPage`: guarda os nomes removidos (hoje a remoção filtra `preview.itens`; passa a registrar também o `nomeRelatorio` removido) e envia `arquivoSelecionado` + resoluções + removidas.
- Tipos: `ConfirmarImportacaoInput` e `ItemConfirmar` são substituídos; `somarRepasses` continua só para exibição.
- O modal de resultado usa o `ResultadoImportacaoDto` devolvido.

## 6. Testes

- `AnalisadorRelatorioVendasTests`: os casos de classificação/casamento hoje em `ProcessarPreviewHandlerTests` migram para cá; o teste do handler da prévia fica com hash duplicado e montagem dos totais.
- `ConfirmarImportacaoCommandHandlerTests` (reescrito):
  - quantidades e totais de repasse vêm do CSV;
  - CSV já importado é bloqueado pelo hash recalculado;
  - linha removida (produto e repasse) fica fora de vendas e totais;
  - resolução válida gera venda do produto escolhido;
  - resolução para linha casada, nome desconhecido, produto inativo → `DomainException`;
  - CSV só com repasses importa sem vendas;
  - tudo removido → `DomainException`.
- `ConfirmarImportacaoCommandValidatorTests` reescrito para o novo comando.
- Frontend: `npx tsc -b --noEmit`.

## 7. Riscos

- **Arquivo diferente entre prévia e confirmação** (usuário troca o arquivo selecionado): o servidor confirma o que recebeu; resoluções/remoções que não existirem no novo CSV dão 422 — comportamento seguro.
- **Contrato quebra clientes antigos**: só existe o frontend do projeto, publicado junto.
