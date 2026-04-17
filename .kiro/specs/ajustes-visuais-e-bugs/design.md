# Design de Bugfix: Ajustes Visuais e Bugs

## Visão Geral

Este documento formaliza o design para correção de 6 bugs identificados no dashboard ClockView. Os problemas abrangem três categorias principais:

1. **Apresentação de dados**: Nomes quebrados em múltiplas linhas e formato de horas inconsistente
2. **Lógica de filtragem**: Semanas futuras exibindo dados incorretos
3. **Usabilidade**: Layout inadequado do campo de busca e falta de indicadores visuais no calendário

As correções garantirão que a interface apresente informações precisas, consistentes e com melhor experiência do usuário.

## Glossário

- **Bug_Condition (C)**: A condição que desencadeia cada um dos 6 bugs identificados
- **Property (P)**: O comportamento desejado após a correção de cada bug
- **Preservation**: Funcionalidades existentes que devem permanecer inalteradas pelas correções
- **fmtHoras**: Função em `app/lib/utils.ts` que converte horas decimais para formato HH:MM
- **numeroSemanaISO**: Função em `app/lib/utils.ts` que calcula o número da semana ISO 8601
- **intervaloSemanaISO**: Função em `app/lib/utils.ts` que retorna início e fim de uma semana ISO 8601
- **segundaFeiraAtual**: Variável em `services/dashboardService.ts` que representa a segunda-feira da semana atual
- **semanasVisiveis**: Array em `app/dashboard/page.tsx` que contém semanas com pelo menos 1 dado real

## Detalhes dos Bugs

### Bug 1: Nome do Colaborador Quebrado na Tabela

**Condição do Bug:**

O nome do colaborador é exibido usando dois elementos `<div>` separados com classes CSS diferentes (`cv-name-first` e `cv-name-last`), causando quebra de linha e estilos inconsistentes.

**Especificação Formal:**

```
FUNCTION isBugCondition1(input)
  INPUT: input contendo { nomeColaborador: string, componenteRenderizado: ReactElement }
  OUTPUT: boolean

  RETURN componenteRenderizado.contains(<div className="cv-name-first">)
         AND componenteRenderizado.contains(<div className="cv-name-last">)
         AND nomeColaborador.split(/\s+/).length > 1
END FUNCTION
```

**Exemplos:**

- Nome "Leomyr Sângelo" é exibido como "Leomyr" em uma linha e "Sângelo" em outra
- Nome "Cristina Oliveira" é exibido como "Cristina" em uma linha e "Oliveira" em outra
- Esperado: "Leomyr Sângelo" em uma única linha com estilo consistente

### Bug 2: Semanas Futuras com Dados Incorretos

**Condição do Bug:**

O sistema processa semanas futuras (após `segundaFeiraAtual`) e exibe horas registradas mesmo quando não há dados reais. Isso ocorre porque a lógica de filtragem no `dashboardService.ts` marca semanas futuras como `skip: true`, mas não impede que dados sejam acumulados antes dessa verificação.

**Especificação Formal:**

```
FUNCTION isBugCondition2(input)
  INPUT: input contendo { semana: string, segundaFeiraAtual: string, horasExibidas: number }
  OUTPUT: boolean

  RETURN semana > segundaFeiraAtual
         AND horasExibidas > 0
END FUNCTION
```

**Exemplos:**

- Semana "2025-04-21" (semana 17) com 40h exibidas quando `segundaFeiraAtual` é "2025-04-14"
- Semana "2025-05-05" com 32h exibidas quando `segundaFeiraAtual` é "2025-04-14"
- Esperado: Semanas futuras devem ter `skip: true` e `horas: 0`

### Bug 3: Campo de Busca em Posição Incorreta

**Condição do Bug:**

O campo de busca está posicionado na linha 1 da legenda (junto com as cores do heatmap), e o texto "Clique em um card..." aparece na linha 2 (junto com os indicadores). A estrutura atual usa `justifyContent: "space-between"` na linha 1, empurrando o campo de busca para a direita.

