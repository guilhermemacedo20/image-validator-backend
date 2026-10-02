# Arquitetura do Backend — Secure Image Validator

Documento de decisão arquitetural do PFC de Engenharia de Software.

## Decisão

O backend é um **monólito modular** com **separação clara em camadas**:

1. **Domain** — regras de negócio  
2. **Application** — casos de uso / orquestração  
3. **Infrastructure** — banco de dados e integrações externas  
4. **Interfaces (HTTP)** — entrada da API (não mistura regra nem persistência)

Isso NÃO é espelho do frontend: é a separação clássica pedida em Engenharia de Software (regras × aplicação × dados).

## Por que separar assim?

| Camada | Pergunta que responde |
|--------|------------------------|
| **Domain** | *O que* as regras do negócio exigem? (senha forte, lockout, consentimento, formato público do usuário) |
| **Application** | *Como* orquestrar um caso de uso? (login chama validação + repositório + token + 2FA) |
| **Infrastructure** | *Onde* persiste e *com o que* se integra? (Mongo/Mongoose, Gemini, e-mail, crypto) |
| **HTTP** | *Como* o mundo externo chama? (rotas, status code, headers) |

Benefícios para o TCC:

- muda o banco sem reescrever regra de negócio;
- testa políticas sem subir Mongo/Gemini;
- controllers finos — sem lógica de senha ou LGPD embutida no HTTP;
- discurso alinhado a Clean Architecture / layered architecture, ainda em um monólito.

## Estrutura

```txt
src/
├── server.ts / app.ts              # bootstrap
│
├── domain/                         # REGRAS DE NEGÓCIO
│   ├── types/                      # contratos (User, LoginResponse, …)
│   └── policies/                   # políticas puras (senha, e-mail, lockout, mapper LGPD)
│
├── application/                    # APLICAÇÃO (casos de uso)
│   ├── auth/                       # register, login, refresh, logout…
│   ├── users/                      # perfil + LGPD
│   ├── ai/                         # orquestra análise
│   ├── audit/                      # grava eventos
│   └── security/                   # 2FA
│
├── infrastructure/                 # BANCO + ADAPTERS
│   ├── config/
│   ├── database/                   # conexão MongoDB
│   ├── persistence/                # models + repositories
│   ├── mail/                       # Nodemailer
│   ├── ai/                         # erros/adapters Gemini
│   └── crypto/
│
├── interfaces/http/                # INTERFACE HTTP
│   ├── middlewares/
│   ├── auth|users|ai/              # routes + controllers
│   └── routes.ts
│
└── tests/
```

## Fluxo de dependências

```txt
interfaces/http  →  application  →  domain
                         ↓
                  infrastructure  →  domain
```

- `domain` não importa Express, Mongoose, Gemini nem Nodemailer.
- `application` orquestra domain + infrastructure.
- `infrastructure` implementa acesso a dados e serviços externos.
- `interfaces/http` só adapta HTTP ↔ application.

## Fluxo de uma requisição

```txt
POST /api/auth/login
  → interfaces/http (route + controller)
  → application/auth (auth.service)
       → domain/policies (isAccountLocked, …)
       → infrastructure/persistence (userRepository)
       → application/auth (token.service)
  → application/audit (logService)
  ← JSON HTTP
```

## Por que monólito?

Poucos contextos, um deploy, um banco. A modularidade por pastas (`auth`, `users`, `ai`…) dentro das camadas já comunica orientação a serviços sem o custo de microserviços.

## Testes

| Tipo | Foco |
|------|------|
| Unitário em `domain/policies` | regras puras (senha, e-mail, lockout) |
| Unitário em `application` | serialização LGPD |
| HTTP | contratos da API (`/health`, validações de registro) |

```bash
npm test
```
