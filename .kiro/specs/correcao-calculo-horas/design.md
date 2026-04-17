# Design de Correção - Bugs no Cálculo de Horas

## Visão Geral

Este documento formaliza a análise e correção de três bugs críticos no dashboard de horas da SETEG:

1. **Bug 1 (Visual)**: Nome do colaborador aparece separado em linhas diferentes no painel lateral
2. **Bug 2 (CRÍTICO)**: Sistema exibe horas para semanas futuras que ainda não começaram (ex: Cristina com 40h)
3. **Bug 3 (CRÍTICO)**: Divergência entre dados do dashboard e Clockify (ex: Carina)

A estratégia de correção é cirúrgica e focada: corrigir apenas o comportamento defeituoso sem alterar a lógica de negócio existente (redistribuição de folgas, carnaval automático, categorização).

## Glossário

- **Bug_Condition (C)**: A condição que identifica quando cada bug se manifesta
- **Property (P)**: O comportamento correto esperado quando a condição do bug ocorre
- **Preservation**: Funcionalidades existentes que devem permanecer inalteradas pela correção
- **dashboardService.ts**: Serviço principal em `services/dashboardService.ts` que processa dados do Clockify
- **PainelDetalhes.tsx**: Componente React em `app/components/PainelDetalhes.tsx` que exibe detalhes do colaborador
- **getSemana()**: Função em `lib/businessRules.ts` que retorna a segunda-feira (formato ISO) de uma data
- **parseDuration()**: Função em `lib/durationParser.ts` que converte duração ISO 8601 para horas decimais
- **Semana futura**: Semana cuja segunda-feira é posterior à data atual

## Detalhes dos Bugs

### Bug 1: Nome do Colaborador Separado

**Manifestação**: No painel lateral de detalhes (`PainelDetalhes.tsx`), o nome completo do colaborador aparece quebrado em múltiplas linhas, separando nome e sobrenome.

**Condição do Bug:**

```
FUNCTION isBugCondition_Bug1(input)
  INPUT: input of type { nomeColaborador: string, elementoDOM: HTMLElement }
  OUTPUT: boolean

  RETURN input.nomeColaborador.length > 0
         AND elementoDOM.style.whiteSpace != "nowrap"
         AND nomeApareceSeparado(elementoDOM)
END FUNCTION
```

**Exemplos:**

- **Entrada**: Nome "Leomyr Sângelo" renderizado no painel lateral
- **Comportamento Atual (Defeituoso)**: "Leomyr" aparece em uma linha, "Sângelo" em outra
- **Comportamento Esperado**: "Leomyr Sângelo" aparece em uma única linha

### Bug 2: Horas em Semanas Futuras (CRÍTICO)

**Manifestação**: O sistema exibe horas totais para semanas que ainda não começaram. Exemplo: Cristina aparece com 40h em uma semana futura, mas ao clicar no painel de detalhes, não há projetos com horas registradas.

**Condição do Bug:**

```
FUNCTION isBugCondition_Bug2(input)
  INPUT: input of type { semana: string, dataAtual: string, horasExibidas: number }
  OUTPUT: boolean

  RETURN semana > dataAtual  // semana futura
         AND horasExibidas > 0
         AND naoExistemEntradasReaisNoClockify(semana)
END FUNCTION
```

**Exemplos:**

- **Entrada**: Semana "2025-01-27" (segunda-feira), data atual "2025-01-22" (quarta-feira)
- **Comportamento Atual (Defeituoso)**: Dashboard exibe 40h para Cristina na semana futura
- **Comportamento Esperado**: Dashboard exibe 0h ou marca como skip para semanas futuras

**Causa Raiz Hipotética**: O sistema está incluindo semanas futuras no cálculo mesmo sem dados reais do Clockify, possivelmente devido a:

- Lógica de preenchimento de semanas que não verifica se a semana já começou
- Redistribuição de folgas ou carnaval automático aplicados a semanas futuras
- Geração de array `todasSemanas` que inclui semanas além da data atual

### Bug 3: Divergência com Dados do Clockify (CRÍTICO)

