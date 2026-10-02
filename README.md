# Secure Image Validator — Backend API

Backend em Node.js + TypeScript para autenticação segura, 2FA, LGPD e análise de imagens com Gemini (PFC de Engenharia de Software).

Arquitetura: **monólito com camadas Domain / Application / Infrastructure** — detalhes em [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Separação principal

| Camada | Responsabilidade |
|--------|------------------|
| `domain/` | Regras de negócio e contratos |
| `application/` | Casos de uso (orquestração) |
| `infrastructure/` | Banco de dados e integrações |
| `interfaces/http/` | Rotas e controllers HTTP |

## Como rodar

```bash
npm install
npm run dev
npm test
```

## Rotas (prefixo `/api`)

```txt
POST /api/auth/register | login | refresh | logout
GET  /api/auth/me
POST /api/auth/2fa/*
POST /api/auth/forgot-password | reset-password
PUT|GET|POST|DELETE /api/user/...
POST /api/ai/analyze-image
```

Veja `.env.example` para variáveis de ambiente.
