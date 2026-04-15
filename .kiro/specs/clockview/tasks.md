# Plano de Implementação: ClockView

## Visão Geral

Implementação incremental do ClockView seguindo a arquitetura BFF (Backend for Frontend) com Next.js 14 App Router. As tarefas progridem da base (utilitários e tipos) até a integração completa (Route Handlers, serviços e componentes React), garantindo que cada etapa seja validada antes de avançar.

## Tarefas

- [x] 1. Configurar estrutura do projeto e tipos base
  - Criar os arquivos de configuração: `config/clockify.ts` com constantes de base URL e workspace ID lidas de variáveis de ambiente
  - Criar o arquivo `.env.example` com as variáveis `CLOCKIFY_API_TOKEN` e `CLOCKIFY_WORKSPACE_ID` sem valores reais
  - Definir todas as interfaces TypeScript em `lib/types.ts`: `EntradaDeTempo`, `ResumoUsuario`, `ResumoProjeto`, `DadosDashboard`, `FiltroConsulta`, `ClockifyTimeEntry`, `ClockifyUser`, `ClockifyProject`
  - Configurar Vitest e fast-check no projeto (`vitest.config.ts`, dependências em `package.json`)
  - _Requisitos: 8.1, 8.3, 2.4, 9.1_

- [ ] 2. Implementar utilitários de duração e data
  - [x] 2.1 Implementar `lib/durationParser.ts`
    - Escrever a função `parseDuration(iso: string): number` que converte strings ISO 8601 de duração (ex.: `PT1H30M`) para horas decimais
    - Tratar casos de borda: string vazia, duração nula, formato inválido (lançar erro ou retornar 0 conforme Requisito 6.5)
    - _Requisitos: 6.1_

  - [ ]\* 2.2 Escrever teste de propriedade para `parseDuration`
    - **Propriedade 2: Conversão de duração ISO 8601 para horas decimais**
    - Para qualquer combinação válida de h >= 0, 0 <= m < 60, 0 <= s < 60, verificar que `parseDuration("PTxHyMzS") === h + m/60 + s/3600`
    - **Valida: Requisito 6.1**

  - [x] 2.3 Implementar `lib/dateUtils.ts`
    - Escrever `getCurrentWeekRange(): { inicio: string; fim: string }` retornando segunda e domingo da semana atual no formato `YYYY-MM-DD`
    - Escrever `getCurrentMonthRange(): { inicio: string; fim: string }` retornando primeiro e último dia do mês atual
    - _Requisitos: 4.1, 4.5_

  - [ ]\* 2.4 Escrever testes unitários para `dateUtils`
    - Verificar que `getCurrentWeekRange` retorna segunda-feira como início e domingo como fim
    - Verificar que `getCurrentMonthRange` retorna o primeiro e o último dia do mês correto
    - _Requisitos: 4.1, 4.5_

- [ ] 3. Implementar utilitários de resposta e cliente HTTP
  - [x] 3.1 Implementar `lib/apiResponse.ts`
    - Escrever helpers para respostas padronizadas: `successResponse(data)`, `errorResponse(status, message)`
    - Garantir que nenhum campo do token seja incluído nas respostas
    - _Requisitos: 1.5, 2.1, 2.3_

  - [x] 3.2 Implementar `services/clockifyClient.ts`
    - Escrever a função `fetchFromClockify(path, token)` que realiza chamadas HTTP à Clockify API com o header `X-Api-Key`
    - Implementar timeout de 8 segundos usando `AbortController`; retornar `{ status: 504, message: "Tempo limite de resposta da API do Clockify excedido" }` em caso de timeout
    - Verificar presença do token antes de qualquer chamada; retornar `{ status: 500, message: "Token de autenticação não configurado" }` se ausente
    - Tratar JSON malformado na resposta da Clockify API retornando `{ status: 502, message: "Resposta inválida recebida da API do Clockify" }`
    - _Requisitos: 1.2, 1.3, 1.4, 7.2, 7.3, 9.3_

  - [ ]\* 3.3 Escrever testes unitários para `clockifyClient`
    - Testar: token ausente → 500, timeout → 504, JSON malformado → 502, erro 4xx/5xx da Clockify → repasse do código
    - Usar `vi.mock` para simular `fetch`
    - _Requisitos: 1.2, 1.3, 1.4, 7.3_

- [x] 4. Checkpoint — Verificar base utilitária
  - Garantir que todos os testes passam, perguntar ao usuário se há dúvidas antes de avançar.

