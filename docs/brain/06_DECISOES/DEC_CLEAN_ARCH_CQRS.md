---
name: DEC_CLEAN_ARCH_CQRS
description: Backend em Clean Architecture com CQRS via MediatR
type: decisao
status: existente
ultima_atualizacao: 2026-04-30
data_decisao: 2026-03-25
---

# Decisão: Clean Architecture + CQRS

**Decisão:** organizar o backend em quatro projetos (`Domain`, `Application`, `Infrastructure`, `API`) com dependências unidirecionais, e usar MediatR para CQRS leve (Commands e Queries com handlers).

**Why:**
- Domain isolável e testável.
- Validação cross-cutting via pipeline (`ValidationBehavior<,>`).
- Possibilita evolução para multi-unidade ou multi-cliente sem reescrever regras.

**Trade-offs:**
- Mais camadas e ceremônia que um CRUD tradicional.
- Curva inicial maior para quem nunca viu MediatR.

**Onde aplica:** [[ARQUITETURA]], todos os módulos backend.

**Status:** **existente** — todos os 18 controllers já seguem.
