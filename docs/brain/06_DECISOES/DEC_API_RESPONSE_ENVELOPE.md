---
name: DEC_API_RESPONSE_ENVELOPE
description: Toda resposta HTTP usa envelope ApiResponse<T> { sucesso, dados, erros }
type: decisao
status: existente
ultima_atualizacao: 2026-04-30
---

# Decisão: envelope `ApiResponse<T>`

**Decisão:** todas as respostas REST usam `ApiResponse<T>` com `{ sucesso, dados, erros }`. Erros são sempre array de strings traduzidas.

**Why:**
- Frontend tem um único padrão de tratamento (sucesso/falha + lista de erros).
- Mensagens em pt-BR já vêm prontas para exibição.
- Simplifica `axios` interceptor — só inspecionar `data.sucesso`.

**Mapeamento de exceções (em `ExceptionHandlingMiddleware`):**
| Exceção | HTTP |
| --- | --- |
| `ValidationException` | 400 |
| `UnauthorizedAccessException` | 401 |
| `DomainException` | 422 |
| `Exception` | 500 |

**Onde aplica:** API inteira.

**Evidências:** `Application/Common/ApiResponse.cs`, `API/Middleware/ExceptionHandlingMiddleware.cs`.
