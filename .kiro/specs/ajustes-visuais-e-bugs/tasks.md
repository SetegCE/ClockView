# Plano de Implementação: Ajustes Visuais e Bugs

## Visão Geral

Este plano implementa correções para 6 bugs identificados no dashboard ClockView, seguindo a metodologia de bug condition com testes exploratórios antes das correções.

---

## Tarefas

- [ ] 1. Escrever teste exploratório para Bug 1 - Nome do colaborador quebrado
  - **Property 1: Bug Condition** - Nome quebrado em múltiplas linhas
  - **IMPORTANTE**: Escrever este teste baseado em propriedades ANTES de implementar a correção
  - **OBJETIVO**: Demonstrar que nomes com múltiplas palavras são renderizados em elementos `<div>` separados
  - **Abordagem PBT Focada**: Testar com nomes de 2+ palavras (ex: "Leomyr Sângelo", "Cristina Oliveira")
  - Verificar que o componente renderiza dois elementos `<div>` com classes `cv-name-first` e `cv-name-last`
  - Executar teste no código NÃO CORRIGIDO
  - **RESULTADO ESPERADO**: Teste FALHA (confirma que o bug existe)
  - Documentar contraexemplos encontrados (ex: "Nome 'Leomyr Sângelo' renderizado em 2 divs separados")
  - Marcar tarefa como completa quando teste estiver escrito, executado e falha documentada
  - _Requirements: 2.1_

- [ ] 2. Escrever teste exploratório para Bug 2 - Semanas futuras com dados incorretos
  - **Property 1: Bug Condition** - Semanas futuras exibem horas > 0
  - **IMPORTANTE**: Escrever este teste baseado em propriedades ANTES de implementar a correção
  - **OBJETIVO**: Demonstrar que semanas futuras (após segundaFeiraAtual) exibem dados incorretos
  - **Abordagem PBT Focada**: Testar com datas futuras específicas (ex: semana 17, semana 18)
  - Processar dados com `endDate` no passado e verificar que semanas futuras têm `horas > 0`
  - Executar teste no código NÃO CORRIGIDO
  - **RESULTADO ESPERADO**: Teste FALHA (confirma que o bug existe)
  - Documentar contraexemplos encontrados (ex: "Semana 2025-04-21 mostra 40h quando deveria ser 0h")
  - Marcar tarefa como completa quando teste estiver escrito, executado e falha documentada
  - _Requirements: 2.2_

- [ ] 3. Escrever teste exploratório para Bug 3 - Campo de busca em posição incorreta
  - **Property 1: Bug Condition** - Campo de busca na linha 1 em vez da linha 2
  - **IMPORTANTE**: Escrever este teste baseado em propriedades ANTES de implementar a correção
  - **OBJETIVO**: Demonstrar que o campo de busca está posicionado incorretamente
  - **Abordagem PBT Focada**: Renderizar página de colaboradores e verificar estrutura DOM
  - Verificar que campo de busca está na primeira `<div>` (linha das cores do heatmap)
  - Verificar que texto "Clique em um card..." está na segunda `<div>` (linha dos indicadores)
  - Executar teste no código NÃO CORRIGIDO
  - **RESULTADO ESPERADO**: Teste FALHA (confirma que o bug existe)
  - Documentar contraexemplos encontrados (ex: "Campo de busca encontrado na linha 1, esperado na linha 2")
  - Marcar tarefa como completa quando teste estiver escrito, executado e falha documentada
  - _Requirements: 2.3_

- [ ] 4. Escrever teste exploratório para Bug 4 - Formato de horas inconsistente
  - **Property 1: Bug Condition** - Horas < 10 sem zero à esquerda
  - **IMPORTANTE**: Escrever este teste baseado em propriedades ANTES de implementar a correção
  - **OBJETIVO**: Demonstrar que fmtHoras não adiciona zero à esquerda para horas < 10
  - **Abordagem PBT Focada**: Testar com valores de 0 a 9.99 horas
  - Verificar que `fmtHoras(1.9)` retorna "1:54" em vez de "01:54"
  - Verificar que `fmtHoras(8.5)` retorna "8:30" em vez de "08:30"
  - Executar teste no código NÃO CORRIGIDO
  - **RESULTADO ESPERADO**: Teste FALHA (confirma que o bug existe)
  - Documentar contraexemplos encontrados (ex: "fmtHoras(1.9) retorna '1:54' sem zero à esquerda")
  - Marcar tarefa como completa quando teste estiver escrito, executado e falha documentada
  - _Requirements: 2.4_

