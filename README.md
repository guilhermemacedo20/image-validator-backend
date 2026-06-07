# Secure Image Validator — Backend API

## 📌 Visão Geral

O **Secure Image Validator** é uma API desenvolvida em Node.js responsável por autentação segura de usuários, análise de imagens via inteligência artificial e gerenciamento de dados conforme a LGPD.

O sistema implementa mecanismos avançados de segurança, incluindo autenticação multifator (2FA), proteção contra ataques de força bruta e criptografia de dados sensíveis.

---

## 🧠 Objetivo

Garantir um ambiente seguro para:

* Autenticação de usuários
* Proteção de dados sensíveis
* Validação de imagens utilizando IA
* Conformidade com regulamentações de privacidade (LGPD)

---

## 🏗️ Arquitetura

A aplicação segue um padrão baseado em camadas:

```txt
Route -> Controller -> Service -> Repository -> Model/Database
```

* **Controller:** Entrada das requisições
* **Service:** Regras de negócio
* **Repository:** Acesso ao banco
* **Utils:** Criptografia e helpers

---

## 🚀 Tecnologias Utilizadas

* Node.js
* Express
* SQLite
* JWT (Access + Refresh Token)
* bcrypt
* speakeasy (2FA)
* crypto (AES-256-CBC + SHA-256)
* express-rate-limit

---

## 🔐 Segurança Implementada

* Hash de senha com bcrypt
* Tokens JWT com expiração
* Refresh token com blacklist
* Autenticação em dois fatores (TOTP)
* Proteção contra brute force
* Criptografia AES para dados sensíveis
* Tokens de reset com hash
* Middleware HTTPS obrigatório

---

## ⚖️ Conformidade com LGPD

* Consentimento obrigatório no cadastro
* Registro de versão e data do consentimento
* Revogação de consentimento
* Exportação de dados pessoais
* Exclusão de conta
* Minimização de dados

---

## 📂 Estrutura do Projeto

```
src/
 ├── controllers/
 ├── services/
 ├── repositories/
 ├── middleware/
 ├── routes/
 ├── utils/
 ├── database/
 └── app.js
```

---

## 🔑 Variáveis de Ambiente

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