**Manifestação**: Os valores de horas totais exibidos no dashboard não correspondem aos dados registrados no Clockify. Exemplo: dados de Carina não batem com o Clockify.

**Condição do Bug:**

```
FUNCTION isBugCondition_Bug3(input)
  INPUT: input of type {
    colaborador: string,
    horasDashboard: number,
    horasClockify: number
  }
  OUTPUT: boolean

  RETURN abs(horasDashboard - horasClockify) > 0.1  // tolerância de 0.1h
         AND colaboradorTemEntradasNoClockify(colaborador)
END FUNCTION
```

**Exemplos:**

- **Entrada**: Carina tem X horas no Clockify para uma semana específica
- **Comportamento Atual (Defeituoso)**: Dashboard exibe Y horas (Y ≠ X)
- **Comportamento Esperado**: Dashboard exibe exatamente X horas

**Causa Raiz Hipotética**: Possíveis fontes de divergência:

1. **Erro no parsing de duração**: `parseDuration()` pode estar convertendo incorretamente durações ISO 8601
2. **Arredondamento prematuro**: Arredondamentos intermediários acumulam erros
3. **Filtro de entradas incorreto**: Entradas válidas sendo excluídas ou entradas inválidas sendo incluídas
4. **Lógica de redistribuição de folgas**: Dedução incorreta de horas em semanas anteriores
5. **Carnaval automático**: Adição de 24h quando não deveria ou vice-versa
6. **Timezone/data**: Entradas sendo atribuídas à semana errada devido a problemas de timezone

## Comportamento Esperado

### Correção Bug 1: Nome em Uma Linha

_Para qualquer_ nome de colaborador renderizado no painel lateral, o componente `PainelDetalhes.tsx` DEVE exibir o nome completo em uma única linha, sem quebras, mantendo a mesma cor e destaque visual.

### Correção Bug 2: Apenas Semanas com Dados Reais

_Para qualquer_ semana cuja segunda-feira é posterior à data atual (semana futura), o sistema DEVE:

- Exibir 0 horas OU marcar como `skip: true`
- Não aplicar redistribuição de folgas
- Não aplicar carnaval automático
- Não incluir a semana no cálculo de médias

### Correção Bug 3: Dados Exatos do Clockify

_Para qualquer_ colaborador com entradas no Clockify, o dashboard DEVE exibir valores de horas que correspondem EXATAMENTE aos dados do Clockify, com precisão de até 0.1h (6 minutos).

### Requisitos de Preservação

**Comportamentos Inalterados:**

- Redistribuição de folgas para semanas anteriores (apenas em semanas passadas)
- Carnaval automático de 24h na semana de carnaval (apenas se a semana já passou)
- Classificação de entradas (work, folga, carnaval, absence)
- Categorização de atividades (campo, reunião, escritório, gerenciamento)
- Cálculo de médias e percentuais baseados na meta semanal
- Filtro por período (início/fim)
- Cache em memória
- Exibição de categorias e projetos no painel lateral
- Top 3 atividades por projeto

**Escopo:**
Todas as semanas passadas (com segunda-feira ≤ data atual) devem continuar sendo processadas exatamente como antes. A correção afeta APENAS:

- Bug 1: Renderização do nome no componente React
- Bug 2: Inclusão de semanas futuras no processamento
- Bug 3: Precisão dos cálculos de horas

## Causa Raiz Hipotética

### Bug 1: Nome Separado

**Análise do Código:**

```tsx
// PainelDetalhes.tsx, linha ~50
<div
  style={{
    fontSize: 16,
    fontWeight: 700,
    color: "#1e293b",
    marginTop: 2,
    whiteSpace: "nowrap", // ✅ JÁ EXISTE!
    overflow: "hidden",
    textOverflow: "ellipsis",
  }}
>
  {colaborador.nome}
</div>
```

**Causa Raiz Identificada:**
O código JÁ possui `whiteSpace: "nowrap"`, então o problema pode ser:

1. **CSS conflitante**: Alguma regra CSS global está sobrescrevendo o `whiteSpace`
2. **Largura insuficiente**: O container pai está forçando quebra de linha
3. **Caracteres especiais**: Espaços não-quebráveis ou caracteres invisíveis no nome

