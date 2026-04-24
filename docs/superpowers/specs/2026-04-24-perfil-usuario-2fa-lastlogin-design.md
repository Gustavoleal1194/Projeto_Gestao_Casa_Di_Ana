# Design: Perfil do Usuário — Status 2FA + Último Login

**Data:** 2026-04-24
**Escopo:** Melhorias de UX no sistema 2FA TOTP + rastreamento de último login para base SaaS premium

---

## Objetivo

1. `MinhaContaPage` — conhecer o status real de 2FA do usuário logado e exibir UI adequada (ativar ou reconfigurar), além de dados de último acesso
2. `UsuariosPage` — exibir coluna "Último Login" e tooltip educativo no badge "2FA Inativo"
3. Plantar campos de auditoria de login (`ip`, `user_agent`, `total_logins`) como fundação SaaS

---

## Backend

### 1. Entidade `Usuario` — novos campos

```csharp
public DateTime? UltimoLogin       { get; private set; }
public string?  IpUltimoLogin      { get; private set; }
public string?  UserAgentUltimoLogin { get; private set; }
public int      TotalLogins        { get; private set; }

public void RegistrarLogin(string? ip, string? userAgent)
{
    UltimoLogin          = DateTime.UtcNow;
    IpUltimoLogin        = ip;
    UserAgentUltimoLogin = userAgent;
    TotalLogins++;
    AtualizadoEm         = DateTime.UtcNow;
}
```

### 2. `UsuarioConfiguration` — novas colunas mapeadas

| Propriedade            | Coluna                    | Tipo           |
|------------------------|---------------------------|----------------|
| `UltimoLogin`          | `ultimo_login`            | timestamptz?   |
| `IpUltimoLogin`        | `ip_ultimo_login`         | varchar(45)?   |
| `UserAgentUltimoLogin` | `user_agent_ultimo_login` | varchar(512)?  |
| `TotalLogins`          | `total_logins`            | int, default 0 |

### 3. Migration `AdicionarCamposLoginUsuario`

- `ADD COLUMN ultimo_login timestamptz NULL`
- `ADD COLUMN ip_ultimo_login varchar(45) NULL`
- `ADD COLUMN user_agent_ultimo_login varchar(512) NULL`
- `ADD COLUMN total_logins int NOT NULL DEFAULT 0`

### 4. `LoginCommand` — adicionar campos de contexto HTTP

Estender o record para incluir campos opcionais que o Controller popula antes de despachar:

```csharp
public record LoginCommand(string Email, string Senha, string? Ip, string? UserAgent)
    : IRequest<LoginResultDto>;
```

O `AuthController` extrai esses valores de `HttpContext.Connection.RemoteIpAddress` e `Request.Headers["User-Agent"]` e os passa no command — a camada Application permanece sem dependência de HTTP.

### 4b. `LoginCommandHandler` — registrar login

Após validar credenciais (e antes de retornar o token), chamar `usuario.RegistrarLogin(request.Ip, request.UserAgent)`. Persistir via `_usuarios.SalvarAsync(cancellationToken)`.

### 5. Novo DTO `MeuPerfilDto`

```csharp
public record MeuPerfilDto(
    string   Nome,
    string   Email,
    string   Papel,
    bool     TwoFactorHabilitado,
    DateTime? UltimoLogin,
    string?  IpUltimoLogin,
    string?  UserAgentUltimoLogin,
    int      TotalLogins);
```

### 6. Nova Query `ObterMeuPerfil`

Localização: `src/CasaDiAna.Application/Usuarios/Queries/ObterMeuPerfil/`

- `ObterMeuPerfilQuery(Guid UsuarioId) : IRequest<MeuPerfilDto>`
- `ObterMeuPerfilQueryHandler` busca usuário por ID via `IUsuarioRepository`, mapeia para `MeuPerfilDto`
- Lança `DomainException("Usuário não encontrado.")` se null

`MeuPerfilDto` fica em `src/CasaDiAna.Application/Usuarios/Dtos/MeuPerfilDto.cs`.

### 7. `UsuarioDto` — adicionar `UltimoLogin`

```csharp
public record UsuarioDto(
    Guid     Id,
    string   Nome,
    string   Email,
    string   Papel,
    bool     Ativo,
    bool     TwoFactorHabilitado,
    DateTime? UltimoLogin);        // novo
```

### 8. Novo endpoint `GET /api/usuarios/me`

