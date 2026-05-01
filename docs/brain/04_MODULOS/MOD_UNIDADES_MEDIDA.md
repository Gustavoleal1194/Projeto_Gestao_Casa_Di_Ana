---
name: MOD_UNIDADES_MEDIDA
description: Tabela imutável de unidades de medida (KG, G, L, ML, UN, CX, PCT, DZ)
type: modulo
status: existente
ultima_atualizacao: 2026-04-30
---

# 📏 Módulo: Unidades de Medida

## Status detectado
**existente** — seed imutável aplicado por migration.

## Objetivo
Padronizar unidades para ingredientes e itens de ficha técnica.

## Conteúdo (seed)
| id | codigo | descricao   |
| -- | ------ | ----------- |
| 1  | KG     | Quilograma  |
| 2  | G      | Grama       |
| 3  | L      | Litro       |
| 4  | ML     | Mililitro   |
| 5  | UN     | Unidade     |
| 6  | CX     | Caixa       |
| 7  | PCT    | Pacote      |
| 8  | DZ     | Dúzia       |

PK `smallint`.

## Evidências
- Domain: `Domain/Entities/UnidadeMedida.cs`
- Application: `Application/UnidadesMedida/`
- Controller: `API/Controllers/UnidadesMedidaController.cs`
- Schema: `CasaDiAna/docs/BANCO_DE_DADOS.md` (seção `estoque.unidades_medida`)

## Regras relacionadas
- (nenhuma específica) — as unidades são **read-only** para a UI.

## Módulos relacionados
- [[MOD_INGREDIENTES]]
- [[MOD_PRODUTOS_FICHA_TECNICA]]

## O que NÃO fazer
- Não criar/excluir/editar unidades pelo CRUD — qualquer mudança deve vir por **migration**.