- [ ] 5. Escrever teste exploratório para Bug 5 - Calendário sem número da semana
  - **Property 1: Bug Condition** - Calendário não exibe números de semana ISO 8601
  - **IMPORTANTE**: Escrever este teste baseado em propriedades ANTES de implementar a correção
  - **OBJETIVO**: Demonstrar que o calendário não mostra números de semana
  - **Abordagem PBT Focada**: Renderizar calendário e buscar por texto "Sem 1", "Sem 2", etc.
  - Verificar que não existem elementos com texto contendo "Sem" seguido de número
  - Executar teste no código NÃO CORRIGIDO
  - **RESULTADO ESPERADO**: Teste FALHA (confirma que o bug existe)
  - Documentar contraexemplos encontrados (ex: "Calendário renderizado sem coluna de números de semana")
  - Marcar tarefa como completa quando teste estiver escrito, executado e falha documentada
  - _Requirements: 2.5_

- [ ] 6. Escrever teste exploratório para Bug 6 - Calendário não destaca semana inteira
  - **Property 1: Bug Condition** - Apenas 1 dia destacado em vez de 7 dias da semana
  - **IMPORTANTE**: Escrever este teste baseado em propriedades ANTES de implementar a correção
  - **OBJETIVO**: Demonstrar que clicar em um dia destaca apenas aquele dia
  - **Abordagem PBT Focada**: Simular clique em diferentes dias e contar dias com classe `selected`
  - Clicar em "2025-04-15" (terça-feira) e verificar quantos dias recebem classe `selected`
  - Executar teste no código NÃO CORRIGIDO
  - **RESULTADO ESPERADO**: Teste FALHA (confirma que apenas 1 dia é destacado, não 7)
  - Documentar contraexemplos encontrados (ex: "Clique em 2025-04-15 destaca apenas 1 dia, esperado 7 dias")
  - Marcar tarefa como completa quando teste estiver escrito, executado e falha documentada
  - _Requirements: 2.6_

- [ ] 7. Escrever testes de preservação (ANTES de implementar correções)
  - **Property 2: Preservation** - Funcionalidades existentes inalteradas
  - **IMPORTANTE**: Seguir metodologia de observação primeiro
  - Observar comportamento no código NÃO CORRIGIDO para entradas não afetadas pelos bugs
  - Escrever testes baseados em propriedades capturando comportamento observado
  - Testar: heatmap (células, cores, percentuais), busca de colaboradores, formatação de horas com minutos zero
  - Testar: navegação do calendário, painel de detalhes, semanas passadas, regras de negócio
  - Executar testes no código NÃO CORRIGIDO
  - **RESULTADO ESPERADO**: Testes PASSAM (confirma comportamento baseline a preservar)
  - Marcar tarefa como completa quando testes estiverem escritos, executados e passando no código não corrigido
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

