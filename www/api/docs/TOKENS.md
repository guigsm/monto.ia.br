# Gerenciamento de Tokens

## Conceitos

### O que é um token

Cada cliente ou projeto recebe um token único que autoriza o uso da API.
O token é uma string segura no formato:

```
mt_a3f8b2c1d4e5f6789012345678901234567890123456789012345678901234ab
 ↑  ↑────────────────────────────────────────────────────────────────
 │  64 caracteres hexadecimais (32 bytes aleatórios via random_bytes)
 └─ prefixo identificador da Monto API
```

### Como os tokens são armazenados

O token puro **nunca é armazenado**. Apenas seu hash SHA-256 é gravado em `data/tokens.json`.

```
Token puro  →  SHA-256  →  tokens.json
mt_abc123...   hash(...)   { "3f9a...": { "short_id": "a3f8b2c1", ... } }
```

Isso significa que:
- Se o token puro for perdido, não é possível recuperá-lo — apenas revogar e criar outro.
- Mesmo que `tokens.json` seja comprometido, os tokens puros não podem ser extraídos.

### Short ID

Para referenciar um token no CLI sem digitar o hash completo, use o **short_id**:
os primeiros 8 caracteres hexadecimais do token (após o prefixo `mt_`).

```
mt_a3f8b2c1d4e5f678...
     ↑────────
     short_id = a3f8b2c1
```

---

## Ciclo de vida de um token

```
          create
            │
            ▼
         [active]  ←─────────── activate
            │                       │
            │ deactivate             │
            ▼                       │
        [inactive] ─────────────────┘
            │
            │ revoke (permanente)
            ▼
         [revoked]   ← fim de linha, não pode ser reativado
```

| Status     | Aceita requisições | Pode mudar para  |
|------------|--------------------|------------------|
| `active`   | ✅                 | inactive, revoked|
| `inactive` | ❌                 | active, revoked  |
| `revoked`  | ❌                 | (nenhum)         |

---

## Comandos CLI

Execute sempre a partir do diretório raiz da API:

```bash
cd /caminho/para/www/api
```

### Criar token

```bash
php cli/token.php create \
  --label="Nome do Cliente" \
  --email="destino@cliente.com" \
  --domains="cliente.com,www.cliente.com" \
  --notes="Contrato #123" \
  --expires-at="2027-01-01T00:00:00Z"
```

> O token puro é exibido **uma única vez**. Copie imediatamente e entregue ao cliente
> para que seja configurado como variável de ambiente secreta no CF Pages.

### Listar tokens

```bash
php cli/token.php list
```

```
TOKENS CADASTRADOS
────────────────────────────────────────────────────────────
  [a3f8b2c1]  active      Cliente XYZ                    xyz.com, www.xyz.com
  [d4e5f678]  inactive    Projeto Antigo                 antigo.com.br
  [90123456]  revoked     Ex-cliente                     ex.com
────────────────────────────────────────────────────────────
3 token(s) encontrado(s).
```

### Ver detalhes

```bash
php cli/token.php info a3f8b2c1
```

### Suspender temporariamente

```bash
php cli/token.php deactivate a3f8b2c1
```

Suspensão por inadimplência, manutenção ou revisão contratual.
O token pode ser reativado a qualquer momento.

### Reativar

```bash
php cli/token.php activate a3f8b2c1
```

### Revogar permanentemente

```bash
php cli/token.php revoke a3f8b2c1
```

> ⚠️ Irreversível. Ao revogar, crie um novo token para o cliente se necessário.

### Gerenciar domínios

```bash
# Adicionar subdomínio (ex: ao lançar um blog)
php cli/token.php add-domain a3f8b2c1 blog.cliente.com

# Remover domínio
php cli/token.php rm-domain a3f8b2c1 antigo.cliente.com
```

---

## Configurando no Cloudflare Pages

