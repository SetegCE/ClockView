# Plano de Implementação - Correção de Bugs no Cálculo de Horas

## Prioridade de Execução

1. **Bug 2 (CRÍTICO)** - Semanas futuras com horas
2. **Bug 3 (CRÍTICO)** - Divergência com Clockify
3. **Bug 1 (Visual)** - Nome separado

---

## Bug 2: Semanas Futuras com Horas (CRÍTICO)

### Exploração

- [ ] 1. Escrever teste de exploração da condição do bug (semanas futuras)
  - **Property 1: Bug Condition** - Semanas Futuras com Horas Indevidas
  - **CRÍTICO**: Este teste DEVE FALHAR no código não corrigido - a falha confirma que o bug existe
  - **NÃO tente corrigir o teste ou o código quando ele falhar**
  - **NOTA**: Este teste codifica o comportamento esperado - ele validará a correção quando passar após a implementação
  - **OBJETIVO**: Demonstrar que semanas futuras estão recebendo horas indevidamente
  - **Abordagem de PBT Focada**: Para bugs determinísticos, focar o teste nos casos concretos que falham
  - Implementar teste baseado em propriedade que verifica:
    - Para qualquer semana cuja segunda-feira > data atual (semana futura)
    - E que não possui entradas reais no Clockify
    - O sistema NÃO DEVE exibir horas > 0
  - Casos de teste específicos:
    - Cristina com 40h em semana futura (2025-01-27) quando hoje é 2025-01-22
    - Semanas futuras sem projetos no painel de detalhes mas com horas no dashboard
  - Executar teste no código NÃO CORRIGIDO
  - **RESULTADO ESPERADO**: Teste FALHA (isso está correto - prova que o bug existe)
  - Documentar contraexemplos encontrados:
    - Quais semanas futuras têm horas > 0?
    - Quais colaboradores são afetados?
    - Valores de horas exibidos vs esperados (0)
  - Marcar tarefa como completa quando teste estiver escrito, executado e falha documentada
  - _Requirements: 1.3, 1.5, 2.3, 2.5_

- [ ] 2. Escrever testes de preservação (ANTES de implementar correção)
  - **Property 2: Preservation** - Comportamento de Semanas Passadas Inalterado
  - **IMPORTANTE**: Seguir metodologia de observação primeiro
  - Observar: No código NÃO CORRIGIDO, semanas passadas (segunda-feira ≤ data atual) são processadas corretamente
  - Observar: Redistribuição de folgas funciona para semanas passadas
  - Observar: Carnaval automático é aplicado apenas na semana de carnaval (se passada)
  - Escrever testes baseados em propriedade capturando os padrões de comportamento observados:
    - Para qualquer semana passada com dados reais do Clockify
    - O código corrigido DEVE produzir exatamente o mesmo resultado que o código original
    - Redistribuição de folgas DEVE continuar funcionando para semanas passadas
    - Carnaval automático DEVE continuar sendo aplicado quando apropriado
  - Testes baseados em propriedade geram muitos casos de teste para garantias mais fortes
  - Executar testes no código NÃO CORRIGIDO
  - **RESULTADO ESPERADO**: Testes PASSAM (isso confirma o comportamento base a preservar)
  - Marcar tarefa como completa quando testes estiverem escritos, executados e passando no código não corrigido
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

### Implementação

- [ ] 3. Correção do Bug 2 - Filtrar semanas futuras
  - [ ] 3.1 Implementar filtro de semanas futuras em `dashboardService.ts`
    - Calcular segunda-feira da semana atual no início de `processarDashboard()`
    - Modificar loop de processamento de semanas (linha ~165):
      - Adicionar condição: `if (s < primeiraSemana || s > segundaFeiraAtual)`
      - Marcar semanas futuras como `skip: true`
      - Definir `horas: 0` para semanas futuras
    - Garantir que redistribuição de folgas (linha ~220) pula semanas com `skip: true` (já implementado)
    - Garantir que carnaval automático (linha ~210) pula semanas com `skip: true` (já implementado)
    - _Bug_Condition: `isBugCondition_Bug2(input)` onde `input.semana > dataAtual AND input.horasExibidas > 0 AND naoExistemEntradasReaisNoClockify(semana)`_
    - _Expected_Behavior: Para qualquer semana futura, `result.horas == 0 OR result.skip == true`_
    - _Preservation: Semanas passadas continuam sendo processadas com redistribuição e carnaval automático_
    - _Requirements: 1.3, 1.5, 2.3, 2.5, 3.1, 3.2, 3.3_

  - [ ] 3.2 Verificar que teste de exploração agora passa
    - **Property 1: Expected Behavior** - Semanas Futuras com Zero Horas
    - **IMPORTANTE**: Re-executar o MESMO teste da tarefa 1 - NÃO escrever novo teste
    - O teste da tarefa 1 codifica o comportamento esperado
    - Quando este teste passar, confirma que o comportamento esperado foi satisfeito
    - Executar teste de exploração da condição do bug (tarefa 1)
    - **RESULTADO ESPERADO**: Teste PASSA (confirma que o bug foi corrigido)
    - Verificar casos específicos:
      - Cristina não tem mais 40h em semana futura
      - Todas as semanas futuras têm `horas: 0` ou `skip: true`
    - _Requirements: 2.3, 2.5_

  - [ ] 3.3 Verificar que testes de preservação ainda passam
    - **Property 2: Preservation** - Comportamento de Semanas Passadas Inalterado
    - **IMPORTANTE**: Re-executar os MESMOS testes da tarefa 2 - NÃO escrever novos testes
    - Executar testes de preservação (tarefa 2)
    - **RESULTADO ESPERADO**: Testes PASSAM (confirma que não há regressões)
    - Confirmar que todos os testes ainda passam após correção:
      - Semanas passadas processadas corretamente
      - Redistribuição de folgas funciona
      - Carnaval automático aplicado quando apropriado