- [ ] 5. Implementar serviço de transformação de dados
  - [x] 5.1 Implementar `services/timeEntryService.ts` — parsing e serialização
    - Escrever `parseTimeEntries(raw: ClockifyTimeEntry[], users: ClockifyUser[], projects: ClockifyProject[]): EntradaDeTempo[]`
    - Mapear campos brutos para o modelo interno `EntradaDeTempo`, usando `parseDuration` para converter `timeInterval.duration`
    - Entradas com duração nula ou inválida devem ser descartadas com `console.warn` no servidor
    - Escrever `serializeEntries(entries: EntradaDeTempo[]): object[]` para serialização ao frontend
    - _Requisitos: 6.1, 6.4, 6.5, 9.1, 9.2_

  - [ ]\* 5.2 Escrever teste de propriedade para round-trip de serialização
    - **Propriedade 1: Round-trip de serialização de EntradaDeTempo**
    - Para qualquer `EntradaDeTempo` válida gerada pelo arbitrary, `JSON.parse(JSON.stringify(entrada))` deve ser igual ao original
    - **Valida: Requisitos 9.1, 9.2, 9.4, 6.4**

  - [x] 5.3 Implementar agrupamento por usuário e por projeto em `timeEntryService.ts`
    - Escrever `groupByUser(entries: EntradaDeTempo[]): ResumoUsuario[]` calculando `totalHoras` por usuário
    - Escrever `groupByProject(entries: EntradaDeTempo[]): ResumoProjeto[]` calculando `totalHoras` por projeto
    - _Requisitos: 6.2, 6.3, 3.3, 3.4_

  - [ ]\* 5.4 Escrever teste de propriedade para invariante de agrupamento
    - **Propriedade 3: Agrupamento preserva invariante de total de horas**
    - Para qualquer lista de `EntradaDeTempo`, `sum(groupByUser(entries).map(g => g.totalHoras))` deve ser igual a `sum(entries.map(e => e.duracaoHoras))`; idem para `groupByProject`
    - **Valida: Requisitos 6.2, 6.3, 3.3, 3.4**

  - [ ]\* 5.5 Escrever teste de propriedade para exclusão de entradas inválidas
    - **Propriedade 4: Entradas com duração inválida são excluídas dos totais**
    - Para qualquer lista com subconjunto de entradas com `duracaoHoras` nula/inválida, o total calculado deve ser igual à soma apenas das entradas com `duracaoHoras > 0` e finita
    - **Valida: Requisito 6.5**

- [ ] 6. Implementar filtragem de entradas
  - [x] 6.1 Implementar função `filterEntries(entries, filtro)` em `timeEntryService.ts`
    - Filtrar por período: incluir apenas entradas com `entrada.inicio >= filtro.inicio` e `entrada.fim <= filtro.fim`
    - Filtrar por `userId` quando presente; filtrar por `projectId` quando presente
    - Quando nenhum filtro de usuário/projeto estiver ativo, retornar todas as entradas
    - _Requisitos: 4.2, 4.3, 5.3, 5.4, 5.5_

  - [ ]\* 6.2 Escrever teste de propriedade para filtragem por período
    - **Propriedade 5: Filtragem por período exclui entradas fora do intervalo**
    - Para qualquer lista de entradas e qualquer intervalo `[inicio, fim]`, todas as entradas retornadas devem satisfazer `entrada.inicio >= inicio` e `entrada.fim <= fim`
    - **Valida: Requisitos 4.2, 4.3**

  - [ ]\* 6.3 Escrever teste de propriedade para filtragem por usuário e projeto
    - **Propriedade 6: Filtragem por usuário e por projeto retorna apenas entradas correspondentes**
    - Para qualquer `userId` selecionado, todas as entradas retornadas devem ter `entrada.userId === userId`; idem para `projectId`; sem filtro ativo, todas as entradas devem ser retornadas
    - **Valida: Requisitos 5.3, 5.4, 5.5**

- [ ] 7. Implementar Route Handlers
  - [x] 7.1 Implementar `app/api/time-entries/route.ts`
    - Validar parâmetros obrigatórios `start` e `end` (formato ISO 8601); retornar HTTP 400 com mensagem descritiva se ausentes
    - Validar que `start` não é posterior a `end`; retornar HTTP 400 com "A data de início deve ser anterior à data de fim"
    - Chamar `clockifyClient` para buscar entradas, usuários e projetos do workspace
    - Chamar `parseTimeEntries`, `filterEntries`, `groupByUser` e `groupByProject` do serviço
    - Retornar HTTP 200 com `{ data: DadosDashboard }` usando `successResponse`
    - Repassar códigos de erro da Clockify API usando `errorResponse`
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 4.3, 4.4, 6.2, 6.3, 8.4_

  - [x] 7.2 Implementar `app/api/users/route.ts`
    - Buscar membros do workspace via `clockifyClient`
    - Retornar lista de `ClockifyUser` serializada; tratar erros com `errorResponse`
    - _Requisitos: 5.1_

  - [x] 7.3 Implementar `app/api/projects/route.ts`
    - Buscar projetos do workspace via `clockifyClient`
    - Retornar lista de `ClockifyProject` serializada; tratar erros com `errorResponse`
    - _Requisitos: 5.2_

  - [ ]\* 7.4 Escrever testes de integração para Route Handlers
    - Testar todos os cenários de erro mapeados na tabela do design (500, 502, 504, 400, repasse 4xx/5xx)
    - Usar MSW para simular respostas da Clockify API
    - _Requisitos: 1.3, 1.4, 4.4, 7.3, 9.3_

  - [ ]\* 7.5 Escrever teste de propriedade para repasse de código de erro
    - **Propriedade 7: Repasse de código de erro da Clockify API**
    - Para qualquer código HTTP 4xx ou 5xx retornado pela Clockify API simulada, a Route Handler deve retornar ao frontend um código HTTP correspondente e uma mensagem de erro não vazia
    - **Valida: Requisito 1.3**

  - [ ]\* 7.6 Escrever teste de propriedade para não exposição do token
    - **Propriedade 8: Token nunca exposto nas respostas ao frontend**
    - Para qualquer resposta (sucesso, erro ou timeout) da Route Handler, o valor do `CLOCKIFY_API_TOKEN` não deve aparecer em nenhum campo do corpo JSON retornado
    - **Valida: Requisitos 1.5, 2.1**

