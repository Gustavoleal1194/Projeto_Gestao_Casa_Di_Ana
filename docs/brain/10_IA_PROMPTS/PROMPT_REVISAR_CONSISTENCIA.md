---
name: PROMPT_REVISAR_CONSISTENCIA
description: Comparar brain ↔ código e listar divergências
type: prompt
status: existente
---

# Prompt: revisar consistência brain ↔ código

```
Faça um diff conceitual entre o BrainOS (`docs/brain/`) e o código atual:

1. Para cada nota em `04_MODULOS/MOD_*.md`, valide:
   - Existem os arquivos citados?
   - O status declarado bate com o código?
   - Os pontos de atenção continuam pertinentes?

2. Para cada regra em `05_REGRAS_NEGOCIO/`, valide:
   - Existe no código? (se não, marcar como `a_confirmar` ou remover)

3. Para `STATUS_SNAPSHOT`, atualizar com:
   - Versões reais dos pacotes (`package.json`, `*.csproj`)
   - Status real dos plans em `docs/superpowers/plans/`

4. Liste divergências em [[OPEN_LOOPS]].

NÃO altere código. Apenas o brain.
```