- [ ] 4. Checkpoint Bug 2 - Garantir que todos os testes passam
  - Executar suite completa de testes do Bug 2
  - Verificar que não há regressões em outras funcionalidades
  - Perguntar ao usuário se há dúvidas ou problemas

---

## Bug 3: Divergência com Clockify (CRÍTICO)

### Exploração

- [ ] 5. Escrever teste de exploração da condição do bug (divergência de dados)
  - **Property 1: Bug Condition** - Divergência entre Dashboard e Clockify
  - **CRÍTICO**: Este teste DEVE FALHAR no código não corrigido - a falha confirma que o bug existe
  - **NÃO tente corrigir o teste ou o código quando ele falhar**
  - **NOTA**: Este teste codifica o comportamento esperado - ele validará a correção quando passar após a implementação
  - **OBJETIVO**: Demonstrar que os valores do dashboard divergem do Clockify
  - **Abordagem de PBT Focada**: Para bugs determinísticos, focar o teste nos casos concretos que falham
  - Implementar teste baseado em propriedade que verifica:
    - Para qualquer colaborador com entradas no Clockify em semanas passadas
    - Os valores de horas do dashboard DEVEM corresponder aos dados do Clockify
    - Tolerância máxima: 0.1h (6 minutos)
  - Casos de teste específicos:
    - Dados de Carina: comparar horas do dashboard vs Clockify
    - Verificar se divergência é causada por:
      - Erro no parsing de duração (`parseDuration()`)
      - Arredondamento prematuro acumulando erros
      - Redistribuição/carnaval aplicados incorretamente
  - Executar teste no código NÃO CORRIGIDO
  - **RESULTADO ESPERADO**: Teste FALHA (isso está correto - prova que o bug existe)
  - Documentar contraexemplos encontrados:
    - Quais colaboradores têm divergências?
    - Valores do dashboard vs Clockify
    - Diferença absoluta em horas
  - Marcar tarefa como completa quando teste estiver escrito, executado e falha documentada
  - _Requirements: 1.6, 1.7, 1.8, 2.6, 2.7, 2.8_

- [ ] 6. Escrever testes de preservação (ANTES de implementar correção)
  - **Property 2: Preservation** - Lógica de Negócio Preservada
  - **IMPORTANTE**: Seguir metodologia de observação primeiro
  - Observar: No código NÃO CORRIGIDO, a lógica de negócio funciona corretamente para casos não afetados pelo bug
  - Observar: Redistribuição de folgas deduz horas de semanas anteriores
  - Observar: Carnaval automático adiciona 24h quando apropriado
  - Observar: Categorização de atividades funciona corretamente
  - Escrever testes baseados em propriedade capturando os padrões de comportamento observados:
    - Para qualquer entrada válida do Clockify
    - O código corrigido DEVE manter a mesma lógica de negócio
    - Redistribuição, carnaval, categorização DEVEM continuar funcionando
  - Testes baseados em propriedade geram muitos casos de teste para garantias mais fortes
  - Executar testes no código NÃO CORRIGIDO
  - **RESULTADO ESPERADO**: Testes PASSAM (isso confirma o comportamento base a preservar)
  - Marcar tarefa como completa quando testes estiverem escritos, executados e passando no código não corrigido
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

### Implementação

