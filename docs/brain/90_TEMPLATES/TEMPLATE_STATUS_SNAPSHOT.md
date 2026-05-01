---
name: TEMPLATE_STATUS_SNAPSHOT
description: Template para um snapshot novo em 07_STATUS/
type: template
---

```markdown
---
name: STATUS_SNAPSHOT – YYYY-MM-DD
description: <Estado atual detectado em data X>
type: status
status: existente
data_snapshot: YYYY-MM-DD
---

# 📊 Status snapshot — YYYY-MM-DD

## Stack detectada
- <versões reais por leitura de package.json/csproj>

## Áreas / status
| Área | Status | Notas |
| ---- | ------ | ----- |
| ... | existente / em_andamento / planejado / a_confirmar | ... |

## Em andamento
- ...

## Pontos a confirmar
- ...

## Riscos / conflitos
- ...
```