**Hipótese Principal**: CSS conflitante ou container pai sem `minWidth: 0` causando overflow incorreto.

### Bug 2: Horas em Semanas Futuras

**Análise do Código:**

```typescript
// dashboardService.ts, linha ~150
// Coleta todas as semanas disponíveis
const todasSemanasSet = new Set<string>();
for (const semanas of Array.from(raw.values())) {
  for (const s of Array.from(semanas.keys())) todasSemanasSet.add(s);
}
const todasSemanas = Array.from(todasSemanasSet).sort();
```

**Causa Raiz Identificada:**
O sistema coleta TODAS as semanas que aparecem nas entradas do Clockify, sem verificar se são futuras. Depois, para cada colaborador:

```typescript
// linha ~165
for (const s of todasSemanas) {
  if (s < primeiraSemana) {
    semanasOrdenadas.push({ semana: s, ..., skip: true, ... });
    continue;
  }
  const b = semanas.get(s) ?? novoBucket();
  // ... processa a semana mesmo que seja futura
}
```

**Problema**: O código marca como `skip: true` apenas semanas ANTES da primeira semana com dados, mas não verifica se a semana é FUTURA em relação à data atual.

**Cenário do Bug:**

1. Clockify retorna entradas com `timeInterval.start` em semanas futuras (possível se alguém criou entradas agendadas)
2. `getSemana()` calcula a segunda-feira dessas entradas futuras
3. Sistema processa essas semanas normalmente, aplicando redistribuição e carnaval automático
4. Resultado: Cristina aparece com 40h em uma semana que nem começou

### Bug 3: Divergência com Clockify

**Análise do Código:**

**Possível Causa 1 - Parsing de Duração:**

```typescript
// durationParser.ts
const REGEX_DURACAO =
  /^PT(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?$/;
```

✅ Regex parece correto para ISO 8601.

**Possível Causa 2 - Arredondamento:**

```typescript
// dashboardService.ts, linha ~230
const horas = s.skip ? 0 : Math.round(s.effective * 10) / 10;
```

⚠️ Arredondamento para 1 casa decimal pode acumular erros ao longo de múltiplas semanas.

**Possível Causa 3 - Redistribuição de Folgas:**

```typescript
// linha ~220
// Redistribuição de folgas para semanas anteriores
for (let i = 0; i < semanasOrdenadas.length; i++) {
  const s = semanasOrdenadas[i];
  if (s.skip || s.folga <= 0) continue;
  s.effective += s.folga; // ⚠️ Adiciona folga à semana atual
  let restante = s.folga;
  for (let j = i - 1; j >= 0 && restante > 0; j--) {
    const prev = semanasOrdenadas[j];
    if (prev.skip) continue;
    const excesso = Math.max(0, prev.effective - meta);
    if (excesso > 0) {
      const deduzir = Math.min(excesso, restante);
      prev.effective -= deduzir; // ⚠️ Deduz de semanas anteriores
      restante -= deduzir;
    }
  }
}
```

**Problema Identificado**: A redistribuição de folgas MODIFICA os valores de `effective`, fazendo com que as horas exibidas no dashboard sejam DIFERENTES das horas reais do Clockify. Isso é INTENCIONAL segundo a lógica de negócio, mas pode estar causando divergências se:

- A lógica está sendo aplicada incorretamente
- O usuário está comparando com o Clockify sem considerar a redistribuição
- A redistribuição está sendo aplicada a semanas futuras (relacionado ao Bug 2)

**Possível Causa 4 - Carnaval Automático:**

```typescript
// linha ~210
for (const s of semanasOrdenadas) {
  if (s.semana !== CARNAVAL_WEEK || s.skip) continue;
  const temCarnaval = s.carnaval > 0 || s.absence >= 16;
  if (!temCarnaval && s.work < 24) {
    s.effective += CARNAVAL_HOURS; // ⚠️ Adiciona 24h
    s.carnavalAuto = true;
  }
}
```

**Problema**: Se a semana de carnaval for futura, o sistema ainda adiciona 24h automaticamente.