- [ ] 7. Correção do Bug 3 - Garantir precisão dos dados
  - [ ] 7.1 Investigar causa raiz da divergência
    - Adicionar logs detalhados em `processarDashboard()`:
      - Horas brutas do Clockify (antes de qualquer transformação)
      - Horas após classificação (work, folga, carnaval, absence)
      - Horas após redistribuição de folgas
      - Horas após carnaval automático
      - Horas finais exibidas
    - Executar com dados de Carina e comparar cada etapa com Clockify
    - Identificar exatamente onde a divergência ocorre
    - Documentar causa raiz encontrada
    - _Requirements: 1.6, 1.7, 1.8_

  - [ ] 7.2 Implementar correção baseada na causa raiz identificada
    - **Hipótese 1**: Se divergência for causada por semanas futuras (Bug 2):
      - Verificar se correção do Bug 2 já resolveu o problema
      - Executar teste de exploração (tarefa 5)
    - **Hipótese 2**: Se divergência for causada por arredondamento prematuro:
      - Remover arredondamento intermediário (linha ~230)
      - Manter precisão máxima durante cálculos
      - Arredondar apenas no resultado final
    - **Hipótese 3**: Se divergência for causada por parsing incorreto:
      - Revisar e corrigir `parseDuration()` em `lib/durationParser.ts`
      - Adicionar testes unitários para múltiplos formatos ISO 8601
    - **Hipótese 4**: Se divergência for causada por redistribuição incorreta:
      - Revisar lógica de redistribuição de folgas (linha ~220)
      - Garantir que dedução não ultrapassa horas disponíveis
      - Verificar que redistribuição só afeta semanas passadas
    - _Bug_Condition: `isBugCondition_Bug3(input)` onde `abs(input.horasDashboard - input.horasClockify) > 0.1`_
    - _Expected_Behavior: Para qualquer colaborador, `abs(result.horas - horasClockify) <= 0.1`_
    - _Preservation: Lógica de negócio (redistribuição, carnaval, categorização) permanece inalterada_
    - _Requirements: 1.6, 1.7, 1.8, 2.6, 2.7, 2.8, 3.1, 3.2, 3.3, 3.4_

  - [ ] 7.3 Verificar que teste de exploração agora passa
    - **Property 1: Expected Behavior** - Dados Exatos do Clockify
    - **IMPORTANTE**: Re-executar o MESMO teste da tarefa 5 - NÃO escrever novo teste
    - O teste da tarefa 5 codifica o comportamento esperado
    - Quando este teste passar, confirma que o comportamento esperado foi satisfeito
    - Executar teste de exploração da condição do bug (tarefa 5)
    - **RESULTADO ESPERADO**: Teste PASSA (confirma que o bug foi corrigido)
    - Verificar casos específicos:
      - Dados de Carina agora batem com Clockify
      - Divergência ≤ 0.1h para todos os colaboradores
    - _Requirements: 2.6, 2.7, 2.8_

  - [ ] 7.4 Verificar que testes de preservação ainda passam
    - **Property 2: Preservation** - Lógica de Negócio Preservada
    - **IMPORTANTE**: Re-executar os MESMOS testes da tarefa 6 - NÃO escrever novos testes
    - Executar testes de preservação (tarefa 6)
    - **RESULTADO ESPERADO**: Testes PASSAM (confirma que não há regressões)
    - Confirmar que todos os testes ainda passam após correção:
      - Redistribuição de folgas funciona corretamente
      - Carnaval automático aplicado quando apropriado
      - Categorização de atividades inalterada

- [ ] 8. Checkpoint Bug 3 - Garantir que todos os testes passam
  - Executar suite completa de testes do Bug 3
  - Verificar que correção do Bug 2 não causou regressões no Bug 3
  - Perguntar ao usuário se há dúvidas ou problemas

---

## Bug 1: Nome do Colaborador Separado (Visual)

### Exploração