**Especificação Formal:**

```
FUNCTION isBugCondition3(input)
  INPUT: input contendo { campoBuscaLinha: number, textoCliqueEmUmCardLinha: number }
  OUTPUT: boolean

  RETURN campoBuscaLinha === 1
         AND textoCliqueEmUmCardLinha === 2
END FUNCTION
```

**Exemplos:**

- Linha 1: [Cores do heatmap] ... [Campo de busca]
- Linha 2: [Indicadores] ... [Texto "Clique em um card..."]
- Esperado:
  - Linha 1: [Cores do heatmap] ... [Texto "Clique em um card..."]
  - Linha 2: [Indicadores] ... [Campo de busca]

### Bug 4: Formato de Horas Inconsistente

**Condição do Bug:**

A função `fmtHoras` não adiciona zero à esquerda quando a parte inteira das horas é menor que 10, resultando em formato inconsistente como "1:54" em vez de "01:54".

**Especificação Formal:**

```
FUNCTION isBugCondition4(input)
  INPUT: input contendo { horas: number }
  OUTPUT: boolean

  LET h = Math.floor(horas)
  LET resultado = fmtHoras(horas)

  RETURN h < 10
         AND NOT resultado.startsWith("0")
END FUNCTION
```

**Exemplos:**

- `fmtHoras(1.9)` retorna "1:54" (incorreto)
- `fmtHoras(8.5)` retorna "8:30" (incorreto)
- Esperado: "01:54" e "08:30" respectivamente

### Bug 5: Calendário Sem Número da Semana

**Condição do Bug:**

O calendário mensal não exibe o número da semana ISO 8601 à esquerda de cada linha, dificultando a correlação com os dados do heatmap que usa numeração de semanas.

**Especificação Formal:**

```
FUNCTION isBugCondition5(input)
  INPUT: input contendo { calendarioRenderizado: ReactElement }
  OUTPUT: boolean

  RETURN NOT calendarioRenderizado.contains("Sem 1")
         AND NOT calendarioRenderizado.contains("Sem 2")
         AND NOT calendarioRenderizado.contains(numeroSemanaISO)
END FUNCTION
```

**Exemplos:**

- Calendário exibe apenas dias do mês sem indicação de número da semana
- Esperado: Coluna à esquerda com "Sem 1", "Sem 2", etc. para cada linha de 7 dias

### Bug 6: Calendário Não Destaca Semana Inteira

**Condição do Bug:**

Quando o usuário clica em um dia, apenas aquele dia específico recebe a classe `selected`, não destacando visualmente toda a semana (segunda a domingo) correspondente.

**Especificação Formal:**

```
FUNCTION isBugCondition6(input)
  INPUT: input contendo { diaSelecionado: string, diasComClasseSelected: string[] }
  OUTPUT: boolean

  LET { inicio, fim } = intervaloSemanaISO(diaSelecionado)
  LET diasDaSemana = gerarArrayDeDias(inicio, fim)

  RETURN diasComClasseSelected.length === 1
         AND diasComClasseSelected[0] === diaSelecionado
         AND diasDaSemana.length === 7
END FUNCTION
```

**Exemplos:**

- Usuário clica em "2025-04-15" (terça-feira)
- Apenas "2025-04-15" recebe destaque visual
- Esperado: Todos os dias de "2025-04-14" (segunda) a "2025-04-20" (domingo) devem ser destacados

## Comportamento Esperado

### Requisitos de Preservação

**Comportamentos Inalterados:**

- Funcionalidade do heatmap (células, percentuais, cores) deve continuar funcionando corretamente
- Cálculo de horas para semanas passadas deve permanecer inalterado
- Filtragem de colaboradores por busca deve continuar funcionando
- Conversão de horas decimais para HH:MM deve manter precisão
- Navegação entre meses no calendário deve continuar funcionando
- Painel de detalhes do calendário deve continuar exibindo colaboradores e horas
- Regras de negócio (carnaval, folgas, redistribuição) devem permanecer inalteradas
- Ordenação de colaboradores (%, horas, nome) deve continuar funcionando