Adicionado em `UsuariosController` (junto com os demais endpoints de usuário):

```
[HttpGet("me")]
[Authorize]
[ProducesResponseType(typeof(ApiResponse<MeuPerfilDto>), 200)]
```

Extrai `UsuarioId` do claim `ClaimTypes.NameIdentifier`, despacha `ObterMeuPerfilQuery`.

---

## Frontend

### Componentes reutilizáveis novos

| Componente | Localização | Propósito |
|---|---|---|
| `<InfoRow>` | `components/ui/InfoRow.tsx` | Label + valor em linha, usado em Minha Conta |
| `<StatusBadge2Fa>` | `components/ui/StatusBadge2Fa.tsx` | Badge 2FA com ícone e tooltip — usado em Minha Conta e UsuariosPage |
| `<RelativeTime>` | `components/ui/RelativeTime.tsx` | Formata data como "há 3h", "há 2 dias", "Nunca" |

### `minhaContaService.ts` (novo)

```ts
// frontend/src/features/minha-conta/services/minhaContaService.ts
obterMeuPerfil(): Promise<MeuPerfilDto>
```

Separado do `authService` — responsabilidade única.

### `MinhaContaPage` — fluxo atualizado

**On mount:** `minhaContaService.obterMeuPerfil()` → skeleton enquanto carrega.

**Seção "Dados da Conta"** (usa `<InfoRow>`):
- Nome, Papel
- Último login (`<RelativeTime>`)
- Dispositivo (user agent simplificado: "Chrome · Windows")
- Total de acessos

**Seção "Autenticação em Dois Fatores"**:
- `twoFactorHabilitado = false` → botão "Ativar autenticação em dois fatores" (fluxo atual de 3 passos)
- `twoFactorHabilitado = true` → `<StatusBadge2Fa status="ativo" />` + botão "Reconfigurar" (reinicia o mesmo fluxo de 3 passos; o backend já suporta — `ConfirmarSetup2Fa` deleta codes antigos)

Ao concluir o fluxo de setup/reconfiguração, re-fetch de `obterMeuPerfil()` para atualizar a UI sem recarregar.

### `UsuariosPage` — mudanças

- Nova coluna **"Último Login"** usando `<RelativeTime>` — inserida antes da coluna "Ações"
- Badge "2FA Inativo" substituído por `<StatusBadge2Fa status="inativo" />` — o componente já carrega o `title` de tooltip e o cursor `help`
- Badge "2FA Ativo" substituído por `<StatusBadge2Fa status="ativo" />`

### `<StatusBadge2Fa>` — spec do componente

```tsx
interface Props {
  status: 'ativo' | 'inativo'
}
```

- `ativo` → ícone escudo + texto "Ativo" + cor verde (classe `badge-active`)
- `inativo` → ícone escudo-exclamação + texto "Inativo" + cor cinza (classe `badge-inactive`) + `title="O usuário deve ativar em Minha Conta"` + `cursor: help`

### `<RelativeTime>` — spec do componente

```tsx
interface Props {
  date: string | Date | null | undefined
  fallback?: string  // default: "Nunca"
}
```

Faixas:
- < 1 min → "agora mesmo"
- < 60 min → "há X min"
- < 24h → "há Xh"
- < 7 dias → "há X dias"
- ≥ 7 dias → data formatada "dd/mm/aaaa"
- null/undefined → `fallback`

---

## Critérios de Conclusão

- [ ] Backend compila sem warnings
- [ ] Migration aplicada com sucesso
- [ ] `GET /api/usuarios/me` retorna perfil com todos os campos
- [ ] Login registra `ultimo_login`, `ip_ultimo_login`, `user_agent_ultimo_login`, `total_logins`
- [ ] `GET /api/usuarios` retorna `ultimoLogin` em cada item
- [ ] `MinhaContaPage` exibe status correto de 2FA (ativo ou inativo) após carregar
- [ ] Fluxo "Reconfigurar" funciona end-to-end
- [ ] `UsuariosPage` exibe coluna "Último Login"
- [ ] Tooltip no badge "2FA Inativo" aparece ao hover
- [ ] Componentes `<InfoRow>`, `<StatusBadge2Fa>`, `<RelativeTime>` são reutilizáveis e tipados
- [ ] TypeScript sem erros (`npx tsc --noEmit`)
- [ ] Testes unitários dos novos handlers passando
