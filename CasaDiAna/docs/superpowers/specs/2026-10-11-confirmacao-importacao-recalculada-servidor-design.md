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
| `vinculos[i].nomeRelatorio` | string | nome exatamente como veio na prévia |
| `vinculos[i].produtoId` | Guid | produto em que a linha vira venda |
| `linhasRemovidas[i]` | string | `nomeRelatorio` de linha tirada na prévia (produto ou repasse) |

**Divisão de responsabilidade:** a tela decide *qual produto* recebe cada linha (casado na prévia, escolhido entre ambíguos ou criado na hora com "Adicionar", que pode ter outro nome); o servidor decide *quantidade, valor, repasses, hash, período e contagens*. Por isso a tela envia um vínculo para **toda** linha de produto que quer importar, inclusive as casadas automaticamente.

O nome do arquivo vem do próprio `IFormFile`. Resposta: `ApiResponse<ResultadoImportacaoDto>` (201), sem mudança.

As validações de arquivo (vazio, extensão, tamanho) hoje ficam inline em `Preview`. Passam a um helper privado do controller usado pelos dois endpoints — sem duplicação.

## 4. Backend

### 4.1 `LeitorRelatorioVendas` (novo, Application/ImportacaoVendas/Services)

Centraliza a leitura que a prévia e a confirmação compartilham:

- `Ler(byte[] csv) → RelatorioVendas(string Hash, string? PeriodoDe, string? PeriodoAte, IReadOnlyList<LinhaClassificada> Linhas)`
- `LinhaClassificada(LinhaRelatorio Linha, TipoRepasse? TipoRepasse)`
- Parseia via `IVendasParser` (erro de parse → `DomainException("Falha ao processar o arquivo CSV: ...")`; zero linhas → `DomainException("Nenhuma linha foi encontrada no CSV...")`, mensagens atuais) e classifica cada linha com `ClassificadorLinhaVenda`.

Serviço injetável (depende de `IVendasParser`), registrado na DI ao lado do parser. O handler da prévia passa a: ler → checar hash duplicado → casar as linhas sem repasse com produtos (lógica de casamento continua nele, é só da prévia) → montar `PreviewImportacaoDto` como hoje.

### 4.2 `ConfirmarImportacaoCommand` (novo formato)

```
ConfirmarImportacaoCommand(
    byte[] CsvBytes,
    string NomeArquivo,
    DateTime DataVenda,
    IReadOnlyList<VinculoLinhaDto> Vinculos,
    IReadOnlyList<string> LinhasRemovidas)

VinculoLinhaDto(string NomeRelatorio, Guid ProdutoId)
```

`ItemConfirmarDto` deixa de existir.

### 4.3 Handler de confirmação

1. Lê o CSV com o `LeitorRelatorioVendas`.
2. Hash recalculado já importado → `DomainException("Este arquivo já foi importado anteriormente.")`.
3. Valida as decisões contra o relatório (comparação **exata** de `nomeRelatorio`); cada problema vira uma mensagem, todas juntas numa `DomainException` (422):
   - vínculo ou remoção com nome que não existe no CSV;
   - vínculo para linha de repasse;
   - mesmo nome em vínculo e em remoção;
   - vínculo com produto inexistente ou inativo.
4. Aplica as decisões, linha a linha (nomes repetidos no CSV recebem a mesma decisão):
   - removida → fora de tudo;
   - repasse → soma em taxa de serviço ou entregas (`ValorTotal` do CSV);
   - produto com vínculo → `VendaDiaria` do produto vinculado com a quantidade do CSV (quantidade ≤ 0 não gera venda, sem erro);
   - produto sem vínculo → conta como não encontrada.
5. Nada a importar (zero vendas e zero repasse) → `DomainException("Nenhum item ou repasse confirmado para importação.")`.
6. Grava as vendas e `ImportacaoVendas.Criar(...)` com período e totais do CSV. Contagens: `totalLinhas` = linhas do CSV; `totalImportadas` = vendas criadas; `totalIgnoradas` = linhas removidas; `totalNaoEncontradas` = linhas de produto sem vínculo e não removidas.
7. Snapshot de `ConfiguracaoRepasse` como hoje.

### 4.4 Validator

`CsvBytes` não vazio; `NomeArquivo` obrigatório; `DataVenda` (regra atual); cada vínculo com `NomeRelatorio` e `ProdutoId` preenchidos. Saem as regras de totais e de itens (o servidor calcula).

## 5. Frontend

- `importacaoVendasService.confirmar({ arquivo, dataVenda, vinculos, linhasRemovidas })` monta `FormData` com chaves indexadas (`vinculos[0].nomeRelatorio`, `linhasRemovidas[0]`), no padrão do `preview`.
- `ImportacaoVendasPage`:
  - vínculos = linhas `matched` (`produtoId`) + `ambiguous` com resolução escolhida;
  - guarda os nomes removidos (remoção individual e em lote) num estado próprio, zerado em `reiniciar`;
  - envia `arquivoSelecionado` + vínculos + removidas.
- Tipos: `ConfirmarImportacaoInput` passa ao novo formato e `ItemConfirmar` vira `VinculoLinha`; `somarRepasses` continua só para exibição.
- O modal de resultado usa o `ResultadoImportacaoDto` devolvido.

## 6. Testes

- `LeitorRelatorioVendasTests`: erro de parse, CSV sem linhas, classificação de repasse por linha, hash e período repassados. `ProcessarPreviewHandlerTests` passa a usar o leitor real sobre um parser mockado e mantém seus casos.
- `ConfirmarImportacaoCommandHandlerTests` (reescrito):
  - quantidades e totais de repasse vêm do CSV;
  - CSV já importado é bloqueado pelo hash recalculado;
  - linha removida (produto e repasse) fica fora de vendas e totais;
  - vínculo gera venda do produto vinculado com a quantidade do CSV;
  - linha de produto sem vínculo conta como não encontrada;
  - vínculo para repasse, nome desconhecido, nome vinculado e removido, produto inativo → `DomainException`;
  - CSV só com repasses importa sem vendas;
  - tudo removido → `DomainException`.
- `ConfirmarImportacaoCommandValidatorTests` reescrito para o novo comando.
- Frontend: `npx tsc -b --noEmit`.

## 7. Riscos

- **Arquivo diferente entre prévia e confirmação** (usuário troca o arquivo selecionado): o servidor confirma o que recebeu; vínculos/remoções que não existirem no novo CSV dão 422 — comportamento seguro.
- **Contrato quebra clientes antigos**: só existe o frontend do projeto, publicado junto.
