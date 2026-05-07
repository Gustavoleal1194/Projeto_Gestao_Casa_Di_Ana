---
name: ERROS_RESOLVIDOS – erros já solucionados
description: Bug → causa → cura, para evitar repetição
type: erros_resolvidos
status: existente
ultima_atualizacao: 2026-05-07
---

# 🐛 Erros Resolvidos

> Use [[TEMPLATE_ERRO_RESOLVIDO]] para novas entradas.
> Inclua causa raiz, sintoma, cura e como evitar.

## E1 — `DbUpdateConcurrencyException` ao adicionar filhos via parent
- **Sintoma:** salvar entrada/inventário/ficha técnica nova após `Adicionar*` joga `DbUpdateConcurrencyException`.
- **Causa raiz:** EF não rastreia `private readonly List<T>` materializada como backing field, o `_db.Update(parent)` não vê novos filhos.
- **Cura:** inserir o filho diretamente pelo repositório/`DbSet<TFilho>`.
- **Como evitar:** ver [[REGRA_COLECAO_READONLY_DBUPDATE]] e [[A1]] em [[APRENDIZADOS]].

## E2 — Latência alta no caminho de erro do TOTP
- **Sintoma:** falha em verificar 2FA demorava ~200 ms.
- **Causa raiz:** handler do TOTP estava verificando recovery code via BCrypt no mesmo fluxo.
- **Cura:** mover recovery code para endpoint dedicado; manter validator do TOTP em `^\d{6}$`.
- **Como evitar:** ver [[REGRA_2FA_TOTP_FORMATO]] e [[REGRA_BCRYPT_RECOVERY_FORA_HANDLER_TOTP]].

## E3 — `CurrentUserService` retornava `null` para o ID do usuário
- **Sintoma:** auditoria gravava `criado_por` vazio.
- **Causa raiz:** leitura por `JwtRegisteredClaimNames.Sub`. ASP.NET remapeia `sub` para `ClaimTypes.NameIdentifier`.
- **Cura:** usar `User.FindFirstValue(ClaimTypes.NameIdentifier)`.

## E4 — Filtros de data perdiam o último dia
- **Sintoma:** relatório com filtro `ate = hoje` retornava 0 itens criados após 00:00 de hoje.
- **Causa raiz:** `criadoEm <= ate` interpretava `ate` como `00:00:00`.
- **Cura:** `criadoEm < ate.Date.AddDays(1)` (exclusivo).
- **Como evitar:** ver [[REGRA_FILTROS_DATA_EXCLUSIVO]].

## E5 — Ficha técnica retornando custo zero
- **Sintoma:** após uma entrada de mercadoria, custo de produção continuava zero.
- **Causa raiz:** handler chamava só `AtualizarEstoque`, esquecia `AtualizarCusto`.
- **Cura:** sempre chamar ambos.
- **Como evitar:** ver [[REGRA_ENTRADA_ATUALIZA_CUSTO]].

## E7 — `ref` em `CampoTexto` quebra build Docker (TypeScript TS2322)
- **Sintoma:** build no Render falha com `Property 'ref' does not exist on type 'IntrinsicAttributes & Props'` em `FornecedorFormPage.tsx`.
- **Causa raiz:** `CampoTexto` é função pura — não usa `React.forwardRef`. Passar `ref={field.ref}` via `Controller` do RHF não é aceito pelo compilador no ambiente Docker (versão de `@types/react` mais estrita que o cache local).
- **Cura:** remover `ref={field.ref}` dos dois `Controller` renders em `FornecedorFormPage.tsx`. O `name={field.name}` pode ser mantido pois é prop normal de `InputHTMLAttributes`.
- **Como evitar:** antes de aplicar sugestão de reviewer que envolva `ref`, verificar se o componente alvo usa `forwardRef`. Em `components/form/`, **nenhum** componente usa `forwardRef` atualmente. Se precisar de ref, usar `forwardRef` no componente ou capturar via `useRef` na página.

## E6 — Modal de desativação exibia "Ingrediente" em todos os módulos
- **Sintoma:** ao clicar em desativar em Categorias, Fornecedores, Produtos ou Categorias de Produto, o modal mostrava "Desativar Ingrediente" e "O ingrediente não aparecerá…".
- **Causa raiz:** `ModalDesativar` foi criado com textos hardcoded e prop `nomeIngrediente` específicos para ingredientes, depois reutilizado em 4 outros módulos sem adaptação.
- **Cura:** prop `nomeIngrediente` renomeada para `nome`; adicionada prop `entidade?: string` (default `'ingrediente'`). Título gerado dinamicamente. Corpo usa texto genérico ("Este item não aparecerá…"). Todos os 5 callers atualizados com `entidade` correta.
- **Como evitar:** ao reutilizar componentes de confirmação entre módulos, sempre verificar se há texto hardcoded referenciando a entidade original. Componentes genéricos devem ter props de configuração de texto.
