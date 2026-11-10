# Blog Acolhidas

Blog para mulheres compartilharem histórias e vivências com acolhimento, anonimato e sem julgamentos. Reúne um mural de relatos e comentários e uma área de notícias.

**Stack:** Angular 19, API Node.js e PostgreSQL.

## Requisitos

- Node.js (versão LTS) e npm
- PostgreSQL instalado e em execução
- Internet (as notícias vêm de um feed RSS externo)

## Instalação

```bash
git clone URL_DO_REPOSITORIO
cd blog-acolhidas
npm install
```

## Banco de dados

1. Crie o banco (pelo terminal do PostgreSQL ou por achar melhor):

```sql
CREATE DATABASE acolhidas;
```

2. Crie o arquivo `.env` a partir do exemplo:
```.env.example .env```

3. Ajuste a `DATABASE_URL` com seu usuário e senha:
```env
DATABASE_URL=postgresql://postgres:SUA_SENHA@localhost:5432/acolhidas
PORT=3000
FRONTEND_ORIGIN=http://localhost:4200
TRUST_PROXY=false
```

4. Crie as tabelas:

```bash
npm run db:init
```

## Executar localmente

Abra dois terminais na pasta do projeto.

**Terminal 1 (API):**

```bash
npm run api
```

**Terminal 2 (Angular):**

```bash
npm start
```

| Serviço | URL |
| --- | --- |
| Site | http://localhost:4200 |
| API | http://localhost:3000 |
| Teste do banco | http://localhost:3000/api/health |
| Notícias (RSS) | http://localhost:3000/api/news |

## Comandos úteis

```bash
npm run build  # compila a aplicação
npm test       # executa os testes
```

## Problemas comuns

- **Erro de conexão com o banco:** confirme que o PostgreSQL está rodando, que o banco `acolhidas` existe e que a `DATABASE_URL` está correta.
- **Relatos não carregam:** confirme que a API está ativa e que o `npm run db:init` terminou sem erro.
- **Notícias indisponíveis:** verifique a conexão com a internet.