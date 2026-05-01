---
name: MOC – Módulos
description: Índice de todas as features/módulos detectados no projeto
type: moc
status: existente
ultima_atualizacao: 2026-04-30
---

# 📦 MOC – Módulos

| Módulo                                | Status        | Camada(s)     | Nota                                |
| ------------------------------------- | ------------- | ------------- | ----------------------------------- |
| Login + 2FA TOTP                      | existente     | back + front  | [[MOD_AUTH_LOGIN_2FA]]              |
| Usuários                              | existente     | back + front  | [[MOD_USUARIOS]]                    |
| Minha Conta (perfil + 2FA + lastlogin) | existente     | front         | [[MOD_MINHA_CONTA]]                 |
| Categorias de Ingrediente             | existente     | back + front  | [[MOD_CATEGORIAS_INGREDIENTE]]      |
| Categorias de Produto                 | existente     | back + front  | [[MOD_CATEGORIAS_PRODUTO]]          |
| Unidades de Medida                    | existente     | back + front  | [[MOD_UNIDADES_MEDIDA]]             |
| Ingredientes                          | existente     | back + front  | [[MOD_INGREDIENTES]]                |
| Fornecedores                          | existente     | back + front  | [[MOD_FORNECEDORES]]                |
| Entrada de Mercadoria                 | existente     | back + front  | [[MOD_ENTRADAS]]                    |
| Inventário Físico                     | existente     | back + front  | [[MOD_INVENTARIOS]]                 |
| Correção de Estoque                   | existente     | back + front  | [[MOD_CORRECAO_ESTOQUE]]            |
| Notificações de Estoque               | existente     | back + front  | [[MOD_NOTIFICACOES_ESTOQUE]]        |
| Produtos + Ficha Técnica              | existente     | back + front  | [[MOD_PRODUTOS_FICHA_TECNICA]]      |
| Produção Diária                       | existente     | back + front  | [[MOD_PRODUCAO_DIARIA]]             |
| Vendas Diárias                        | existente     | back + front  | [[MOD_VENDAS_DIARIAS]]              |
| Perdas de Produto                     | existente     | back + front  | [[MOD_PERDAS]]                      |
| Importação de Vendas (CSV/PDF)        | existente     | back + front  | [[MOD_IMPORTACAO_VENDAS]]           |
| Etiquetas (Completa, Simples, Nutricional) | existente | back + front  | [[MOD_ETIQUETAS]]                   |
| Relatórios + Exportação PDF           | existente     | back + front  | [[MOD_RELATORIOS]]                  |
| Dashboard / KPIs                      | existente     | front         | [[MOD_DASHBOARD]]                   |
| Comparação de preços de ingredientes  | planejado     | —             | ver `docs/superpowers/plans/2026-04-25-comparacao-precos-ingredientes.md` |
| Modal de confirmação animado em todos os formulários | em_andamento | front | ver `docs/superpowers/plans/2026-04-29-modal-confirmacao-todos-formularios.md` |
| Refactor formulários ERP              | a_confirmar   | front         | plan existente em `docs/superpowers/plans/2026-04-05-refactor-formularios-erp.md` |

> Para detalhes de cada módulo: status, evidências, fluxo, regras, módulos relacionados e o que **não fazer**, abrir a nota correspondente em `04_MODULOS/`.