1. No painel do CF Pages do site do cliente, vá em **Settings → Environment variables**
2. Adicione uma variável de ambiente com **encrypt** ativado:
   - Nome: `PUBLIC_API_TOKEN` (para Astro/Vite) ou qualquer nome
   - Valor: `mt_a3f8b2c1...` (o token puro)
3. No código do site, consuma via `import.meta.env.PUBLIC_API_TOKEN` (Astro/Vite)
   ou `process.env.API_TOKEN` (Next.js)

> Em Astro, variáveis com prefixo `PUBLIC_` são acessíveis no cliente. Em Next.js,
> apenas variáveis sem `NEXT_PUBLIC_` ficam no servidor. Avalie qual é mais adequado
> para o seu caso — em geral, para formail o token pode ser semi-público pois a
> proteção real vem da validação de domínio.

---

## Backup e manutenção

### Backup do tokens.json

```bash
cp data/tokens.json data/tokens.json.bak.$(date +%Y%m%d)
```

Recomenda-se adicionar isso a um cron diário.

### Edição de emergência

Se precisar alterar `tokens.json` manualmente (ex.: servidor sem PHP disponível),
edite o arquivo JSON diretamente. Mantenha o formato e use `jq` para validar:

```bash
jq . data/tokens.json   # valida o JSON
```

---

## Quando migrar para banco de dados

A solução em arquivo JSON é suficiente para cenários com:
- Até ~200 tokens ativos
- Tráfego moderado (até alguns milhares de requisições/dia)
- Sem necessidade de auditoria detalhada ou rate limiting por token

**Migre para banco de dados quando:**

| Necessidade                        | Solução recomendada         |
|------------------------------------|-----------------------------|
| Rate limiting por token ou IP      | DB + Redis/cache            |
| Auditoria de uso (quem enviou o quê, quando) | Tabela de logs em DB  |
| Portal de autoatendimento do cliente | DB + autenticação web     |
| Mais de 200 tokens ou alta concorrência | DB (SQLite → MySQL/PG) |
| Expiração automática com renovação | DB + job scheduler          |

### Caminho de migração

A classe `TokenManager` foi projetada para facilitar a migração. Basta substituir
os métodos `loadTokens()` e `saveTokens()` por queries de banco sem alterar
nenhuma outra parte da aplicação.

Ordem sugerida:
1. **SQLite** (arquivo, zero infra extra) — para escala intermediária
2. **MySQL/PostgreSQL** — para multi-servidor ou portal de admin

---

## Áreas de sombra e considerações de segurança

### ⚠ Token semi-público no frontend

Tokens em variáveis `PUBLIC_` do CF Pages ficam visíveis no bundle JavaScript.
A proteção primária é a **validação de domínio** (header `Origin`).
Um invasor com o token mas fora do domínio autorizado não consegue usar a API.

**Mitigação adicional (futura):** assinar requisições com HMAC — o token nunca
sai do servidor e o frontend assina com timestamp. Isso elimina completamente
o risco de token exposto, mas requer endpoint de assinatura ou edge function.

### ⚠ Sem rate limiting

A versão atual não limita quantas vezes um formulário pode ser enviado.
Um bot pode fazer flood de emails ao endereço do cliente.

**Mitigação imediata:** adicione reCAPTCHA v3 ou hCaptcha no frontend antes de
chamar a API. Isso não requer mudança na API.

**Mitigação futura:** rate limiting por IP em arquivo (simples) ou Redis (robusto).

### ⚠ Arquivo tokens.json em servidor compartilhado

Se outros usuários no mesmo servidor tiverem acesso ao filesystem, podem ler
`tokens.json` (que contém os hashes). Os hashes não são reversíveis, mas
revelam metadados (clientes, domínios, emails).

**Mitigação:** mova `tokens.json` para fora do document root, configurando
`TOKENS_FILE` no `.env` com caminho absoluto acima de `public_html/`.

### ⚠ Log em arquivo texto

O `api.log` pode crescer indefinidamente.

**Mitigação:** configure logrotate no servidor ou use `LOG_ENABLED=false` e
delegue logging ao servidor web (access.log / error.log).
