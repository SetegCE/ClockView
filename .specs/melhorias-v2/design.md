# Design — Melhorias v2 ClockView

## 1. Agrupamento por projeto individual (não por cliente)

### Mudança no `dashboardService.ts`

Atualmente:

```typescript
const mapaProjetos = new Map(
  projetos.map((p) => [p.id, p.clientName || "SETEG (interno)"]),
);
```

Novo comportamento — usar o nome do projeto diretamente:

```typescript
const mapaProjetos = new Map(projetos.map((p) => [p.id, p.name]));
```

O campo `p.name` já contém o código e nome completo exatamente como cadastrado no Clockify (ex: `#0000-1-1990 (SETEG INTERNO)`).

### Impacto

- `ResumoProjeto.nome` passa a ser o nome do projeto, não do cliente
- Projetos distintos com o mesmo cliente aparecem separados
- Sem fallback "SETEG (interno)" — projetos sem cliente usam o próprio nome

---

## 2. Remoção do sufixo " | SETEG" dos nomes dos colaboradores

### Mudança no `dashboardService.ts`

```typescript
// Antes
const mapaUsuarios = new Map(
  usuarios
    .filter((u) => !EXCLUDE_USERS.includes(u.name))
    .map((u) => [u.id, u.name]),
);

// Depois — remove sufixo " | SETEG" e variações
function limparNome(nome: string): string {
  return nome.replace(/\s*\|\s*SETEG\s*$/i, "").trim();
}

const mapaUsuarios = new Map(
  usuarios
    .filter(
      (u) =>
        !EXCLUDE_USERS.some((ex) => limparNome(u.name) === ex || u.name === ex),
    )
    .map((u) => [u.id, limparNome(u.name)]),
);
```

---

## 3. Seletor de período (data início / data fim)

### Interface

- Posicionado no header, à direita do timestamp de atualização
- Dois inputs `type="date"`: Data início e Data fim
- Padrão ao carregar: primeiro e último dia do mês atual
- Ao alterar qualquer data: invalida cache e rebusca

### Fluxo de dados

- `DadosContext` recebe `periodoInicio` e `periodoFim` como parâmetros
- `processarDashboard(inicio, fim)` passa as datas para `buscarEntradasUsuario`
- Cache inclui as datas no key para evitar conflito entre períodos diferentes

### Mudança na API

```typescript
// app/api/dashboard/route.ts
export async function GET(request: NextRequest) {
  const inicio =
    request.nextUrl.searchParams.get("inicio") ?? primeiroDiaMesAtual();
  const fim = request.nextUrl.searchParams.get("fim") ?? ultimoDiaMesAtual();
  // ...
}
```

---

## 4. Filtro de colaborador na página de colaboradores

### Interface

- Input de texto acima do grid de cards
- Placeholder: "Buscar colaborador..."
- Filtragem em tempo real, case-insensitive, correspondência parcial

### Implementação

```typescript
const [busca, setBusca] = useState("");
const listaFiltrada = lista.filter((c) =>
  c.nome.toLowerCase().includes(busca.toLowerCase()),
);
```

---

## 5. Número da semana ISO 8601 no dashboard

### Cálculo

```typescript
function numeroSemanaISO(dataStr: string): number {
  const d = new Date(dataStr + "T12:00:00Z");
  const jan4 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() + 6) % 7));
  const diff = d.getTime() - startOfWeek1.getTime();
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
}
```

### Exibição

- No cabeçalho do heatmap: `Sem 16` em vez de `16/04`
- No tooltip da célula: `Semana 16 · 40.0h (100%)`

---

## 6. Legenda semáforo simplificada

### Nova paleta de cores

| Nível     | Condição | Cor fundo | Cor texto |
| --------- | -------- | --------- | --------- |
| Vermelho  | ≤ 50%    | `#E24B4A` | `#FFFFFF` |
| Amarelo   | ≤ 80%    | `#EF9F27` | `#FFFFFF` |
| Verde     | > 80%    | `#3B6D11` | `#FFFFFF` |
| Sem dados | 0h       | `#D3D1C7` | `#5F5E5A` |

### Ordem da legenda (progressão positiva)

1. Sem dados
2. ≤ 50% (vermelho)
3. ≤ 80% (amarelo)
4. > 80% (verde)

### Correção textual

- "Sem dado" → "Sem dados"
