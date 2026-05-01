---
name: STACK_TECNICA – versões e papéis das libs
description: Inventário do stack atual com versão e responsabilidade
type: project_memory
status: existente
ultima_atualizacao: 2026-04-30
fontes:
  - CasaDiAna/frontend/package.json
  - CasaDiAna/README.md
---

# ⚙️ Stack técnica

## Backend

| Lib                                              | Versão     | Papel                                       |
| ------------------------------------------------ | ---------- | ------------------------------------------- |
| ASP.NET Core                                     | 8.0        | framework web                               |
| C#                                               | 13         | linguagem                                   |
| MediatR                                          | 12.4.1     | CQRS / dispatch de Command + Query          |
| FluentValidation                                 | 11.x       | validação de Commands                       |
| Entity Framework Core                            | 8.0.11     | ORM                                         |
| Npgsql                                           | 8.0.11     | driver PostgreSQL                           |
| BCrypt.Net-Next                                  | 4.0.3      | hash de senhas                              |
| Microsoft.AspNetCore.Authentication.JwtBearer    | 8.0.11     | autenticação JWT                            |
| Swashbuckle.AspNetCore                           | 6.9.0      | Swagger / OpenAPI                           |
| Mapster                                          | 7.4.0      | mapeamento de objetos                       |

## Frontend (`CasaDiAna/frontend/package.json`, em 2026-04-30)

| Lib                                | Versão       | Papel                                    |
| ---------------------------------- | ------------ | ---------------------------------------- |
| react                              | ^19.2.4      | runtime UI (atualizado de 18 → 19)       |
| react-dom                          | ^19.2.4      |                                          |
| typescript                         | ~5.9.3       | tipagem                                  |
| vite                               | ^8.0.1       | build / dev server                       |
| @tailwindcss/vite + tailwindcss    | ^4.2.2       | estilização (CSS vars `--ada-*`)         |
| react-router-dom                   | ^7.13.2      | roteamento SPA                           |
| zustand                            | ^5.0.12      | estado global (apenas auth)              |
| axios                              | ^1.13.6      | HTTP                                     |
| react-hook-form                    | ^7.72.0      | formulários                              |
| @hookform/resolvers                | ^5.2.2       | resolvers RHF                            |
| zod                                | ^4.3.6       | validação de schema                      |
| @heroicons/react                   | ^2.2.0       | ícones                                   |
| framer-motion                      | ^12.38.0     | animações                                |
| cobe                               | ^0.6.5       | globo 3D login                           |
| qrcode                             | ^1.5.4       | QR para 2FA                              |
| echarts + echarts-for-react        | ^6.0.0 / 3.x | gráficos avançados (Dashboard)           |
| jspdf + jspdf-autotable            | ^4.2.1 / 5.x | exportação PDF / etiquetas               |

> ⚠️ A documentação `README.md` ainda menciona React 18 e `recharts`. O código atual usa **React 19** e **ECharts**. Ver [[OPEN_LOOPS]] (conflito doc ↔ código).

## Testes (backend)

| Lib                | Versão  | Papel                       |
| ------------------ | ------- | --------------------------- |
| xUnit              | 2.5.3   | framework de testes         |
| Moq                | 4.20.72 | mocking                     |
| FluentAssertions   | 6.12.2  | assertions legíveis         |

## Infra

| Item             | Uso                                              |
| ---------------- | ------------------------------------------------ |
| PostgreSQL 15    | banco                                            |
| Docker multi-stage| containerização back + front                    |
| Nginx (alpine)   | servir SPA em produção                           |
| Render.com       | hosting (API + Frontend + Database, plano free)  |

## Variáveis de ambiente principais

Backend (obrigatórias / opcionais):
- `Jwt__Chave` (obrigatória, mín. 32 chars)
- `Jwt__Emissor` (default `CasaDiAna`)
- `Jwt__ExpiracaoMinutos` (default 60)
- `DATABASE_URL` (prod) / `ConnectionStrings__Default` (dev)
- `CorsOrigins` (default `http://localhost:5173`, separado por vírgula)
- `Swagger__Habilitado` (default por ambiente)

Frontend:
- `VITE_API_URL` — injetada **em build-time** pelo Vite via `frontend/.env.production`.
