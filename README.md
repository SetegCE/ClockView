# ClockView — SETEG

Dashboard web para visualização de dados de jornada semanal dos colaboradores, consumindo a API do Clockify.

## Funcionalidades

- **Dashboard** — Heatmap semanal de horas por colaborador com cores por % da meta
- **Colaboradores** — Cards detalhados com progresso, projetos e categorias de atividade
- **Projetos** — Lista de projetos/clientes com distribuição por colaborador
- **Calendário** — Visualização mensal com registros de horas por semana

## Tecnologias

- [Next.js 14](https://nextjs.org/) — App Router + API Routes (serverless)
- [React 18](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- Deploy: [Vercel](https://vercel.com/)

## Setup local

### 1. Clonar o repositório

```bash
git clone https://github.com/SetegCE/ClockView.git
cd ClockView
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais:

```env
CLOCKIFY_API_TOKEN=sua_api_key_aqui
CLOCKIFY_WORKSPACE_ID=seu_workspace_id_aqui
```

**Como obter:**

- `CLOCKIFY_API_TOKEN`: [app.clockify.me/user/settings](https://app.clockify.me/user/settings) → seção "API"
- `CLOCKIFY_WORKSPACE_ID`: URL do workspace no Clockify (`app.clockify.me/tracker/{ID}`)

### 4. Rodar localmente

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## Deploy na Vercel

1. Conecte o repositório GitHub à Vercel
2. Configure as variáveis de ambiente no painel da Vercel:
   - `CLOCKIFY_API_TOKEN`
   - `CLOCKIFY_WORKSPACE_ID`
3. Deploy automático a cada push na branch `main`

## Estrutura do projeto

```
app/
├── layout.tsx              # Layout raiz (Sidebar + Header + Context)
├── page.tsx                # Redireciona / → /dashboard
├── dashboard/page.tsx      # Heatmap de jornada semanal
├── colaboradores/page.tsx  # Cards de colaboradores
├── projetos/page.tsx       # Lista de projetos
├── calendario/page.tsx     # Calendário mensal
├── api/dashboard/route.ts  # API Route — processa dados do Clockify
├── components/             # Componentes compartilhados
├── context/                # DadosContext — estado global
└── lib/                    # Utilitários e constantes

config/
└── clockify.ts             # Configurações da API Clockify

lib/
├── types.ts                # Interfaces TypeScript
├── businessRules.ts        # Regras de negócio SETEG
└── durationParser.ts       # Parser de duração ISO 8601

services/
├── clockifyClient.ts       # Cliente HTTP da Clockify API
└── dashboardService.ts     # Processamento principal dos dados
```

## Regras de negócio

- **Meta padrão**: 40h/semana
- **Lavinia Oliveira**: meta de 20h/semana (part-time)
- **Maira Carvalho**: excluída do dashboard
- **Carnaval automático**: 24h creditadas para quem não marcou na semana de carnaval
- **Folgas**: redistribuídas para semanas anteriores com excesso de horas
- **Categorias**: Escritório, Gerenciamento, Campo, Reunião (classificadas por palavras-chave na descrição)