**Hipótese Principal para Bug 3:**
A divergência é causada pela **combinação de redistribuição de folgas e carnaval automático sendo aplicados a semanas futuras** (Bug 2), resultando em valores que não existem no Clockify.

## Propriedades de Correção

Property 1: Bug Condition - Nome do Colaborador em Uma Linha

_Para qualquer_ renderização do nome do colaborador no painel lateral de detalhes, o componente DEVE exibir o nome completo em uma única linha sem quebras, preservando a formatação visual (cor, peso, tamanho).

**Valida: Requisitos 2.1, 2.2**

Property 2: Bug Condition - Semanas Futuras Sem Horas

_Para qualquer_ semana cuja segunda-feira é posterior à data atual (semana futura), o sistema DEVE exibir 0 horas ou marcar como skip, e NÃO DEVE aplicar redistribuição de folgas ou carnaval automático a essa semana.

**Valida: Requisitos 2.3, 2.4, 2.5**

Property 3: Bug Condition - Precisão dos Dados do Clockify

_Para qualquer_ colaborador com entradas no Clockify em semanas passadas (segunda-feira ≤ data atual), o dashboard DEVE exibir valores de horas que correspondem aos dados do Clockify com precisão de até 0.1h, considerando as regras de negócio (redistribuição e carnaval automático aplicadas apenas a semanas passadas).

**Valida: Requisitos 2.6, 2.7, 2.8**

Property 4: Preservation - Lógica de Negócio em Semanas Passadas

_Para qualquer_ semana passada (segunda-feira ≤ data atual) com dados reais do Clockify, o código corrigido DEVE produzir exatamente o mesmo resultado que o código original, preservando redistribuição de folgas, carnaval automático, categorização e todos os cálculos existentes.

**Valida: Requisitos 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**

## Implementação da Correção

### Mudanças Necessárias

Assumindo que nossa análise de causa raiz está correta:

#### Correção Bug 1: Nome em Uma Linha

**Arquivo**: `app/components/PainelDetalhes.tsx`

**Mudanças Específicas**:

1. **Verificar CSS conflitante**: Inspecionar se há regras globais sobrescrevendo `whiteSpace`
2. **Garantir container flexível**: Adicionar `minWidth: 0` ao container pai para permitir overflow correto
3. **Testar com nomes longos**: Verificar comportamento com nomes de diferentes tamanhos

**Código Proposto**:

```tsx
<div style={{ flex: 1, minWidth: 0 }}>
  {" "}
  {/* ✅ Já existe */}
  {/* ... */}
  <div
    style={{
      fontSize: 16,
      fontWeight: 700,
      color: "#1e293b",
      marginTop: 2,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      display: "block", // ⚠️ Adicionar para garantir comportamento
    }}
  >
    {colaborador.nome}
  </div>
</div>
```

#### Correção Bug 2: Filtrar Semanas Futuras

**Arquivo**: `services/dashboardService.ts`

**Mudanças Específicas**:

1. **Obter data atual**: Calcular a segunda-feira da semana atual no início do processamento
2. **Filtrar semanas futuras**: Ao iterar `todasSemanas`, marcar como `skip: true` se `semana > segundaFeiraAtual`
3. **Não aplicar lógica de negócio a semanas futuras**: Pular redistribuição e carnaval automático para semanas com `skip: true`

**Código Proposto**:

```typescript
// Após linha ~150
const hoje = new Date().toISOString().slice(0, 10);
const segundaFeiraAtual = getSemana(hoje);

// Modificar loop na linha ~165
for (const s of todasSemanas) {
  // Marca como skip se for antes da primeira semana OU se for futura
  if (s < primeiraSemana || s > segundaFeiraAtual) {
    semanasOrdenadas.push({
      semana: s,
      work: 0,
      folga: 0,
      carnaval: 0,
      absence: 0,
      effective: 0,
      skip: true,
      carnavalAuto: false,
      projetos: [],
      cats: {},
    });
    continue;
  }
  // ... resto do código permanece igual
}

// Modificar carnaval automático (linha ~210)
for (const s of semanasOrdenadas) {
  if (s.semana !== CARNAVAL_WEEK || s.skip) continue; // ✅ Já pula se skip
  // ... resto permanece igual
}

// Modificar redistribuição (linha ~220)
for (let i = 0; i < semanasOrdenadas.length; i++) {
  const s = semanasOrdenadas[i];
  if (s.skip || s.folga <= 0) continue; // ✅ Já pula se skip
  // ... resto permanece igual
}
```

