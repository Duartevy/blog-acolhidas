# Como publicar o Acolhidas na internet

O projeto é publicado em **um único serviço** (Render) que entrega o site e a API juntos, mais um banco PostgreSQL na nuvem (Neon). Não há URL de API para configurar no código: o site chama `/api/...` no próprio endereço.

> Os planos gratuitos mudam com o tempo. Confira os limites atuais de cada serviço antes de começar.

## 0. Antes de tudo: teste o build no seu computador

No terminal, na pasta do projeto:

```bash
npm install
npm run build
```

Se terminar sem erro, a publicação vai funcionar. Se der erro de versão do Angular CLI, rode:

```bash
npm install -D @angular/cli@^19.2.27
npm run build
```

e faça commit do `package.json` e do `package-lock.json`.

## 1. Enviar as alterações ao GitHub

```bash
git status
git add .
git commit -m "chore: prepara o projeto para publicação"
git push
```

Confira no `git status` que o `.env` **não** aparece na lista. Ele nunca deve ser enviado.

## 2. Criar o banco (Neon)

1. Crie uma conta em https://neon.tech e crie um projeto (qualquer nome, região mais próxima do Brasil disponível).
2. Na página do projeto, clique em **Connect** e copie a **connection string**. Ela é parecida com:
   `postgresql://usuario:senha@host.neon.tech/neondb?sslmode=require`
3. Guarde essa string. Ela contém a senha do banco: **não cole em chat, post ou arquivo versionado**.

As tabelas são criadas sozinhas quando o serviço inicia (`npm run db:init`).

## 3. Publicar o site e a API (Render)

1. Crie uma conta em https://render.com e conecte sua conta do GitHub.
2. Clique em **New +** → **Blueprint** e escolha o repositório `blog-acolhidas`.
3. O Render lê o arquivo `render.yaml` e pede o valor de **DATABASE_URL**. Cole a connection string do Neon.
4. Clique em **Apply** e aguarde o build (alguns minutos).
5. Quando aparecer **Live**, abra o endereço `https://acolhidas-XXXX.onrender.com`.

## 4. Conferir

- `https://SEU-ENDERECO.onrender.com/api/health` deve mostrar `{"status":"ok","database":"postgresql"}`.
- Na página, publique um relato, comente, reaja e veja as notícias.
- Depois, apague seus testes.

## Se algo der errado

| Sintoma | O que verificar |
| --- | --- |
| Build falha no Render | Veja o log. Se citar versão do Angular CLI, siga o passo 0 |
| `/api/health` mostra erro de banco | `DATABASE_URL` colada inteira e sem espaços; projeto do Neon ativo |
| Site abre, mas sem relatos | Abra `/api/posts` no navegador e veja a resposta |
| Primeiro acesso demora cerca de um minuto | Normal em plano gratuito: o serviço "dorme" quando fica sem uso |
| Todos compartilham o mesmo limite de reação | Confirme `TRUST_PROXY=true` nas variáveis do Render |

## Depois de publicado

- A cada `git push` na branch `main`, o Render publica a nova versão automaticamente.
- Coloque o endereço do site no README e no post do LinkedIn.
- Antes de divulgar: pense em como remover conteúdo ofensivo, em um aviso de apoio (CVV 188) no rodapé e em uma nota de privacidade, já que o IP é guardado.