**Escopo:**
Todas as funcionalidades que NÃO envolvem os 6 bugs específicos devem permanecer completamente inalteradas.

## Causas Raízes Hipotéticas

### Bug 1: Nome Quebrado

**Causa Raiz:**
O código em `app/dashboard/page.tsx` (linhas ~120-130) divide o nome do colaborador em partes e renderiza cada parte em um `<div>` separado:

```typescript
const partes = colab.nome.trim().split(/\s+/);
// ...
<div className="cv-name-first">{partes[0]}</div>
{partes.length > 1 && (
  <div className="cv-name-last">{trunc(partes.slice(1).join(" "), 18)}</div>
)}
```

Isso causa quebra de linha porque cada `<div>` é um elemento de bloco.

### Bug 2: Semanas Futuras

**Causa Raiz:**
Em `services/dashboardService.ts` (linhas ~150-170), a lógica marca semanas futuras como `skip: true`, mas isso acontece DEPOIS que os dados já foram acumulados no loop de processamento de entradas. A verificação `s > segundaFeiraAtual` ocorre tarde demais no fluxo.

```typescript
for (const s of todasSemanas) {
  if (s < primeiraSemana || s > segundaFeiraAtual) {
    semanasOrdenadas.push({ semana: s, ..., skip: true });
    continue;
  }
  // Processa dados...
}
```

O problema é que `todasSemanas` já contém semanas futuras coletadas do loop de entradas.

### Bug 3: Campo de Busca

**Causa Raiz:**
Em `app/colaboradores/page.tsx` (linhas ~30-60), o campo de busca está dentro da primeira `<div>` que usa `justifyContent: "space-between"`, colocando-o na linha 1. O texto "Clique em um card..." está na linha 2 com os indicadores.

```typescript
<div style={{ display: "flex", ..., justifyContent: "space-between" }}>
  <div>{/* Cores do heatmap */}</div>
  <div>{/* Campo de busca */}</div>
</div>
<div>{/* Indicadores + texto */}</div>
```

### Bug 4: Formato de Horas

**Causa Raiz:**
A função `fmtHoras` em `app/lib/utils.ts` (linha ~40) não usa `padStart` para a parte das horas:

```typescript
export function fmtHoras(horas: number): string {
  const h = Math.floor(horas);
  const m = Math.round((horas - h) * 60);
  return `${h}:${String(m).padStart(2, "0")}`;
}
```

Apenas os minutos recebem `padStart(2, "0")`, mas as horas não.

### Bug 5: Número da Semana

**Causa Raiz:**
O componente `app/calendario/page.tsx` não renderiza uma coluna de números de semana. A grade do calendário (`cv-cal-grid`) contém apenas os dias da semana e as células de dias, sem uma coluna adicional para números de semana.

### Bug 6: Destaque de Semana

**Causa Raiz:**
Em `app/calendario/page.tsx` (linhas ~100-120), a lógica de seleção compara apenas `diaSelecionado === cel.dataStr`:

```typescript
const selecionado = diaSelecionado === cel.dataStr;
```

Não há verificação se o dia pertence à mesma semana do dia selecionado.

## Propriedades de Correção

Property 1: Bug Condition 1 - Nome Completo na Mesma Linha

_Para qualquer_ colaborador cujo nome é exibido na tabela do heatmap, o sistema corrigido SHALL exibir o nome completo (primeiro nome e sobrenome) em uma única linha com estilo visual consistente, sem quebras de linha entre as partes do nome.

**Valida: Requisitos 2.1**

Property 2: Bug Condition 2 - Semanas Futuras com 0h

_Para qualquer_ semana cuja data é posterior à segunda-feira da semana atual, o sistema corrigido SHALL exibir 0h ou marcar como skip, não exibindo dados fictícios ou acumulados incorretamente.

**Valida: Requisitos 2.2**

Property 3: Bug Condition 3 - Campo de Busca Reposicionado

