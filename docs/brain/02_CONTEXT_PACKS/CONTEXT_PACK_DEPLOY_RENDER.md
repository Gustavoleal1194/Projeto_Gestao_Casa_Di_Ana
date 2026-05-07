---
name: CONTEXT_PACK_DEPLOY_RENDER
description: Pack para deploys/ajustes em Render (back + front + db) e Docker local
type: context_pack
status: existente
ultima_atualizacao: 2026-05-07
---

# 🧰 Context pack — Deploy (Render + Docker)

## Quando usar
Mexer em `Dockerfile`, `docker-compose.yml`, `render.yaml`, env vars, CORS, build de produção.

## Status resumido
- Hospedagem: Render.com (plano free; build sem cache leva 10–18 min).
- API porta 5130 local · 8080 Docker.
- Frontend porta 5173 local · 3000 Docker (Nginx alpine).
- `DATABASE_URL` em produção (Render); fallback de porta = 5432.
- `VITE_API_URL` é build-time — alterar exige rebuild do frontend.
- `Swagger:Habilitado` controla swagger em produção.

## Variáveis principais
**Backend:**
- `Jwt__Chave` (obrigatória, ≥32 chars)
- `Jwt__Emissor` (default `CasaDiAna`)
- `Jwt__ExpiracaoMinutos` (default 60)
- `DATABASE_URL` (prod) / `ConnectionStrings__Default` (dev)
- `CorsOrigins` (default `http://localhost:5173`, vírgula separa origens)
- `Swagger__Habilitado`

**Frontend:**
- `VITE_API_URL` (build-time, em `frontend/.env.production`)

## Regras críticas

### Docker TypeScript é o compilador autoritativo
O `tsc --noEmit` local pode passar com 0 erros enquanto o build Docker falha. Isso acontece por diferença de cache de `@types` e configurações de strictness. **Nunca declarar vitória com base só no `tsc` local.** Erros típicos que só aparecem no Docker:
- **TS2345:** `handleSubmit(namedFn)` sem `as any` quando `resolver` usa `as any`.
- **TS2322:** `number | undefined` não atribuível a `number` no payload (usar `values.campo!`).
- **TS6133:** parâmetro declarado mas não usado após refactor.
- **Zod 4 (TS):** `required_error`/`invalid_type_error` não existem em Zod 4 — usar `.positive('msg')`, `.min(0, 'msg')`.

Ver aprendizados A9, A10, A11 em [[APRENDIZADOS]] e erros E8, E9, E10 em [[ERROS_RESOLVIDOS]].

### Outras
- Nunca commitar `.env*` com URL/credencial real.
- Não desativar headers de segurança (`X-Content-Type-Options`, `X-Frame-Options`, etc. em `Program.cs:184-191`).
- Rate limit `login`/`reenvio2fa` é parte da segurança — não relaxar sem registrar [[DEC]].
- Build no Render free sem cache: **10–18 min**. Migrations rodam no startup via `db.Database.Migrate()`.

## Arquivos / docs de referência
- `CasaDiAna/Dockerfile` · `CasaDiAna/docker-compose.yml` · `CasaDiAna/render.yaml`
- `CasaDiAna/frontend/Dockerfile` · `CasaDiAna/frontend/nginx.conf`
- `API/Program.cs` (CORS, security headers, rate limit)

## Prompt curto
> "Task em deploy do Casa di Ana ERP (Render + Docker). API:5130 local, frontend:5173 local. Build no Render free leva 10–18 min sem cache. `VITE_API_URL` é build-time. CORS configurável via `CorsOrigins`. Sem alterar headers de segurança."
