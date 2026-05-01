---
name: DEC_VALIDATIONBEHAVIOR_PIPELINE
description: ValidationBehavior<,> roda FluentValidation no pipeline MediatR antes de cada handler
type: decisao
status: existente
ultima_atualizacao: 2026-04-30
---

# Decisão: validação via pipeline MediatR

**Decisão:** registrar `ValidationBehavior<,>` como `IPipelineBehavior` no MediatR (`Program.cs:33-39`) e deixar todos os validators serem descobertos via `AddValidatorsFromAssembly` (`Program.cs:38`).

**Why:** garante que **nenhum handler executa sem validação**. Erros geram `ValidationException` mapeada para HTTP 400 no middleware.

**How to apply:**
- Validator de cada Command implementa `AbstractValidator<TCommand>`.
- `SuppressModelStateInvalidFilter = true` evita validação dupla pelo MVC.

**Onde aplica:** todos os módulos.

**Evidências:** `CasaDiAna/src/CasaDiAna.API/Program.cs:27-73`, `Application/Common/ValidationBehavior.cs`.