#### Correção Bug 3: Garantir Precisão dos Dados

**Arquivo**: `services/dashboardService.ts`

**Mudanças Específicas**:

1. **Verificar parsing**: Adicionar logs ou testes para confirmar que `parseDuration()` está correto
2. **Revisar arredondamento**: Manter precisão máxima durante cálculos, arredondar apenas na exibição final
3. **Validar redistribuição**: Garantir que a lógica de redistribuição está correta e só afeta semanas passadas
4. **Testar com dados reais**: Comparar saída do dashboard com Clockify para casos específicos (Carina)

**Código Proposto**:

```typescript
// Manter precisão durante cálculos - NÃO arredondar intermediários
// Linha ~230 - REMOVER arredondamento prematuro
const semanasFinais: SemanaColaborador[] = semanasOrdenadas.map((s) => {
  const horas = s.skip ? 0 : s.effective; // ⚠️ NÃO arredondar aqui
  const pct = meta && !s.skip ? Math.round((horas / meta) * 100) : 0;
  return {
    semana: s.semana,
    horas: Math.round(horas * 10) / 10, // ✅ Arredondar apenas no final
    pct,
    skip: s.skip,
    carnavalAuto: s.carnavalAuto,
    projetos: s.projetos,
    cats: s.cats,
  };
});
```

**Nota Importante**: Se a divergência persistir após corrigir o Bug 2, será necessário:

- Adicionar logs detalhados para rastrear cada transformação dos dados
- Criar testes unitários comparando entrada do Clockify com saída do dashboard
- Revisar a lógica de redistribuição de folgas linha por linha

## Estratégia de Testes

### Abordagem de Validação

A estratégia de testes segue uma abordagem em duas fases: primeiro, demonstrar os bugs no código não corrigido (exploratory testing), depois verificar que as correções funcionam e preservam o comportamento existente.

### Checagem Exploratória de Condições de Bug

**Objetivo**: Demonstrar os bugs ANTES de implementar as correções. Confirmar ou refutar a análise de causa raiz. Se refutarmos, precisaremos re-hipotizar.

**Plano de Testes**: Escrever testes que simulam as condições de cada bug e executá-los no código NÃO CORRIGIDO para observar falhas.

**Casos de Teste**:

1. **Bug 1 - Nome Separado**:
   - Renderizar `PainelDetalhes` com nome "Leomyr Sângelo" (falhará no código não corrigido se CSS estiver conflitando)
   - Verificar que o elemento DOM contém quebras de linha indesejadas
   - Causa esperada: CSS conflitante ou container sem `minWidth: 0`

2. **Bug 2 - Semana Futura com Horas**:
   - Criar entrada no Clockify com data futura (ou mockar dados)
   - Processar dashboard com `processarDashboard()`
   - Verificar que semanas futuras têm `horas > 0` (falhará no código não corrigido)
   - Causa esperada: Falta de verificação `semana > dataAtual`

3. **Bug 3 - Divergência Clockify**:
   - Buscar dados reais de Carina no Clockify
   - Processar dashboard e comparar valores
   - Verificar divergência (falhará no código não corrigido)
   - Causa esperada: Redistribuição/carnaval aplicados a semanas futuras OU erro de arredondamento

4. **Teste de Integração - Cristina 40h**:
   - Reproduzir cenário exato: Cristina com 40h em semana futura
   - Verificar que painel de detalhes não mostra projetos (falhará no código não corrigido)
   - Causa esperada: Combinação de Bug 2 + redistribuição/carnaval

**Contraexemplos Esperados**:

- Bug 1: Nome aparece em múltiplas linhas no DOM
- Bug 2: `colaborador.semanas` contém entradas com `semana > dataAtual` e `horas > 0`
- Bug 3: `Math.abs(horasDashboard - horasClockify) > 0.1` para Carina