- [x] 8. Checkpoint — Verificar camada de servidor
  - Garantir que todos os testes passam, perguntar ao usuário se há dúvidas antes de avançar.

- [ ] 9. Implementar componentes React base
  - [x] 9.1 Criar `app/layout.tsx` e `app/page.tsx`
    - Configurar layout raiz com Tailwind CSS base e metadados da aplicação
    - Renderizar o componente `Dashboard` na página principal
    - _Requisitos: 8.1_

  - [x] 9.2 Implementar `app/components/LoadingSpinner.tsx` e `app/components/ErrorMessage.tsx`
    - `LoadingSpinner`: exibir indicador visual acessível enquanto `isLoading === true`
    - `ErrorMessage`: exibir mensagem de erro legível recebida via prop `message`
    - _Requisitos: 3.5, 3.6_

  - [x] 9.3 Implementar `app/components/PeriodSelector.tsx`
    - Renderizar seletor com opções: "Semana atual", "Mês atual" e "Intervalo personalizado"
    - Emitir `{ start, end }` ao componente pai ao selecionar qualquer opção
    - Usar `dateUtils` para calcular os intervalos predefinidos
    - Exibir campos de data para intervalo personalizado quando selecionado
    - _Requisitos: 4.1, 4.2, 4.5_

  - [x] 9.4 Implementar `app/components/UserFilter.tsx` e `app/components/ProjectFilter.tsx`
    - `UserFilter`: receber lista de usuários via prop e emitir `userId` selecionado (ou `null` para todos)
    - `ProjectFilter`: receber lista de projetos via prop e emitir `projectId` selecionado (ou `null` para todos)
    - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 10. Implementar tabelas de resumo e componente Dashboard
  - [x] 10.1 Implementar `app/components/UserSummaryTable.tsx`
    - Renderizar tabela com colunas: nome do usuário e total de horas no período
    - Receber `ResumoUsuario[]` via prop
    - _Requisitos: 3.1, 3.3_

  - [x] 10.2 Implementar `app/components/ProjectSummaryTable.tsx`
    - Renderizar tabela com colunas: nome do projeto e total de horas no período
    - Receber `ResumoProjeto[]` via prop
    - _Requisitos: 3.2, 3.4_

  - [x] 10.3 Implementar `app/components/Dashboard.tsx`
    - Gerenciar estado: `isLoading`, `error`, `dadosDashboard`, `filtro`, `usuarios`, `projetos`
    - Ao montar e ao alterar filtros, chamar `/api/time-entries` com os parâmetros do filtro atual
    - Chamar `/api/users` e `/api/projects` em paralelo para popular os seletores
    - Exibir `LoadingSpinner` enquanto `isLoading === true`; exibir `ErrorMessage` quando `error !== null`
    - Exibir dados parciais disponíveis enquanto outros ainda carregam (carregamento paralelo)
    - Usar semana atual como período padrão ao inicializar
    - Validar no cliente que `start` não é posterior a `end` antes de chamar a API
    - _Requisitos: 1.1, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.4, 4.5, 5.1, 5.2, 7.1, 7.4_

  - [ ]\* 10.4 Escrever testes unitários para componentes React
    - Testar renderização de `LoadingSpinner`, `ErrorMessage`, `UserSummaryTable` e `ProjectSummaryTable` com props variadas
    - Testar que `PeriodSelector` emite os valores corretos ao selecionar cada opção
    - _Requisitos: 3.5, 3.6, 4.1_

- [x] 11. Criar documentação e arquivos de configuração finais
  - Criar `README.md` com: instruções de setup local, lista de variáveis de ambiente, comando de execução local (`npm run dev`) e instruções de deploy na Vercel
  - Revisar `.env.example` garantindo que todas as variáveis necessárias estão listadas sem valores reais
  - _Requisitos: 8.2, 8.3, 2.4_

- [x] 12. Checkpoint final — Garantir que todos os testes passam
  - Executar a suíte completa de testes com `vitest --run`
  - Garantir que todos os testes passam, perguntar ao usuário se há dúvidas antes de concluir.

## Notas

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada tarefa referencia os requisitos específicos para rastreabilidade
- Os checkpoints garantem validação incremental a cada fase
- Os testes de propriedade validam invariantes universais com mínimo de 100 iterações (fast-check)
- Os testes unitários validam exemplos concretos e condições de borda
- O design usa TypeScript — todos os exemplos de código devem seguir as interfaces definidas em `lib/types.ts`
