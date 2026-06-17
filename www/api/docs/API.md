# Referência da API

Base URL: `https://monto.ia.br/www/api`

> Se a API for movida para um subdomínio (`api.monto.ia.br`), o path vira apenas `/formail`.

---

## Autenticação

Todas as requisições devem incluir o token no header:

```
X-API-Token: mt_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Alternativa (fallback para submissões simples sem controle de headers):

```json
{ "_token": "mt_xxx...", "email": "...", "message": "..." }
```

> O header `X-API-Token` é **preferido**. Nunca exponha o token em URLs (query string).

---

## Endpoints

### GET /health

Verifica se a API está operacional. Não requer autenticação.

**Resposta 200:**
```json
{
  "success": true,
  "message": "API operacional",
  "data": {
    "version": "1.0.0",
    "env": "production"
  }
}
```

---

### POST /formail

Envia os dados de um formulário de contato por email.

#### Campos

| Campo      | Tipo   | Obrig. | Descrição                                              |
|------------|--------|--------|--------------------------------------------------------|
| `email`    | string | ✅     | Email do remetente (máx. 254 chars)                    |
| `message`  | string | ✅     | Corpo da mensagem (máx. 10.000 chars)                  |
| `name`     | string | ─      | Nome do remetente — aparece em **destaque** no email   |
| `company`  | string | ─      | Empresa — aparece em **destaque** no email             |
| `subject`  | string | ─      | Concatenado no assunto: `Formulário de Contato — {subject}` |
| `*`        | string | ─      | Qualquer outro campo é exibido como tabela no email    |

#### Comportamento do email

```
Assunto: Formulário de Contato — [subject se fornecido]

┌──────────────────────────────────────────────┐
│  [subject ou "Novo contato"]                 │  ← Cabeçalho
├──────────────────────────────────────────────┤
│  NOME:     João Silva          (destacado)   │
│  EMPRESA:  Acme Corp           (destacado)   │
│  EMAIL:    joao@acme.com                     │
├──────────────────────────────────────────────┤
│  Mensagem                                    │
│  ──────────────────────────────────────────  │
│  Texto livre da mensagem...                  │
├──────────────────────────────────────────────┤
│  Dados Adicionais   (campos extras)          │
│  ┌─────────────┬────────────────────────┐   │
│  │ Campo       │ Valor                  │   │
│  ├─────────────┼────────────────────────┤   │
│  │ Telefone    │ 11 9999-9999           │   │
│  │ Cidade      │ São Paulo              │   │
│  └─────────────┴────────────────────────┘   │
└──────────────────────────────────────────────┘
```

#### Exemplos de requisição

**Mínimo (email + message):**
```javascript
fetch('https://monto.ia.br/www/api/formail', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Token': 'mt_seu_token_aqui',
  },
  body: JSON.stringify({
    email: 'joao@exemplo.com',
    message: 'Olá, gostaria de mais informações.',
  }),
});
```

**Completo (com campos opcionais e extras):**
```javascript
fetch('https://monto.ia.br/www/api/formail', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Token': 'mt_seu_token_aqui',
  },
  body: JSON.stringify({
    email:    'joao@acme.com',
    message:  'Preciso de um orçamento para 50 usuários.',
    name:     'João Silva',
    company:  'Acme Corp',
    subject:  'Solicitação de Orçamento',
    telefone: '11 9999-9999',
    cidade:   'São Paulo',
    cargo:    'Diretor de TI',
  }),
});
```

#### Respostas

**200 — Sucesso:**
```json
{ "success": true, "message": "Mensagem enviada com sucesso." }
```

**401 — Token inválido:**
```json
{ "success": false, "message": "Token inválido, inativo ou origem não autorizada." }
```

**422 — Validação:**
```json
{ "success": false, "message": "O campo \"email\" não é um endereço válido." }
```

**500 — Falha de envio:**
```json
{ "success": false, "message": "Falha ao enviar o email. Tente novamente mais tarde." }
```

---

## Envelope de resposta

Todas as respostas seguem o mesmo formato:

```typescript
{
  success: boolean;
  message: string;
  data?: any;          // presente apenas em respostas de sucesso com payload
}
```

---

## CORS

A API responde com `Access-Control-Allow-Origin` apenas para origens cujo domínio
está na lista de um token ativo. Requisições de origens não cadastradas recebem
ausência do header CORS e são bloqueadas pelo navegador.

O preflight `OPTIONS` é respondido com status `204` sem autenticação.

---

## Limitações conhecidas (versão arquivo JSON)

| Área           | Limitação                                    | Solução futura           |
|----------------|----------------------------------------------|--------------------------|
| Rate limiting  | Sem controle por IP ou token                 | Migrar para banco + Redis|
| Auditoria      | Log básico em arquivo texto                  | Tabela de eventos em DB  |
| Escala         | Adequado até ~200 tokens / tráfego moderado  | Migrar storage para DB   |

Consulte [TOKENS.md](./TOKENS.md) para orientações sobre quando migrar para banco de dados.