### Checagem de Correção

**Objetivo**: Verificar que para todas as entradas onde a condição do bug ocorre, a função corrigida produz o comportamento esperado.

**Pseudocódigo:**

```
FOR ALL input WHERE isBugCondition_Bug1(input) DO
  result := PainelDetalhes_corrigido(input)
  ASSERT nomeEmUmaLinha(result)
END FOR

FOR ALL input WHERE isBugCondition_Bug2(input) DO
  result := processarDashboard_corrigido(input)
  ASSERT semanaFutura(input.semana) IMPLIES result.horas == 0 OR result.skip == true
END FOR

FOR ALL input WHERE isBugCondition_Bug3(input) DO
  result := processarDashboard_corrigido(input)
  ASSERT abs(result.horas - input.horasClockify) <= 0.1
END FOR
```

### Checagem de Preservação

**Objetivo**: Verificar que para todas as entradas onde a condição do bug NÃO ocorre, a função corrigida produz o mesmo resultado que a função original.

**Pseudocódigo:**

```
FOR ALL input WHERE NOT isBugCondition_Bug2(input) DO
  // Semanas passadas devem ter comportamento idêntico
  ASSERT processarDashboard_original(input) == processarDashboard_corrigido(input)
END FOR
```

**Abordagem de Testes**: Testes baseados em propriedades são recomendados para checagem de preservação porque:

- Geram muitos casos de teste automaticamente em todo o domínio de entrada
- Capturam casos extremos que testes unitários manuais podem perder
- Fornecem garantias fortes de que o comportamento permanece inalterado para todas as entradas não-bugadas

**Plano de Testes**: Observar comportamento no código NÃO CORRIGIDO primeiro para semanas passadas, depois escrever testes baseados em propriedades capturando esse comportamento.

**Casos de Teste**:

1. **Preservação - Semanas Passadas**:
   - Observar que semanas passadas são processadas corretamente no código não corrigido
   - Escrever teste para verificar que isso continua após correção
   - Gerar múltiplas semanas passadas aleatórias e verificar cálculos

2. **Preservação - Redistribuição de Folgas**:
   - Observar que redistribuição funciona corretamente em semanas passadas
   - Escrever teste para verificar que dedução de horas continua igual
   - Gerar cenários com folgas em diferentes semanas

3. **Preservação - Carnaval Automático**:
   - Observar que carnaval automático é aplicado corretamente na semana de carnaval (se passada)
   - Escrever teste para verificar que 24h são adicionadas quando apropriado
   - Testar com e sem entradas de carnaval existentes

4. **Preservação - Categorização**:
   - Observar que categorização de atividades funciona corretamente
   - Escrever teste para verificar que campo/reunião/escritório/gerenciamento continuam iguais
   - Gerar descrições aleatórias e verificar categorias

### Testes Unitários

- Testar `getSemana()` com datas futuras e passadas
- Testar `parseDuration()` com múltiplos formatos ISO 8601
- Testar lógica de skip para semanas futuras isoladamente
- Testar redistribuição de folgas com dados mockados
- Testar carnaval automático com diferentes cenários
- Testar renderização de `PainelDetalhes` com nomes de diferentes tamanhos

### Testes Baseados em Propriedades

- Gerar datas aleatórias e verificar que semanas futuras sempre têm `horas == 0` ou `skip == true`
- Gerar entradas aleatórias do Clockify e verificar que soma de horas bate (considerando redistribuição)
- Gerar configurações aleatórias de colaboradores e verificar que médias são calculadas corretamente
- Testar que redistribuição nunca resulta em horas negativas
- Testar que carnaval automático só é aplicado uma vez por colaborador

### Testes de Integração

- Testar fluxo completo: buscar dados do Clockify → processar dashboard → renderizar painel
- Testar com dados reais de Cristina e Carina para reproduzir bugs reportados
- Testar filtro por período (início/fim) com semanas futuras
- Testar cache com múltiplas requisições
- Testar comportamento com usuários part-time vs full-time
