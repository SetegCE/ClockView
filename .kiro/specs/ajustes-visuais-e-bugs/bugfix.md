# Documento de Requisitos de Bugfix

## Introdução

Este documento descreve 6 correções de bugs e melhorias visuais no dashboard ClockView. Os problemas afetam a apresentação de dados (nomes quebrados, formato de horas inconsistente), a lógica de filtragem (semanas futuras com dados incorretos), e a usabilidade (layout do campo de busca, falta de indicadores visuais no calendário). As correções garantirão que a interface apresente informações precisas e consistentes, melhorando a experiência do usuário.

## Bug Analysis

### Current Behavior (Defect)

#### Bug 1: Nome do Colaborador Quebrado na Tabela

1.1 QUANDO o nome do colaborador é exibido na tabela do heatmap ENTÃO o sistema exibe o primeiro nome em uma linha e o sobrenome em outra linha com estilos diferentes

#### Bug 2: Semanas Futuras com Dados Incorretos

1.2 QUANDO uma semana futura (após a segunda-feira da semana atual) é processada ENTÃO o sistema exibe horas registradas (ex: Cristina com 40h na semana 17) mesmo sem projetos ou dados reais

#### Bug 3: Campo de Busca em Posição Incorreta

1.3 QUANDO a página de colaboradores é carregada ENTÃO o campo de busca aparece na linha 1 da legenda junto com as cores do heatmap, e o texto "Clique em um card..." aparece na linha 2 com os indicadores

#### Bug 4: Formato de Horas Inconsistente

1.4 QUANDO horas são formatadas para exibição ENTÃO o sistema exibe "1:54" sem zero à esquerda na hora, resultando em formato inconsistente

#### Bug 5: Calendário Sem Número da Semana

1.5 QUANDO o calendário mensal é exibido ENTÃO o sistema não mostra o número da semana ISO 8601 à esquerda de cada linha do calendário

#### Bug 6: Calendário Não Destaca Semana Inteira

1.6 QUANDO o usuário clica em um dia no calendário ENTÃO o sistema destaca apenas aquele dia específico, não a semana completa (segunda a domingo)

### Expected Behavior (Correct)

#### Bug 1: Nome do Colaborador Completo na Mesma Linha

2.1 QUANDO o nome do colaborador é exibido na tabela do heatmap ENTÃO o sistema SHALL exibir o nome completo (primeiro nome e sobrenome) na mesma linha com o mesmo estilo visual

#### Bug 2: Semanas Futuras com 0h

2.2 QUANDO uma semana futura (após a segunda-feira da semana atual) é processada ENTÃO o sistema SHALL exibir 0h ou marcar como skip, não exibindo dados fictícios

#### Bug 3: Campo de Busca na Linha dos Indicadores

2.3 QUANDO a página de colaboradores é carregada ENTÃO o sistema SHALL exibir o campo de busca na linha 2 (linha dos indicadores) à direita, e o texto "Clique em um card..." SHALL aparecer na linha 1 onde o campo de busca estava

#### Bug 4: Formato de Horas com Zero à Esquerda

2.4 QUANDO horas são formatadas para exibição ENTÃO o sistema SHALL exibir sempre no formato HH:MM com 2 dígitos (ex: "01:54", "10:30")

#### Bug 5: Calendário com Número da Semana

2.5 QUANDO o calendário mensal é exibido ENTÃO o sistema SHALL mostrar "Sem 1", "Sem 2", etc. à esquerda de cada linha do calendário usando numeração ISO 8601

#### Bug 6: Calendário Destaca Semana Inteira

2.6 QUANDO o usuário clica em um dia no calendário ENTÃO o sistema SHALL destacar visualmente toda a semana (segunda a domingo) usando o mesmo estilo visual do dia "hoje"

### Unchanged Behavior (Regression Prevention)

#### Preservação da Funcionalidade do Heatmap

3.1 QUANDO o heatmap é exibido com as correções do Bug 1 ENTÃO o sistema SHALL CONTINUE TO exibir as células de horas, percentuais e cores corretamente

3.2 QUANDO semanas passadas (antes da semana atual) são processadas ENTÃO o sistema SHALL CONTINUE TO calcular e exibir horas corretamente conforme a lógica existente

#### Preservação da Funcionalidade de Busca

3.3 QUANDO o campo de busca é reposicionado (Bug 3) ENTÃO o sistema SHALL CONTINUE TO filtrar colaboradores corretamente ao digitar

#### Preservação da Formatação de Dados

3.4 QUANDO a função fmtHoras é corrigida (Bug 4) ENTÃO o sistema SHALL CONTINUE TO converter corretamente horas decimais para formato HH:MM

3.5 QUANDO horas com minutos zero são formatadas (ex: 8.0 horas) ENTÃO o sistema SHALL CONTINUE TO exibir "08:00" corretamente

#### Preservação da Funcionalidade do Calendário

3.6 QUANDO o calendário é exibido com números de semana (Bug 5) ENTÃO o sistema SHALL CONTINUE TO exibir dias, meses e navegação corretamente

3.7 QUANDO um dia é clicado no calendário (Bug 6) ENTÃO o sistema SHALL CONTINUE TO exibir o painel de detalhes com colaboradores e horas da semana

3.8 QUANDO o usuário navega entre meses no calendário ENTÃO o sistema SHALL CONTINUE TO atualizar a grade de dias corretamente

#### Preservação da Lógica de Negócio

3.9 QUANDO dados são processados pelo dashboardService ENTÃO o sistema SHALL CONTINUE TO aplicar regras de carnaval, folgas e redistribuição corretamente

3.10 QUANDO colaboradores são ordenados no dashboard ENTÃO o sistema SHALL CONTINUE TO permitir ordenação por %, horas e nome