_Para qualquer_ renderização da página de colaboradores, o sistema corrigido SHALL exibir o campo de busca na linha 2 (linha dos indicadores) à direita, e o texto "Clique em um card..." SHALL aparecer na linha 1 (linha das cores do heatmap) à direita.

**Valida: Requisitos 2.3**

Property 4: Bug Condition 4 - Formato HH:MM Consistente

_Para qualquer_ valor de horas decimais formatado pela função fmtHoras, o sistema corrigido SHALL exibir sempre no formato HH:MM com 2 dígitos para horas e 2 dígitos para minutos (ex: "01:54", "10:30", "08:00").

**Valida: Requisitos 2.4**

Property 5: Bug Condition 5 - Números de Semana no Calendário

_Para qualquer_ renderização do calendário mensal, o sistema corrigido SHALL exibir o número da semana ISO 8601 (formato "Sem N") à esquerda de cada linha de 7 dias do calendário.

**Valida: Requisitos 2.5**

Property 6: Bug Condition 6 - Destaque de Semana Completa

_Para qualquer_ dia clicado no calendário, o sistema corrigido SHALL destacar visualmente todos os 7 dias da semana correspondente (segunda a domingo) usando o mesmo estilo visual aplicado ao dia "hoje".

**Valida: Requisitos 2.6**

Property 7: Preservation - Funcionalidades Existentes

_Para qualquer_ funcionalidade que NÃO envolve os 6 bugs específicos, o sistema corrigido SHALL produzir exatamente o mesmo comportamento do sistema original, preservando heatmap, busca, formatação de dados, navegação, painel de detalhes, regras de negócio e ordenação.

**Valida: Requisitos 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10**

## Implementação da Correção

### Mudanças Necessárias

Assumindo que nossa análise de causa raiz está correta:

**Arquivo**: `app/dashboard/page.tsx`

**Função**: Renderização do nome do colaborador na linha do heatmap

**Mudanças Específicas**:

1. **Remover divisão do nome em múltiplos divs**: Substituir a estrutura atual que divide `partes[0]` e `partes.slice(1)` por um único elemento que exibe `colab.nome` completo
2. **Manter truncamento se necessário**: Aplicar `trunc()` ao nome completo se exceder o espaço disponível
3. **Preservar avatar e estrutura de layout**: Manter o `cv-avatar` e o container pai inalterados

---

**Arquivo**: `services/dashboardService.ts`

**Função**: `processarDashboard` - loop de processamento de semanas

**Mudanças Específicas**:

1. **Filtrar semanas futuras antes do processamento**: Adicionar verificação `s <= segundaFeiraAtual` ao coletar `todasSemanasSet`
2. **Alternativa**: Filtrar entradas de tempo antes do loop, descartando entradas com `semana > segundaFeiraAtual`
3. **Garantir consistência**: Verificar que `todasSemanas` não contém semanas futuras antes de iniciar o loop de colaboradores

---

**Arquivo**: `app/colaboradores/page.tsx`

**Função**: Renderização da legenda e campo de busca

**Mudanças Específicas**:

1. **Mover campo de busca para linha 2**: Remover o campo de busca da primeira `<div>` (linha das cores)
2. **Mover texto "Clique em um card..." para linha 1**: Adicionar o texto na primeira `<div>` onde o campo de busca estava
3. **Adicionar campo de busca na linha 2**: Inserir o campo de busca na segunda `<div>` (linha dos indicadores) usando `marginLeft: "auto"` para alinhamento à direita
4. **Ajustar espaçamento**: Garantir que o layout permaneça visualmente equilibrado

---

**Arquivo**: `app/lib/utils.ts`

**Função**: `fmtHoras`

**Mudanças Específicas**:

