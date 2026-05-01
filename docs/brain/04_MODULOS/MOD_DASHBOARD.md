---
name: MOD_DASHBOARD
description: Dashboard com KPIs, gráficos de produção vs vendas e consumo de insumos
type: modulo
status: existente
ultima_atualizacao: 2026-04-30
---

# 📈 Módulo: Dashboard

## Status detectado
**existente** — frontend `features/dashboard/`.

## Objetivo
Dar à equipe uma visão consolidada dia/semana com KPIs e gráficos.

## Evidências
- Frontend: `CasaDiAna/frontend/src/features/dashboard/`
- Libs: ECharts (`echarts`, `echarts-for-react`)
- README ainda menciona Recharts; verificar [[OPEN_LOOPS]]

## Regras relacionadas
- (apenas consumo de relatórios/queries)

## Módulos relacionados
- [[MOD_RELATORIOS]]
- [[MOD_NOTIFICACOES_ESTOQUE]]

## Pontos de atenção
- Performance: agregar no backend; não puxar lista de movimentações inteira para o front.

## O que NÃO fazer
- Não duplicar regra de negócio do backend nas queries do dashboard.
