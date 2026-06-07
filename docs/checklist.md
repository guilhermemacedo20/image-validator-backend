# Checklist de Segurança, LGPD e Documentação

## 1. Autenticação e Gestão de Credenciais

- [x] 1.1 - Uso de hash criptográfico seguro para senhas (Argon2, bcrypt ou PBKDF2)
- [x] 1.2 - Parâmetros de custo do hash configurados e justificados
- [x] 1.3 - Uso de salt criptográfico único por usuário
- [x] 1.4 - Armazenamento correto do hash + salt
- [x] 1.5 - Autenticação de dois fatores (2FA) implementada
- [x] 1.6 - Validação do 2FA após autenticação primária
- [x] 1.7 - Fluxo de autenticação documentado
- [x] 1.8 - Evidências funcionais (prints, logs ou testes)
- [x] 1.9 - Sessões com tempo de expiração
- [x] 1.10 - Invalidação de sessão no logout
- [x] 1.11 - Proteção contra força bruta (rate limit, bloqueio, atraso)
- [x] 1.12 - Justificativas técnicas documentadas

---

## 2. Recuperação de Senha

- [x] 2.1 - Funcionalidade de recuperação de senha implementada
- [x] 2.2 - Token criptograficamente seguro
- [x] 2.3 - Token com tempo de expiração
- [x] 2.4 - Token invalidado após uso
- [x] 2.5 - Falha correta para token expirado
- [x] 2.6 - Registro de solicitação de recuperação em log
- [x] 2.7 - Registro de sucesso/falha do processo

---

## 3. Criptografia e Comunicação Segura

- [x] 3.1 - Comunicação protegida por TLS/HTTPS
- [x] 3.2 - Bloqueio de conexões não seguras
- [x] 3.3 - Evidência de tráfego cifrado
- [x] 3.4 - Dados sensíveis criptografados em repouso
- [x] 3.5 - Uso de algoritmo criptográfico adequado (ex.: AES)
- [x] 3.6 - Chaves criptográficas protegidas
- [x] 3.7 - Estratégia de criptografia documentada
- [x] 3.8 - Justificativa técnica das escolhas

---

## 4. Conformidade com a LGPD

- [x] 4.1 - Listagem completa dos dados pessoais coletados
- [x] 4.2 - Associação de cada dado a uma finalidade
- [x] 4.3 - Evidência de minimização de dados
- [x] 4.4 - Registro explícito de consentimento
- [x] 4.5 - Consentimento associado à finalidade
- [x] 4.6 - Possibilidade de revogação do consentimento
- [x] 4.7 - Registro de data e versão do consentimento
- [x] 4.8 - Funcionalidade de consulta aos dados do titular
- [x] 4.9 - Funcionalidade de exportação dos dados
- [x] 4.10 - Funcionalidade de exclusão dos dados pessoais
- [x] 4.11 - Fluxo de atendimento aos direitos documentado

---

## 5. Auditoria e Logs

- [x] 5.1 - Logs de autenticação registrados
- [x] 5.2 - Logs de falhas e 2FA registrados
- [x] 5.3 - Proteção contra alteração dos logs
- [x] 5.4 - Exemplo de análise de logs apresentado

---

## 6. Documentação Técnico-Científica

- [x] 6.1 - Documento de visão geral do sistema
- [x] 6.2 - Diagrama de arquitetura
- [x] 6.3 - Fluxos de autenticação e dados documentados
- [x] 6.4 - Gestão de credenciais documentada
- [x] 6.5 - Uso de criptografia documentado
- [x] 6.6 - Identificação dos ativos do sistema
- [x] 6.7 - Identificação de ameaças e vulnerabilidades
- [x] 6.8 - Associação risco × contramedida
- [x] 6.9 - Testes de segurança realizados
- [x] 6.10 - Resultados dos testes documentados
- [x] 6.11 - Uso de artigos científicos e/ou normas técnicas
- [x] 6.12 - Referências normalizadas

---

## 7. Resumo Científico

- [x] 7.1 - Resumo entre 200 e 300 palavras
- [x] 7.2 - Objetivo claramente definido
- [x] 7.3 - Metodologia técnica descrita
- [x] 7.4 - Mecanismos de segurança apresentados
- [x] 7.5 - Conformidade com a LGPD explicitada
- [x] 7.6 - Terminologia técnica adequada
- [x] 7.7 - Qualidade textual e científica

---

## 8. Pôster Científico e Apresentação

- [x] 8.1 - Estrutura científica do pôster
- [x] 8.2 - Arquitetura e fluxos representados visualmente
- [x] 8.3 - Evidência de conformidade com LGPD
- [x] 8.4 - Qualidade técnica dos diagramas
- [x] 8.5 - Coerência com o sistema entregue
- [x] 8.6 - Domínio técnico na apresentação
- [x] 8.7 - Capacidade de resposta às perguntas
