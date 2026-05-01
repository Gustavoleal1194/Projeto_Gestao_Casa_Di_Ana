---
name: ACADEMICO_TCC_OVERVIEW
description: Visão geral acadêmica do projeto (TCC / monografia)
type: academico
status: a_confirmar
ultima_atualizacao: 2026-04-30
---

# 🎓 Visão acadêmica — Casa di Ana ERP

> Este nó é uma **âncora** para o material acadêmico. Marcado como **a_confirmar** porque o projeto não declara explicitamente um TCC; mas como existe um sistema completo, presume-se que possa ser usado como trabalho acadêmico.

## Possíveis ângulos para texto acadêmico

- **Arquitetura:** Clean Architecture + CQRS aplicado a um ERP de pequeno porte. Trade-offs vs. CRUD tradicional.
- **Domain-Driven:** decisões de encapsulamento (`private readonly List<T>`), uso de DomainException, métodos de domínio (`Ingrediente.AtualizarEstoque`).
- **Persistência:** PostgreSQL + EF Core 8 com snake_case explícito; migrações automáticas em boot.
- **Segurança:** JWT + 2FA TOTP + rate limiting + headers; senha BCrypt; recovery codes.
- **UX para usuários de baixa proficiência:** modais animados de confirmação, tokens de tema, componentes obrigatórios.
- **Operação real:** integração com a cafeteria, relatórios em PDF, etiquetas ANVISA.
- **DevOps:** Docker multi-stage, deploy em Render, build no plano free, CORS configurável.

## Conexões com o brain

- [[ARQUITETURA]] · [[PERSISTENCIA_E_BANCO]] · [[STACK_TECNICA]]
- [[REGRAS_BACKEND_CRITICAS]] (capítulo de "armadilhas e padrões")
- [[DEC_*]] (capítulo de "decisões técnicas justificadas")
- [[ERROS_RESOLVIDOS]] (capítulo de "lições aprendidas")
- [[STATUS_SNAPSHOT]] (estado de implementação à data da defesa)

## Próximos passos

- Confirmar com Gustavo se há orientador / banca / cronograma. Se sim, [[OPEN_LOOP_TCC_CRONOGRAMA]] e criar notas dedicadas (introdução, fundamentação, metodologia, resultados, conclusão).