- [ ] 8. Implementar correções para os 6 bugs
  - [ ] 8.1 Corrigir Bug 1 - Nome do colaborador quebrado
    - Abrir arquivo `app/dashboard/page.tsx`
    - Localizar código que divide nome em `partes[0]` e `partes.slice(1)`
    - Substituir dois elementos `<div>` por um único elemento exibindo `colab.nome` completo
    - Aplicar `trunc()` ao nome completo se necessário para limitar tamanho
    - Manter estrutura do avatar e container pai inalterados
    - _Bug_Condition: isBugCondition1(input) onde nomeColaborador.split(/\s+/).length > 1_
    - _Expected_Behavior: Nome completo em uma única linha com estilo consistente_
    - _Preservation: Funcionalidade do heatmap (células, cores, percentuais) inalterada_
    - _Requirements: 2.1, 3.1_

  - [ ] 8.2 Corrigir Bug 2 - Semanas futuras com dados incorretos
    - Abrir arquivo `services/dashboardService.ts`
    - Localizar função `processarDashboard` e o loop que coleta `todasSemanasSet`
    - Adicionar filtro `s <= segundaFeiraAtual` ao coletar semanas no Set
    - Alternativa: Filtrar entradas de tempo antes do loop, descartando `semana > segundaFeiraAtual`
    - Verificar que `todasSemanas` não contém semanas futuras antes do loop de colaboradores
    - _Bug_Condition: isBugCondition2(input) onde semana > segundaFeiraAtual_
    - _Expected_Behavior: Semanas futuras com skip: true e horas: 0_
    - _Preservation: Cálculo de horas para semanas passadas inalterado_
    - _Requirements: 2.2, 3.2_

  - [ ] 8.3 Corrigir Bug 3 - Campo de busca em posição incorreta
    - Abrir arquivo `app/colaboradores/page.tsx`
    - Localizar estrutura de renderização da legenda (linhas ~30-60)
    - Remover campo de busca da primeira `<div>` (linha das cores do heatmap)
    - Adicionar texto "Clique em um card..." na primeira `<div>` à direita
    - Adicionar campo de busca na segunda `<div>` (linha dos indicadores) com `marginLeft: "auto"`
    - Ajustar espaçamento para manter layout equilibrado
    - _Bug_Condition: isBugCondition3(input) onde campoBuscaLinha === 1_
    - _Expected_Behavior: Campo de busca na linha 2, texto na linha 1_
    - _Preservation: Filtragem de colaboradores por busca inalterada_
    - _Requirements: 2.3, 3.3_

  - [ ] 8.4 Corrigir Bug 4 - Formato de horas inconsistente
    - Abrir arquivo `app/lib/utils.ts`
    - Localizar função `fmtHoras` (linha ~40)
    - Modificar return para usar `String(h).padStart(2, "0")` em vez de `${h}`
    - Manter `String(m).padStart(2, "0")` que já está correto
    - Resultado: `return \`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}\``
    - _Bug_Condition: isBugCondition4(input) onde h < 10 AND NOT resultado.startsWith("0")_
    - _Expected_Behavior: Formato HH:MM com 2 dígitos sempre_
    - _Preservation: Conversão de horas decimais para HH:MM mantém precisão_
    - _Requirements: 2.4, 3.4, 3.5_

  - [ ] 8.5 Corrigir Bug 5 - Calendário sem número da semana
    - Abrir arquivo `app/calendario/page.tsx`
    - Localizar renderização da grade do calendário (`cv-cal-grid`)
    - Adicionar coluna à esquerda para números de semana antes das células de dias
    - Para cada linha de 7 dias, calcular número da semana ISO 8601 do primeiro dia usando `numeroSemanaISO()`
    - Renderizar "Sem N" em formato compacto à esquerda de cada linha
    - Ajustar grid layout para acomodar nova coluna sem quebrar layout existente
    - _Bug_Condition: isBugCondition5(input) onde calendário não contém "Sem 1", "Sem 2"_
    - _Expected_Behavior: Números de semana ISO 8601 visíveis à esquerda de cada linha_
    - _Preservation: Navegação entre meses e exibição de dias inalterados_
    - _Requirements: 2.5, 3.6, 3.8_

  - [ ] 8.6 Corrigir Bug 6 - Calendário não destaca semana inteira
    - Abrir arquivo `app/calendario/page.tsx`
    - Localizar lógica de seleção que compara `diaSelecionado === cel.dataStr`
    - Quando `diaSelecionado` muda, calcular intervalo da semana usando `intervaloSemanaISO(diaSelecionado)`
    - Na renderização de cada célula, verificar se `cel.dataStr >= inicio && cel.dataStr <= fim`
    - Aplicar classe `selected` a todos os 7 dias da semana, não apenas ao dia clicado
    - Manter lógica que abre painel de detalhes ao clicar em um dia
    - _Bug_Condition: isBugCondition6(input) onde diasComClasseSelected.length === 1_
    - _Expected_Behavior: Todos os 7 dias da semana destacados visualmente_
    - _Preservation: Painel de detalhes continua exibindo dados corretos_
    - _Requirements: 2.6, 3.7_

  - [ ] 8.7 Verificar testes exploratórios agora passam
    - **Property 1: Expected Behavior** - Bugs corrigidos
    - **IMPORTANTE**: Re-executar os MESMOS testes das tarefas 1-6 - NÃO escrever novos testes
    - Os testes das tarefas 1-6 codificam o comportamento esperado
    - Quando estes testes passarem, confirma que os comportamentos esperados foram satisfeitos
    - Executar todos os 6 testes exploratórios no código CORRIGIDO
    - **RESULTADO ESPERADO**: Todos os testes PASSAM (confirma que bugs foram corrigidos)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ] 8.8 Verificar testes de preservação ainda passam
    - **Property 2: Preservation** - Sem regressões
    - **IMPORTANTE**: Re-executar os MESMOS testes da tarefa 7 - NÃO escrever novos testes
    - Executar testes de preservação no código CORRIGIDO
    - **RESULTADO ESPERADO**: Todos os testes PASSAM (confirma que não há regressões)
    - Confirmar que todas as funcionalidades não afetadas pelos bugs continuam funcionando
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

- [ ] 9. Checkpoint - Garantir que todos os testes passam
  - Executar suite completa de testes (exploratórios + preservação)
  - Verificar que não há regressões em funcionalidades existentes
  - Testar manualmente no navegador se necessário
  - Perguntar ao usuário se surgirem dúvidas ou problemas

---

## Notas de Implementação

### Ordem de Execução

1. **Fase de Exploração** (Tarefas 1-7): Escrever e executar testes ANTES das correções
2. **Fase de Implementação** (Tarefa 8): Aplicar correções com base no entendimento dos testes
3. **Fase de Validação** (Tarefa 9): Confirmar que testes passam e não há regressões

### Metodologia de Bug Condition

- **C(X)**: Condição que identifica entradas que acionam cada bug
- **P(result)**: Propriedade que define comportamento desejado para entradas bugadas
- **¬C(X)**: Entradas não afetadas pelos bugs que devem ser preservadas
- **F**: Função original (não corrigida)
- **F'**: Função corrigida

### Testes Baseados em Propriedades

Os testes exploratórios e de preservação devem usar abordagem de property-based testing quando possível:

- Geram muitos casos de teste automaticamente
- Capturam casos extremos que testes unitários podem perder
- Fornecem garantias fortes sobre comportamento em todo o domínio de entrada
