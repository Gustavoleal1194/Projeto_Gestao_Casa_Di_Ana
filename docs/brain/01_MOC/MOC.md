---
name: MOC – Map of Content
description: Índice vivo do BrainOS. Navegação principal por área.
type: moc
status: existente
ultima_atualizacao: 2026-04-30
---

# 🗺️ MOC – Casa di Ana ERP

> Índice vivo. Atualize sempre que criar/renomear notas relevantes.

---

## 📚 Memória profunda do projeto

- [[PROJECT_MEMORY]] — visão geral, propósito, escopo
- [[ARQUITETURA]] — Clean Architecture + CQRS + frontend feature-based
- [[MAPA_DO_PROJETO]] — árvore de pastas comentada
- [[PERSISTENCIA_E_BANCO]] — schemas, entidades, migrations
- [[STACK_TECNICA]] — versões e responsabilidades das libs

---

## 📦 Módulos detectados ([[MOC_MODULOS]])

### Auth & Usuários
- [[MOD_AUTH_LOGIN_2FA]] · [[MOD_USUARIOS]] · [[MOD_MINHA_CONTA]]

### Estoque
- [[MOD_INGREDIENTES]] · [[MOD_CATEGORIAS_INGREDIENTE]] · [[MOD_UNIDADES_MEDIDA]]
- [[MOD_FORNECEDORES]] · [[MOD_ENTRADAS]] · [[MOD_INVENTARIOS]]
- [[MOD_CORRECAO_ESTOQUE]] · [[MOD_NOTIFICACOES_ESTOQUE]]

### Produção
- [[MOD_PRODUTOS_FICHA_TECNICA]] · [[MOD_CATEGORIAS_PRODUTO]]
- [[MOD_PRODUCAO_DIARIA]] · [[MOD_VENDAS_DIARIAS]] · [[MOD_PERDAS]]
- [[MOD_IMPORTACAO_VENDAS]]

### Etiquetas
- [[MOD_ETIQUETAS]]

### Relatórios & Dashboard
- [[MOD_RELATORIOS]] · [[MOD_DASHBOARD]]

---

## ⚖️ Regras de negócio

- [[REGRAS_BACKEND_CRITICAS]] — armadilhas e regras que sustentam a integridade
- [[REGRA_MOVIMENTACAO_RASTREAVEL]] — toda alteração de estoque exige Movimentação
- [[REGRA_ENTRADA_ATUALIZA_CUSTO]] — entrada chama AtualizarEstoque + AtualizarCusto
- [[REGRA_SOFT_DELETE_NOMEEXISTE]] — NomeExisteAsync filtra ativo=true
- [[REGRA_FILTROS_DATA_EXCLUSIVO]] — `< ate.Date.AddDays(1)`
- [[REGRA_ESTOQUE_PODE_FICAR_NEGATIVO_OU_CLAMP]] — estado atual a confirmar
- [[REGRA_2FA_TOTP_FORMATO]] — validator aceita apenas `^\d{6}$`
- [[REGRA_PAPEIS_USUARIO]] — papéis e permissões

---

## 🧭 Decisões técnicas

- [[DEC_CLEAN_ARCH_CQRS]] · [[DEC_VALIDATIONBEHAVIOR_PIPELINE]]
- [[DEC_API_RESPONSE_ENVELOPE]] · [[DEC_EF_SNAKE_CASE_EXPLICITO]]
- [[DEC_SOFT_DELETE]] · [[DEC_TOTP_SEM_SMS]]
- [[DEC_TAILWIND_TOKENS_CSS_VARS]] · [[DEC_FEATURES_FRONTEND]]
- [[DEC_ESTOQUE_ZERAR_NEGATIVO]]

---

## 📊 Status & operação

- [[STATUS_SNAPSHOT]] — estado atual detectado (2026-04-30)
- [[TASK_LOG]] — histórico de tasks relevantes
- [[OPEN_LOOPS]] — dúvidas e pendências
- [[APRENDIZADOS]] · [[ERROS_RESOLVIDOS]]

---

## 🧰 Context packs (uso rápido por agentes)

- [[CONTEXT_PACK_BACKEND]]
- [[CONTEXT_PACK_FRONTEND]]
- [[CONTEXT_PACK_ESTOQUE]]
- [[CONTEXT_PACK_PRODUCAO]]
- [[CONTEXT_PACK_AUTH_2FA]]
- [[CONTEXT_PACK_RELATORIOS]]
- [[CONTEXT_PACK_ETIQUETAS]]
- [[CONTEXT_PACK_FORMULARIOS_FRONTEND]]
- [[CONTEXT_PACK_BANCO_DE_DADOS]]
- [[CONTEXT_PACK_DEPLOY_RENDER]]

---

## 🤖 IA / Prompts reutilizáveis

- [[PROMPT_CONSULTAR_BRAIN]] · [[PROMPT_PLANEJAR_FEATURE]] · [[PROMPT_EXECUTAR_TASK]]
- [[PROMPT_ATUALIZAR_BRAIN]] · [[PROMPT_REGISTRAR_DECISAO]] · [[PROMPT_REGISTRAR_REGRA]]
- [[PROMPT_REGISTRAR_ERRO]] · [[PROMPT_TRIAR_INBOX]] · [[PROMPT_REVISAR_CONSISTENCIA]]
- [[PROMPT_AGENTE_EXECUTOR_NEUTRO]]

---

## 🧪 Templates

- [[TEMPLATE_MODULO]] · [[TEMPLATE_DECISAO]] · [[TEMPLATE_REGRA]]
- [[TEMPLATE_CONTEXT_PACK]] · [[TEMPLATE_TASK_LOG]] · [[TEMPLATE_OPEN_LOOP]]
- [[TEMPLATE_ERRO_RESOLVIDO]] · [[TEMPLATE_APRENDIZADO]] · [[TEMPLATE_PROMPT_VALIDADO]]
- [[TEMPLATE_NOTA_ACADEMICA]] · [[TEMPLATE_STATUS_SNAPSHOT]] · [[TEMPLATE_IDEIA_BRUTA]]

---

## 🎓 Acadêmico

- [[ACADEMICO_TCC_OVERVIEW]] — visão TCC/monografia (a_confirmar)
