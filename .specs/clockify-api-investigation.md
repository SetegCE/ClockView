# Investigação: Integração com a API do Clockify

**Data:** Abril 2026  
**Status:** Aguardando validação antes de implementar correções

---

## 1. Endpoints consumidos

| Endpoint                                                                                   | Método | Uso                                      |
| ------------------------------------------------------------------------------------------ | ------ | ---------------------------------------- |
| `GET /workspaces/{wsId}/users?limit=200`                                                   | GET    | Lista todos os membros do workspace      |
| `GET /workspaces/{wsId}/projects?limit=500`                                                | GET    | Lista todos os projetos                  |
| `GET /workspaces/{wsId}/user/{userId}/time-entries?start=...&end=...&page=N&page-size=500` | GET    | Entradas de tempo por usuário (paginado) |

---

## 2. Estrutura bruta dos dados

### 2.1 Entrada de tempo (`ClockifyTimeEntry`)

```json
{
  "id": "69e0cbeedcb21e0f2f21a5af",
  "description": "EIA | RELATORIO",
  "userId": "67fe5ca85bfde71f324eeb4c",
  "projectId": "68c8657aba722428ff0cb542",
  "workspaceId": "5fbf8f7c708b023273c933f0",
  "timeInterval": {
    "start": "2026-04-16T16:00:00Z",
    "end": "2026-04-16T20:00:00Z",
    "duration": "PT4H"
  },
  "billable": true,
  "type": "REGULAR"
}
```

**Campos relevantes:**

- `timeInterval.duration` — duração no formato ISO 8601 (ex: `PT4H`, `PT1H30M`)
- `projectId` — ID do projeto (pode ser `null` se sem projeto)
- `description` — texto livre usado para categorização e filtros de ausência

### 2.2 Projeto (`ClockifyProject`)

```json
{
  "id": "62b1c2cd2518aa18da456ea1",
  "name": "#0000-1-1990 (SETEG INTERNO)",
  "clientName": "SETEG",
  "clientId": "abc123"
}
```

**Observação:** A maioria dos projetos tem `clientName` preenchido. Apenas 1 projeto não tem cliente associado.

### 2.3 Usuário (`ClockifyUser`)

```json
{
  "id": "67fe5ca85bfde71f324eeb4c",
  "name": "Leomyr Sângelo | SETEG",
  "email": "leomyr@seteg.com.br",
  "status": "ACTIVE"
}
```

---

## 3. Transformação dos dados no `/services`

### 3.1 Fluxo completo

```
API Clockify
    ↓
buscarUsuarios() → filtra EXCLUDE_USERS → mapaUsuarios (id → nome)
buscarProjetos() → mapaProjetos (id → clientName || "SETEG (interno)")
buscarEntradasUsuario() → paginado, 500 por página
    ↓
Para cada entrada:
  - parseDuration(duration) → horas decimais
  - getSemana(start) → segunda-feira da semana (YYYY-MM-DD)
  - isCarnaval/isFolga/isExcluida(description) → classifica ausência
  - categorizar(description) → campo/reuniao/escritorio/gerenciamento
  - agrupa por: colaborador → semana → bucket{work, folga, carnaval, absence}
    ↓
Para cada colaborador:
  - Aplica carnaval automático (semana 2026-02-16)
  - Redistribui folgas para semanas anteriores
  - Calcula horas efetivas = work + absence + carnaval
  - Calcula % da meta
    ↓
DadosDashboard → cache 10 minutos → frontend
```

### 3.2 Cálculo de horas

1. **Campo bruto:** `timeInterval.duration = "PT1H30M"`
2. **parseDuration:** converte para decimal → `1.5`
3. **Acumulação:** soma por semana no bucket `work`
4. **Horas efetivas:** `effective = work + absence + carnaval`
5. **Redistribuição de folgas:** folgas são somadas à semana atual e o excesso é deduzido de semanas anteriores
6. **Exibição:** `Math.round(effective * 10) / 10` → 1 casa decimal

---

## 4. Causa dos projetos com nomes similares ("SETEG" e "SETEG (interno)")

**Origem:** É herança direta da estrutura da API do Clockify.