- [ ] 9. Escrever teste de exploração da condição do bug (nome separado)
  - **Property 1: Bug Condition** - Nome do Colaborador em Múltiplas Linhas
  - **CRÍTICO**: Este teste DEVE FALHAR no código não corrigido - a falha confirma que o bug existe
  - **NÃO tente corrigir o teste ou o código quando ele falhar**
  - **NOTA**: Este teste codifica o comportamento esperado - ele validará a correção quando passar após a implementação
  - **OBJETIVO**: Demonstrar que o nome do colaborador aparece separado em linhas diferentes
  - **Abordagem de PBT Focada**: Para bugs determinísticos, focar o teste nos casos concretos que falham
  - Implementar teste de renderização que verifica:
    - Para qualquer nome de colaborador (ex: "Leomyr Sângelo")
    - Renderizar componente `PainelDetalhes`
    - Verificar que o elemento DOM do nome NÃO contém quebras de linha
    - Verificar que `whiteSpace: "nowrap"` está aplicado
  - Casos de teste específicos:
    - "Leomyr Sângelo" aparece em uma linha
    - Nomes longos não quebram em múltiplas linhas
  - Executar teste no código NÃO CORRIGIDO
  - **RESULTADO ESPERADO**: Teste FALHA (isso está correto - prova que o bug existe)
  - Documentar contraexemplos encontrados:
    - Quais nomes aparecem separados?
    - CSS conflitante identificado?
    - Container pai sem `minWidth: 0`?
  - Marcar tarefa como completa quando teste estiver escrito, executado e falha documentada
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [ ] 10. Escrever testes de preservação (ANTES de implementar correção)
  - **Property 2: Preservation** - Formatação Visual Inalterada
  - **IMPORTANTE**: Seguir metodologia de observação primeiro
  - Observar: No código NÃO CORRIGIDO, a formatação visual do painel está correta (cor, peso, tamanho)
  - Observar: Outros elementos do painel (categorias, projetos) renderizam corretamente
  - Escrever testes baseados em propriedade capturando os padrões de comportamento observados:
    - Para qualquer renderização do painel de detalhes
    - O código corrigido DEVE manter a mesma formatação visual
    - Cor (#1e293b), peso (700), tamanho (16px) DEVEM permanecer iguais
  - Testes baseados em propriedade geram muitos casos de teste para garantias mais fortes
  - Executar testes no código NÃO CORRIGIDO
  - **RESULTADO ESPERADO**: Testes PASSAM (isso confirma o comportamento base a preservar)
  - Marcar tarefa como completa quando testes estiverem escritos, executados e passando no código não corrigido
  - _Requirements: 3.5_

### Implementação

- [ ] 11. Correção do Bug 1 - Nome em uma linha
  - [ ] 11.1 Implementar correção em `PainelDetalhes.tsx`
    - Investigar CSS conflitante que pode estar sobrescrevendo `whiteSpace: "nowrap"`
    - Adicionar `display: "block"` ao estilo do elemento do nome (linha ~50)
    - Verificar que container pai tem `minWidth: 0` (já existe na linha ~40)
    - Testar com nomes de diferentes tamanhos:
      - Nomes curtos (ex: "João Silva")
      - Nomes médios (ex: "Leomyr Sângelo")
      - Nomes longos (ex: "Maria Fernanda dos Santos")
    - _Bug_Condition: `isBugCondition_Bug1(input)` onde `input.nomeColaborador.length > 0 AND nomeApareceSeparado(elementoDOM)`_
    - _Expected_Behavior: Para qualquer nome, `nomeEmUmaLinha(result) == true`_
    - _Preservation: Formatação visual (cor, peso, tamanho) permanece inalterada_
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.5_

  - [ ] 11.2 Verificar que teste de exploração agora passa
    - **Property 1: Expected Behavior** - Nome do Colaborador em Uma Linha
    - **IMPORTANTE**: Re-executar o MESMO teste da tarefa 9 - NÃO escrever novo teste
    - O teste da tarefa 9 codifica o comportamento esperado
    - Quando este teste passar, confirma que o comportamento esperado foi satisfeito
    - Executar teste de exploração da condição do bug (tarefa 9)
    - **RESULTADO ESPERADO**: Teste PASSA (confirma que o bug foi corrigido)
    - Verificar casos específicos:
      - "Leomyr Sângelo" aparece em uma linha
      - Nomes longos não quebram
    - _Requirements: 2.1, 2.2_

  - [ ] 11.3 Verificar que testes de preservação ainda passam
    - **Property 2: Preservation** - Formatação Visual Inalterada
    - **IMPORTANTE**: Re-executar os MESMOS testes da tarefa 10 - NÃO escrever novos testes
    - Executar testes de preservação (tarefa 10)
    - **RESULTADO ESPERADO**: Testes PASSAM (confirma que não há regressões)
    - Confirmar que todos os testes ainda passam após correção:
      - Formatação visual mantida
      - Outros elementos do painel renderizam corretamente

- [ ] 12. Checkpoint Bug 1 - Garantir que todos os testes passam
  - Executar suite completa de testes do Bug 1
  - Verificar que correções anteriores (Bug 2 e 3) não causaram regressões
  - Perguntar ao usuário se há dúvidas ou problemas

---

## Checkpoint Final

- [ ] 13. Validação completa de todas as correções
  - Executar suite completa de testes (Bug 1, 2 e 3)
  - Verificar que todos os testes de exploração passam (bugs corrigidos)
  - Verificar que todos os testes de preservação passam (sem regressões)
  - Testar manualmente no dashboard:
    - Cristina não tem mais 40h em semana futura
    - Dados de Carina batem com Clockify
    - Nome "Leomyr Sângelo" aparece em uma linha
  - Documentar quaisquer problemas encontrados
  - Perguntar ao usuário se há dúvidas ou se está pronto para deploy
