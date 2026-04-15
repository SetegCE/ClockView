# Documento de Requisitos

## Introdução

O **ClockView** é uma aplicação web MVP desenvolvida para consumir e visualizar dados da API do Clockify de forma organizada e acessível via navegador. A aplicação tem como objetivo central reduzir aproximadamente 4 horas semanais de análise manual de dados de tempo, centralizando as informações do Clockify em um dashboard simples e funcional.

A aplicação será construída com Next.js, hospedada na Vercel e versionada no GitHub. Não há autenticação de usuários neste momento — o foco é na simplicidade, funcionalidade e na base para futura integração com o sistema 7Station.

---

## Glossário

- **ClockView**: A aplicação web descrita neste documento.
- **Clockify_API**: A API REST externa do serviço Clockify, utilizada como fonte de dados.
- **API_Route**: Função serverless do Next.js localizada em `/api`, responsável por intermediar as chamadas à Clockify_API.
- **Dashboard**: Interface visual principal do ClockView que exibe os dados de tempo processados.
- **Token**: Chave de autenticação da Clockify_API, armazenada como variável de ambiente.
- **Serviço**: Módulo interno em `/services` responsável pelas regras de negócio e transformação de dados.
- **Entrada_de_Tempo**: Registro individual de tempo rastreado no Clockify, contendo usuário, projeto, duração e período.
- **Período**: Intervalo de datas utilizado para filtrar as Entradas_de_Tempo.
- **Workspace_Clockify**: Espaço de trabalho configurado no Clockify ao qual o Token pertence.

---

## Requisitos

### Requisito 1: Consumo de Dados da API do Clockify

**User Story:** Como usuário interno, quero que a aplicação busque automaticamente os dados do Clockify ao acessar o dashboard, para que eu sempre visualize informações atualizadas sem precisar acionar manualmente uma sincronização.

#### Critérios de Aceitação

1. WHEN o usuário acessa o Dashboard, THE ClockView SHALL buscar os dados atualizados da Clockify_API por meio das API_Routes.
2. THE API_Route SHALL utilizar o Token armazenado em variável de ambiente para autenticar as requisições à Clockify_API.
3. IF a Clockify_API retornar um erro HTTP (4xx ou 5xx), THEN THE API_Route SHALL retornar uma resposta de erro com código HTTP correspondente e uma mensagem descritiva.
4. IF o Token não estiver configurado na variável de ambiente, THEN THE API_Route SHALL retornar HTTP 500 com a mensagem "Token de autenticação não configurado".
5. THE ClockView SHALL garantir que o Token nunca seja exposto em respostas enviadas ao frontend.

---

### Requisito 2: Segurança e Isolamento de Credenciais

**User Story:** Como administrador da aplicação, quero que os tokens de acesso ao Clockify sejam armazenados de forma segura, para que as credenciais nunca sejam expostas ao navegador do usuário.

#### Critérios de Aceitação

1. THE ClockView SHALL armazenar todos os Tokens exclusivamente em variáveis de ambiente no servidor.
2. THE API_Route SHALL ser o único ponto de comunicação com a Clockify_API.
3. IF o frontend tentar acessar diretamente a Clockify_API, THEN THE ClockView SHALL não fornecer o Token para essa operação, pois todas as chamadas externas passam pelas API_Routes.
4. THE ClockView SHALL incluir um arquivo `.env.example` com os nomes das variáveis de ambiente necessárias, sem valores reais.

---

### Requisito 3: Exibição de Dados no Dashboard

**User Story:** Como usuário interno, quero visualizar os dados de tempo em um dashboard organizado, para que eu possa analisar rapidamente as informações sem precisar exportar relatórios manualmente.

#### Critérios de Aceitação

1. THE Dashboard SHALL exibir as Entradas_de_Tempo agrupadas por Usuário.
2. THE Dashboard SHALL exibir as Entradas_de_Tempo agrupadas por Projeto.
3. THE Dashboard SHALL exibir o total de horas registradas por Usuário no Período selecionado.
4. THE Dashboard SHALL exibir o total de horas registradas por Projeto no Período selecionado.
5. WHEN os dados estiverem sendo carregados, THE Dashboard SHALL exibir um indicador visual de carregamento.
6. IF a API_Route retornar um erro, THEN THE Dashboard SHALL exibir uma mensagem de erro clara e legível ao usuário.

---

### Requisito 4: Filtragem por Período de Tempo

**User Story:** Como usuário interno, quero filtrar os dados por período de tempo, para que eu possa analisar semanas ou meses específicos conforme necessário.

#### Critérios de Aceitação

1. THE Dashboard SHALL disponibilizar um seletor de Período com as opções: semana atual, mês atual e intervalo personalizado.
2. WHEN o usuário selecionar um Período, THE Dashboard SHALL atualizar os dados exibidos para refletir apenas as Entradas_de_Tempo dentro do Período selecionado.
3. THE API_Route SHALL aceitar parâmetros de data de início e data de fim no formato ISO 8601 (YYYY-MM-DD).
4. IF o usuário informar uma data de início posterior à data de fim, THEN THE Dashboard SHALL exibir a mensagem de validação "A data de início deve ser anterior à data de fim".
5. WHEN nenhum Período for selecionado pelo usuário, THE Dashboard SHALL utilizar a semana atual como Período padrão.