No Clockify, cada projeto tem:

- `name` — nome do projeto (ex: `#0000-1-1990 (SETEG INTERNO)`)
- `clientName` — nome do cliente associado (ex: `SETEG`)

O código atual agrupa as entradas pelo **clientName** do projeto:

```typescript
const mapaProjetos = new Map(
  projetos.map((p) => [p.id, p.clientName || "SETEG (interno)"]),
);
```

**Resultado:**

- Projetos com `clientName = "SETEG"` → aparecem como **"SETEG"**
- Projetos sem `clientName` → aparecem como **"SETEG (interno)"** (fallback hardcoded)

**Clientes reais no workspace (16 clientes):**

- SETEG, BARREIRO TABATINGA, CARIRI EXTRATORA, CASA DOS VENTOS, CERÂMICA FERREIRA LIMA, CERÂMICA VALE DO RIO LONGA, COMPANHIA ENERGÉTICA DE PETROLINA, ENGIE BRASIL ENERGIA SA Z, GRANOS, GRUPO MUNIZ, GRUPO TELLES, AGUINALDO LIMA, AJLIMA AGRONEGÓCIOS, APODI, CATU LAKE, CERÂMICA ROSÁRIO

**Total de projetos:** ~200+ projetos, agrupados em 16 clientes + fallback "SETEG (interno)"

---

## 5. Inconsistências identificadas

### 5.1 Agrupamento por cliente em vez de projeto

**Problema:** O código agrupa entradas pelo `clientName` do projeto, não pelo nome do projeto em si. Isso significa que todos os projetos do cliente "SETEG" (ex: `#0000-1-1990`, `#0000-5-2025`) aparecem somados como um único item "SETEG" no dashboard.

**Impacto:** O usuário não consegue distinguir qual projeto específico consumiu as horas.

**Correção sugerida:** Usar `project.name` (com o código do projeto) em vez de `clientName`.

### 5.2 Período fixo desde 2026-01-01

**Problema:** `START_DATE = "2026-01-01"` está hardcoded no `config/clockify.ts`. Não há como o usuário alterar o período pela interface.

**Correção sugerida:** Adicionar seletor de período na interface.

### 5.3 Limite de 8 projetos por colaborador

**Problema:** `topProjetos` é limitado a 8 projetos por colaborador (`.slice(0, 8)`). Colaboradores com mais de 8 projetos perdem dados.

### 5.4 Nome dos usuários inclui " | SETEG"

**Observação:** Os nomes dos usuários no Clockify incluem o sufixo " | SETEG" (ex: "Leomyr Sângelo | SETEG"). O código exibe esse nome completo. Pode ser desejável remover o sufixo para exibição.

### 5.5 Projetos sem `clientName` (1 projeto)

Apenas 1 projeto não tem cliente associado: `#0064-1-2022 | RDV | 23.037.514/0001-17 | MONITORAMENTO FAUNA`. Esse projeto cai no fallback "SETEG (interno)".

---

## 6. Resumo das correções propostas

| #   | Item                                                                        | Prioridade |
| --- | --------------------------------------------------------------------------- | ---------- |
| 1   | Exibir nome do projeto (com código) em vez de clientName                    | Alta       |
| 2   | Adicionar seletor de período (data início/fim)                              | Alta       |
| 3   | Filtro de colaborador na página de colaboradores                            | Média      |
| 4   | Número da semana ISO 8601 no dashboard                                      | Média      |
| 5   | Simplificar legenda para semáforo (≤50% vermelho, ≤80% amarelo, >80% verde) | Baixa      |
| 6   | Corrigir "Sem dado" → "Sem dados"                                           | Baixa      |

---

## 7. Aguardando validação

Antes de implementar qualquer alteração, confirme:

1. **Agrupamento de projetos:** Quer ver o nome completo do projeto (ex: `#0000-1-1990 (SETEG INTERNO)`) ou apenas o código (ex: `#0000-1-1990`)?
2. **Período padrão:** Confirma que o padrão deve ser o mês atual (primeiro ao último dia)?
3. **Sufixo " | SETEG":** Quer remover o sufixo dos nomes dos colaboradores na exibição?
