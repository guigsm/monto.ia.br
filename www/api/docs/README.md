# Monto API

API de serviços web — hospedada em servidor PHP 8.3, consumida por sites estáticos (Cloudflare Pages e similares).

## Visão geral

```
Sites estáticos (CF Pages)
        │  POST + X-API-Token
        ▼
┌──────────────────────┐
│     Monto API        │  PHP 8.3 + SMTP
│  /www/api/index.php  │──────────────────▶ Email do cliente
└──────────────────────┘
        │
        ├── Valida token (data/tokens.json)
        ├── Valida e sanitiza campos
        └── Envia via PHPMailer/SMTP
```

## Módulos disponíveis

| Endpoint        | Método | Descrição                    |
|-----------------|--------|------------------------------|
| `/formail`      | POST   | Envia formulário por email   |
| `/health`       | GET    | Verifica status da API       |

## Estrutura de diretórios

```
www/api/
├── index.php           ← Entry point (router)
├── composer.json       ← Dependências PHP
├── .env.example        ← Template de variáveis de ambiente
├── .htaccess           ← Roteamento e segurança Apache
│
├── src/                ← Classes da aplicação (bloqueado via web)
│   ├── Response.php        Respostas JSON padronizadas
│   ├── Validator.php       Validação e sanitização de inputs
│   ├── TokenManager.php    Gerenciamento de tokens por arquivo
│   └── Mailer.php          Envio de email via PHPMailer/SMTP
│
├── config/             ← Configurações (bloqueado via web)
│   └── settings.php        Carrega .env e define constantes
│
├── data/               ← Dados persistentes (bloqueado via web)
│   ├── tokens.json         Registro de tokens (sem tokens puros)
│   └── api.log             Log de eventos (opcional)
│
├── cli/                ← Scripts de administração (bloqueado via web)
│   └── token.php           CLI para gerenciar tokens
│
└── docs/               ← Esta documentação (bloqueado via web)
    ├── README.md
    ├── API.md
    └── TOKENS.md
```

## Instalação

### 1. Instalar dependências

```bash
cd /caminho/para/www/api
composer install --no-dev --optimize-autoloader
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
nano .env   # preencha SMTP_HOST, SMTP_USER, SMTP_PASS, etc.
```

### 3. Permissões (Linux)

```bash
chmod 640 data/tokens.json
chmod 750 data/
chmod 750 cli/
```

### 4. Criar o primeiro token

```bash
php cli/token.php create \
  --label="Meu Primeiro Site" \
  --email="contato@meusite.com" \
  --domains="meusite.com,www.meusite.com"
```

> O token puro é exibido apenas neste momento. Copie e guarde em segredo.

### 5. Usar no site (CF Pages)

Adicione o token como variável de ambiente secreta no CF Pages (`PUBLIC_API_TOKEN`) e consuma a API:

```javascript
// src/lib/contact.js
const API_URL = 'https://monto.ia.br/www/api/formail';

export async function sendContact(formData) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Token': import.meta.env.PUBLIC_API_TOKEN,
    },
    body: JSON.stringify(formData),
  });
  return res.json();
}
```

## Dependências

| Pacote                  | Versão | Finalidade           |
|-------------------------|--------|----------------------|
| phpmailer/phpmailer     | ^6.9   | Envio SMTP de emails |
| vlucas/phpdotenv        | ^5.6   | Leitura do .env      |

## Requisitos

- PHP 8.3 ou superior
- Extensão OpenSSL habilitada (para SMTP TLS)
- Extensão mbstring habilitada
- Apache com mod_rewrite habilitado (ou Nginx equivalente)

## Segurança

- Tokens são armazenados apenas como hash SHA-256 — o valor puro nunca é persistido
- Cada token é vinculado a domínios específicos (validação via header `Origin`)
- Diretórios `src/`, `config/`, `data/`, `cli/` bloqueados via `.htaccess`
- Arquivo `.env` bloqueado via `.htaccess`
- Respostas de erro nunca revelam detalhes internos em produção