---

### Requisito 5: Filtragem por Usuário e Projeto

**User Story:** Como usuário interno, quero filtrar os dados por usuário ou projeto específico, para que eu possa analisar a contribuição individual ou o progresso de um projeto.

#### Critérios de Aceitação

1. THE Dashboard SHALL disponibilizar um seletor de Usuário populado com os membros do Workspace_Clockify.
2. THE Dashboard SHALL disponibilizar um seletor de Projeto populado com os projetos do Workspace_Clockify.
3. WHEN o usuário selecionar um Usuário no seletor, THE Dashboard SHALL filtrar as Entradas_de_Tempo exibidas para mostrar apenas as do Usuário selecionado.
4. WHEN o usuário selecionar um Projeto no seletor, THE Dashboard SHALL filtrar as Entradas_de_Tempo exibidas para mostrar apenas as do Projeto selecionado.
5. WHEN nenhum Usuário ou Projeto estiver selecionado, THE Dashboard SHALL exibir dados de todos os Usuários e Projetos do Workspace_Clockify.

---

### Requisito 6: Transformação e Processamento de Dados

**User Story:** Como desenvolvedor, quero que os dados brutos da Clockify_API sejam processados e normalizados antes de serem enviados ao frontend, para que a interface receba dados prontos para exibição.

#### Critérios de Aceitação

1. THE Serviço SHALL converter a duração das Entradas_de_Tempo do formato ISO 8601 de duração (ex: PT1H30M) para o formato decimal de horas (ex: 1.5).
2. THE Serviço SHALL agrupar as Entradas_de_Tempo por Usuário, calculando o total de horas por Usuário.
3. THE Serviço SHALL agrupar as Entradas_de_Tempo por Projeto, calculando o total de horas por Projeto.
4. FOR ALL Entradas_de_Tempo válidas, THE Serviço SHALL preservar os campos: identificador, nome do usuário, nome do projeto, duração em horas decimais, data de início e data de fim.
5. IF uma Entrada_de_Tempo possuir duração nula ou inválida, THEN THE Serviço SHALL registrar um aviso no log do servidor e desconsiderar a entrada no cálculo dos totais.

---

### Requisito 7: Desempenho e Experiência do Usuário

**User Story:** Como usuário interno, quero que a aplicação carregue rapidamente, para que eu não perca tempo esperando os dados aparecerem.

#### Critérios de Aceitação

1. WHEN o Dashboard for acessado, THE ClockView SHALL retornar a interface inicial ao navegador em até 3 segundos em condições normais de rede.
2. THE API_Route SHALL responder às requisições do frontend em até 10 segundos, incluindo o tempo de resposta da Clockify_API.
3. IF a Clockify_API não responder em até 8 segundos, THEN THE API_Route SHALL cancelar a requisição e retornar HTTP 504 com a mensagem "Tempo limite de resposta da API do Clockify excedido".
4. THE Dashboard SHALL exibir os dados parciais disponíveis enquanto outros dados ainda estiverem sendo carregados, quando aplicável.

---

### Requisito 8: Estrutura do Projeto e Manutenibilidade

**User Story:** Como desenvolvedor, quero que o projeto siga uma estrutura modular e organizada, para que seja fácil de manter, evoluir e integrar futuramente ao sistema 7Station.

#### Critérios de Aceitação

1. THE ClockView SHALL organizar o código seguindo a estrutura de diretórios: `/api` para API_Routes, `/services` para regras de negócio, `/lib` para utilitários e helpers, `/app` para a interface Next.js e `/config` para configurações gerais.
2. THE ClockView SHALL incluir um arquivo `README.md` contendo: instruções de setup local, lista de variáveis de ambiente necessárias, comando para execução local e instruções de deploy na Vercel.
3. THE ClockView SHALL utilizar variáveis de ambiente para todas as configurações sensíveis ou específicas de ambiente, sem valores padrão codificados no código-fonte.
4. THE ClockView SHALL ser compatível com o modelo de deploy serverless da Vercel, sem dependências de estado persistente entre requisições nas API_Routes.

---

### Requisito 9: Parser e Serialização de Dados da API

**User Story:** Como desenvolvedor, quero que os dados recebidos da Clockify_API sejam corretamente parseados e que o formato de saída seja consistente, para que o frontend sempre receba dados estruturados e previsíveis.

#### Critérios de Aceitação

1. WHEN a API_Route receber a resposta da Clockify_API, THE Serviço SHALL parsear o JSON recebido para o modelo interno de Entrada_de_Tempo.
2. THE Serviço SHALL serializar o modelo interno de Entrada_de_Tempo para o formato JSON de resposta enviado ao frontend.
3. IF o JSON recebido da Clockify_API estiver malformado ou não corresponder ao esquema esperado, THEN THE API_Route SHALL retornar HTTP 502 com a mensagem "Resposta inválida recebida da API do Clockify".
4. FOR ALL modelos internos de Entrada_de_Tempo válidos, parsear e serializar e parsear novamente SHALL produzir um objeto equivalente ao original (propriedade de round-trip).
