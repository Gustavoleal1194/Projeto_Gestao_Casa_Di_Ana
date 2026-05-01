---
name: PROMPT_REGISTRAR_DECISAO
description: Registrar uma decisão técnica em 06_DECISOES/
type: prompt
status: existente
---

# Prompt: registrar decisão técnica

```
Crie uma nota em `docs/brain/06_DECISOES/DEC_<slug>.md` baseada em [[TEMPLATE_DECISAO]].

Conteúdo mínimo:
- Decisão (uma frase clara)
- **Why:** motivações concretas (incluindo trade-offs descartados)
- **How to apply:** quando/como a decisão se aplica
- Onde aplica (módulos)
- Status (`existente` / `em_andamento` / `planejado`)
- Data da decisão
- Evidências (caminhos de arquivo, plans, commits)

Atualize o índice [[MOC]] na seção "Decisões técnicas".

DECISÃO:
{{contexto da decisão}}
```
