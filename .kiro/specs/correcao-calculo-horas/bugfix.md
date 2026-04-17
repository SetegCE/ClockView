# Documento de Requisitos - Correção de Bugs no Cálculo de Horas

## Introdução

Este documento especifica as correções necessárias para três bugs críticos identificados no dashboard de horas da SETEG. Os bugs afetam a exibição de nomes de colaboradores, o cálculo de horas em semanas futuras e a precisão dos dados em relação ao Clockify.

**Impacto:** Os bugs comprometem a confiabilidade do dashboard, gerando confusão visual (Bug 1), exibindo dados incorretos de semanas futuras (Bug 2) e causando divergências com a fonte de dados oficial (Bug 3).

## Bug Analysis

### Current Behavior (Defect)

#### Bug 1: Nome do Colaborador Separado

1.1 WHEN o painel lateral de detalhes é exibido THEN o nome e sobrenome do colaborador aparecem em linhas separadas

1.2 WHEN o nome do colaborador é renderizado no painel THEN a formatação visual separa as partes do nome

#### Bug 2: Horas em Semanas Futuras

1.3 WHEN uma semana futura (que ainda não começou) é processada THEN o sistema exibe horas totais para essa semana (ex: Cristina com 40h)

1.4 WHEN o usuário clica em uma semana futura com horas exibidas THEN o painel de detalhes não mostra nenhum projeto com horas registradas

1.5 WHEN o sistema calcula horas efetivas para uma semana THEN semanas futuras sem dados reais do Clockify recebem valores de horas

#### Bug 3: Divergência com Dados do Clockify

1.6 WHEN o dashboard exibe as horas totais de um colaborador THEN os valores não correspondem aos dados registrados no Clockify

1.7 WHEN o sistema processa entradas de tempo do Clockify THEN o cálculo de horas efetivas resulta em valores diferentes dos originais

1.8 WHEN o usuário compara os dados do dashboard com o Clockify THEN encontra discrepâncias nas horas totais (ex: Carina)

### Expected Behavior (Correct)

#### Bug 1: Nome do Colaborador Junto

2.1 WHEN o painel lateral de detalhes é exibido THEN o nome completo do colaborador SHALL aparecer em uma única linha

2.2 WHEN o nome do colaborador é renderizado no painel THEN SHALL manter a mesma cor e destaque visual sem quebras de linha

#### Bug 2: Apenas Semanas com Dados Reais

2.3 WHEN uma semana futura (que ainda não começou) é processada THEN o sistema SHALL exibir 0 horas ou marcar como skip

2.4 WHEN o usuário clica em uma semana futura THEN o painel de detalhes SHALL mostrar "Nenhum projeto registrado" ou dados vazios

2.5 WHEN o sistema calcula horas efetivas para uma semana THEN SHALL considerar apenas semanas com entradas reais do Clockify até a data atual

#### Bug 3: Dados Exatos do Clockify

2.6 WHEN o dashboard exibe as horas totais de um colaborador THEN os valores SHALL corresponder exatamente aos dados registrados no Clockify

2.7 WHEN o sistema processa entradas de tempo do Clockify THEN o cálculo de horas efetivas SHALL preservar a precisão dos dados originais

2.8 WHEN o usuário compara os dados do dashboard com o Clockify THEN SHALL encontrar valores idênticos para todos os colaboradores

### Unchanged Behavior (Regression Prevention)

#### Funcionalidades que Devem Continuar Funcionando

3.1 WHEN o sistema processa semanas passadas com dados reais THEN SHALL CONTINUE TO calcular e exibir as horas corretamente

3.2 WHEN o sistema aplica redistribuição de folgas THEN SHALL CONTINUE TO deduzir horas de semanas anteriores conforme a lógica atual

3.3 WHEN o sistema adiciona carnaval automático THEN SHALL CONTINUE TO creditar 24h na semana de carnaval quando aplicável

3.4 WHEN o sistema classifica entradas como work, folga, carnaval ou absence THEN SHALL CONTINUE TO usar as regras de negócio existentes

3.5 WHEN o painel lateral exibe categorias e projetos THEN SHALL CONTINUE TO mostrar as barras de progresso e top 3 atividades

3.6 WHEN o sistema calcula médias e percentuais THEN SHALL CONTINUE TO usar a meta semanal do colaborador como referência

3.7 WHEN o usuário filtra por período (início/fim) THEN SHALL CONTINUE TO processar apenas as entradas dentro do intervalo especificado

3.8 WHEN o cache está válido THEN SHALL CONTINUE TO retornar dados em cache sem reprocessar
