# Tasks — Melhorias v2 ClockView

## Tarefas

- [ ] 1. Agrupamento por projeto individual e remoção do sufixo " | SETEG"
  - Alterar `dashboardService.ts`: usar `p.name` em vez de `p.clientName`
  - Adicionar função `limparNome()` para remover sufixo " | SETEG"
  - Aplicar `limparNome()` no mapa de usuários e na lista de exclusão
  - Invalidar cache após a mudança
  - _Arquivos: `services/dashboardService.ts`_

- [ ] 2. Seletor de período no header
  - Adicionar estado `periodoInicio` e `periodoFim` no `DadosContext`
  - Padrão: primeiro e último dia do mês atual
  - Passar período como query params para `/api/dashboard?inicio=...&fim=...`
  - Atualizar `app/api/dashboard/route.ts` para ler os parâmetros
  - Atualizar `processarDashboard(inicio, fim)` para usar as datas recebidas
  - Adicionar inputs de data no `HeaderClient.tsx`
  - _Arquivos: `app/context/DadosContext.tsx`, `app/api/dashboard/route.ts`, `services/dashboardService.ts`, `app/components/HeaderClient.tsx`_

- [ ] 3. Filtro de colaborador na página de colaboradores
  - Adicionar estado `busca` e input de pesquisa
  - Filtrar `lista` em tempo real
  - _Arquivos: `app/colaboradores/page.tsx`_

- [ ] 4. Número da semana ISO 8601 no dashboard
  - Adicionar função `numeroSemanaISO()` em `app/lib/utils.ts`
  - Substituir `fmtData(s)` por `Sem ${numeroSemanaISO(s)}` no cabeçalho do heatmap
  - Atualizar tooltip das células
  - _Arquivos: `app/lib/utils.ts`, `app/dashboard/page.tsx`_

- [ ] 5. Legenda semáforo e correções visuais
  - Atualizar `corCelula()` em `app/lib/utils.ts` com nova paleta (≤50% vermelho, ≤80% amarelo, >80% verde)
  - Atualizar legenda no `app/dashboard/page.tsx` com nova ordem e cores
  - Corrigir "Sem dado" → "Sem dados" em todos os arquivos
  - _Arquivos: `app/lib/utils.ts`, `app/dashboard/page.tsx`, `app/dashboard.css`_