1. **Adicionar padStart para horas**: Modificar `return` para usar `String(h).padStart(2, "0")` em vez de apenas `${h}`
2. **Manter lógica de minutos**: Preservar `String(m).padStart(2, "0")` que já está correto
3. **Resultado**: `return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}``

---

**Arquivo**: `app/calendario/page.tsx`

**Função**: Renderização da grade do calendário

**Mudanças Específicas Bug 5**:

1. **Adicionar coluna de números de semana**: Criar uma nova estrutura de layout que inclua uma coluna à esquerda para números de semana
2. **Calcular número da semana para cada linha**: Para cada linha de 7 dias, calcular o número da semana ISO 8601 do primeiro dia (segunda-feira)
3. **Renderizar "Sem N"**: Exibir o número da semana em formato compacto à esquerda de cada linha
4. **Ajustar grid layout**: Modificar `cv-cal-grid` para acomodar a nova coluna sem quebrar o layout existente

**Mudanças Específicas Bug 6**:

1. **Calcular intervalo da semana selecionada**: Quando `diaSelecionado` muda, usar `intervaloSemanaISO(diaSelecionado)` para obter início e fim
2. **Verificar se dia pertence à semana**: Na renderização de cada célula, verificar se `cel.dataStr >= inicio && cel.dataStr <= fim`
3. **Aplicar classe de destaque**: Adicionar classe `selected` ou similar a todos os dias da semana, não apenas ao dia clicado
4. **Manter comportamento do painel**: Preservar a lógica que abre o painel de detalhes ao clicar em um dia

## Estratégia de Testes

### Abordagem de Validação

A estratégia de testes segue uma abordagem de duas fases: primeiro, demonstrar os bugs no código não corrigido através de testes exploratórios, depois verificar que as correções funcionam corretamente e preservam o comportamento existente.

### Verificação Exploratória de Condições de Bug

**Objetivo**: Demonstrar os bugs ANTES de implementar as correções. Confirmar ou refutar a análise de causa raiz. Se refutarmos, será necessário re-hipotizar.

**Plano de Testes**: Criar testes que verificam o comportamento atual (bugado) e documentam os contraexemplos.

**Casos de Teste**:

1. **Teste Bug 1 - Nome Quebrado**: Renderizar componente Dashboard com colaborador "Leomyr Sângelo" e verificar que existem dois elementos `<div>` separados (falhará no código não corrigido)

2. **Teste Bug 2 - Semanas Futuras**: Processar dados com `endDate` definido para uma data passada e verificar que semanas futuras têm `horas > 0` (falhará no código não corrigido)

3. **Teste Bug 3 - Campo de Busca**: Renderizar página de colaboradores e verificar que o campo de busca está na linha 1 (falhará no código não corrigido)

4. **Teste Bug 4 - Formato de Horas**: Chamar `fmtHoras(1.9)` e verificar que retorna "1:54" sem zero à esquerda (falhará no código não corrigido)

5. **Teste Bug 5 - Números de Semana**: Renderizar calendário e verificar que não existem elementos com texto "Sem 1", "Sem 2", etc. (falhará no código não corrigido)

6. **Teste Bug 6 - Destaque de Semana**: Clicar em um dia e verificar que apenas 1 dia recebe classe `selected` (falhará no código não corrigido)

**Contraexemplos Esperados**:

- Bug 1: Dois elementos `<div>` com classes diferentes para o mesmo nome
- Bug 2: Semanas futuras com `horas: 40` quando deveriam ter `horas: 0`
- Bug 3: Campo de busca na posição incorreta (linha 1 em vez de linha 2)
- Bug 4: Formato "1:54" em vez de "01:54"
- Bug 5: Ausência de números de semana no calendário
- Bug 6: Apenas 1 dia destacado em vez de 7 dias da semana

### Verificação de Correção

**Objetivo**: Verificar que para todas as entradas onde a condição de bug se aplica, o sistema corrigido produz o comportamento esperado.

**Pseudocódigo**:

```
FOR ALL input WHERE isBugCondition1(input) DO
  result := renderizarNomeColaborador_corrigido(input)
  ASSERT nomeCompletoEmUmaLinha(result)
END FOR

FOR ALL input WHERE isBugCondition2(input) DO
  result := processarDashboard_corrigido(input)
  ASSERT semanasFuturasComZeroHoras(result)
