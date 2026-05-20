# Secure Image Validator — Backend API

Backend em Node.js + TypeScript para autenticação segura de usuários, 2FA, recuperação de senha, auditoria, LGPD e análise de imagens com Gemini.

## Arquitetura adotada

O projeto foi organizado para uma **arquitetura em camadas modularizada**.

A regra principal:

```txt
Route -> Controller -> Service -> Repository -> Model/Database
```

Os arquivos ficam agrupados como `auth`, `users`, `ai`, `audit` e `security`.

## Estrutura do projeto

```txt
src/
├── app.ts
├── server.ts
│
├── config/
│   └── env.ts
│
├── database/
│   └── index.ts
│
├── modules/
│   ├── ai/
│   │   ├── ai.controller.ts
│   │   ├── ai.routes.ts
│   │   └── ai.service.ts
│   │
│   ├── audit/
│   │   ├── audit.model.ts
│   │   ├── audit.repository.ts
│   │   └── audit.service.ts
│   │
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.repository.ts
│   │   ├── auth.routes.ts
│   │   ├── auth.service.ts
│   │   ├── refresh-token.model.ts
│   │   └── token.service.ts
│   │
│   ├── security/
│   │   ├── black-list.repository.ts
│   │   ├── mail.service.ts
│   │   ├── token-blacklist.model.ts
│   │   └── two-factor.service.ts
│   │
│   └── users/
│       ├── user.controller.ts
│       ├── user.model.ts
│       ├── user.repository.ts
│       └── user.routes.ts
│
├── routes/
│   └── index.ts
│
└── shared/
    ├── middlewares/
    │   └── auth.middleware.ts
    │
    ├── types/
    └── utils/
```

## Responsabilidade de cada camada

### Routes

Define os endpoints e os middlewares usados por cada rota.

Exemplo:

```txt
POST /api/ai/analyze-image
```

### Controller

Recebe a requisição HTTP, valida dados básicos de entrada e chama o service.

Exemplo no módulo de IA: o controller lê `x-gemini-api-key`, aceita `image` ou `imageBase64` no body e normaliza imagens em formato Data URL.

### Service

Contém as regras de negócio.

Exemplo: o `ai.service.ts` valida a API Key, imagem, MIME type, chama o Gemini e normaliza o retorno.

### Repository

Isola o acesso ao banco de dados.

Exemplo: `user.repository.ts`, `auth.repository.ts`, `audit.repository.ts`.

### Model

Define os schemas do MongoDB/Mongoose.

Exemplo: `user.model.ts`, `refresh-token.model.ts`, `audit.model.ts`.

### Shared

Guarda itens reutilizáveis por vários módulos, como middlewares, tipos globais e funções utilitárias.

## Variáveis de ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=
JWT_REFRESH_SECRET=
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
EMAIL_USER=
EMAIL_PASS=
FRONT_URL=http://localhost:5173
SECRET_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-flash-latest
MONGODB_URI=
```

## Como rodar

Instale as dependências:

```bash
npm install
```

Rode em desenvolvimento:

```bash
npm run dev
```

Gere o build:

```bash
npm run build
```

Rode em produção:

```bash
npm start
```

## Rotas principais

Todas as rotas usam o prefixo `/api`.

### Autenticação

```txt
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
```

### 2FA

```txt
POST /api/auth/2fa/setup
POST /api/auth/2fa/confirm
POST /api/auth/2fa/disable
```

### Recuperação de senha

```txt
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### Usuário/LGPD

```txt
PUT    /api/user/profile
GET    /api/user/export
POST   /api/user/revoke-consent
DELETE /api/user
```

### IA

```txt
POST /api/ai/analyze-image
```

Headers:

```txt
Authorization: Bearer <access_token>
x-gemini-api-key: <sua_api_key_do_gemini>
```

Body aceito:

```json
{
  "image": "data:image/png;base64,..."
}
```

ou:

```json
{
  "imageBase64": "...",
  "mimeType": "image/png"
}
```

## Observações de segurança

- Não suba o arquivo `.env` para o GitHub.
- Em produção, use secrets do Render/Vercel/GitHub Actions.
- Evite expor `GEMINI_API_KEY` fixa no frontend.
