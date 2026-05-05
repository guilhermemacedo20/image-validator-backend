# 🔐 Secure Image Validator — Backend API

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

```
Controller → Service → Repository → Database
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

Crie um arquivo `.env`:

```
PORT=
JWT_SECRET=
JWT_REFRESH_SECRET=
ACCESS_TOKEN_EXPIRES_IN=
REFRESH_TOKEN_EXPIRES_IN=
BCRYPT_ROUNDS=
CRYPTO_SECRET=
```

---

## ▶️ Como Rodar o Backend

### 1. Instalar dependências

```
npm install
```

### 2. Rodar em desenvolvimento

```
npm run dev
```

---

## 🔗 Principais Rotas

### 🔐 Autenticação

* POST `/auth/register`
* POST `/auth/login`
* POST `/auth/refresh`
* POST `/auth/logout`
* GET `/auth/me`

### 🔑 2FA

* POST `/auth/2fa/setup`
* POST `/auth/2fa/confirm`
* POST `/auth/2fa/disable`

### 🔁 Recuperação de senha

* POST `/auth/forgot-password`
* POST `/auth/reset-password`

### 👤 LGPD

* GET `/user/export`
* POST `/user/revoke-consent`
* DELETE `/user`

---

## 📊 Logs e Auditoria

O sistema registra:

* Login e falhas
* Ativação de 2FA
* Reset de senha
* Alterações de conta
* Revogação de consentimento

---

## 🧪 Testes

```
npm run test
```

---

## ⚠️ Segurança

* Nunca subir `.env`
* Utilizar HTTPS em produção
* Proteger tokens e chaves criptográficas

---

## 👨‍💻 Autor

Projeto acadêmico focado em segurança da informação, autenticação forte e LGPD.
Idealizado e realizado por:

- LUIZ EDUARDO DIAS
- Guilherme Aires Pimenta de Macedo
- FABRÍCIO ROCHA DE SOUZA
- MARIANA DA ROCHA PEREIRA MOREIRA