END FOR

FOR ALL input WHERE isBugCondition3(input) DO
  result := renderizarPaginaColaboradores_corrigido(input)
  ASSERT campoBuscaNaLinha2(result)
END FOR

FOR ALL input WHERE isBugCondition4(input) DO
  result := fmtHoras_corrigido(input)
  ASSERT formatoHHMM(result)
END FOR

FOR ALL input WHERE isBugCondition5(input) DO
  result := renderizarCalendario_corrigido(input)
  ASSERT numerosSemanaVisiveis(result)
END FOR

FOR ALL input WHERE isBugCondition6(input) DO
  result := clicarDiaCalendario_corrigido(input)
  ASSERT semanaCompletaDestacada(result)
END FOR
```

### Verificação de Preservação

**Objetivo**: Verificar que para todas as entradas onde a condição de bug NÃO se aplica, o sistema corrigido produz o mesmo resultado que o sistema original.

**Pseudocódigo**:

```
FOR ALL input WHERE NOT isBugCondition1(input) AND NOT isBugCondition2(input) AND ... DO
  ASSERT sistemaOriginal(input) = sistemaCorrigido(input)
END FOR
```

**Abordagem de Testes**: Testes baseados em propriedades são recomendados para verificação de preservação porque:

- Geram muitos casos de teste automaticamente em todo o domínio de entrada
- Capturam casos extremos que testes unitários manuais podem perder
- Fornecem garantias fortes de que o comportamento permanece inalterado para todas as entradas não afetadas pelos bugs

**Plano de Testes**: Observar comportamento no código NÃO CORRIGIDO primeiro para entradas não afetadas pelos bugs, depois escrever testes baseados em propriedades capturando esse comportamento.

**Casos de Teste**:

1. **Preservação do Heatmap**: Verificar que células, cores e percentuais continuam sendo calculados corretamente após correção do Bug 1

2. **Preservação de Semanas Passadas**: Verificar que semanas anteriores à semana atual continuam sendo processadas corretamente após correção do Bug 2

3. **Preservação da Busca**: Verificar que a filtragem de colaboradores continua funcionando após correção do Bug 3

4. **Preservação de Conversão de Horas**: Verificar que horas com minutos zero (ex: 8.0) continuam sendo formatadas como "08:00" após correção do Bug 4

5. **Preservação de Navegação do Calendário**: Verificar que navegação entre meses continua funcionando após correções dos Bugs 5 e 6

6. **Preservação do Painel de Detalhes**: Verificar que o painel lateral continua exibindo dados corretos após correção do Bug 6

### Testes Unitários

- Testar `fmtHoras` com valores de 0 a 100 horas, verificando formato HH:MM consistente
- Testar renderização de nomes com 1, 2, 3+ palavras
- Testar filtragem de semanas futuras com diferentes datas de `endDate`
- Testar cálculo de intervalo de semana ISO 8601 para diferentes datas
- Testar posicionamento de elementos na página de colaboradores
- Testar cálculo de números de semana para diferentes meses e anos

### Testes Baseados em Propriedades

- Gerar nomes aleatórios de colaboradores e verificar que sempre são exibidos em uma linha
- Gerar datas aleatórias e verificar que semanas futuras sempre têm `horas: 0`
- Gerar valores aleatórios de horas (0-200) e verificar que formato sempre é HH:MM com 2 dígitos
- Gerar datas aleatórias e verificar que números de semana ISO 8601 são calculados corretamente
- Gerar cliques aleatórios em dias do calendário e verificar que sempre 7 dias são destacados

### Testes de Integração

- Testar fluxo completo do dashboard com dados reais, verificando que todas as 6 correções funcionam em conjunto
- Testar navegação entre páginas (Dashboard → Colaboradores → Calendário) verificando consistência visual
- Testar interação usuário completa: buscar colaborador, clicar no heatmap, visualizar detalhes, navegar para calendário, clicar em dia
- Testar com diferentes tamanhos de tela e resoluções para garantir que layout permanece funcional
