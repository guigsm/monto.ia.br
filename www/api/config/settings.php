<?php
declare(strict_types=1);

/**
 * Monto API — Carregamento de configurações
 *
 * Lê variáveis do .env (via phpdotenv) com fallback para $_ENV / getenv().
 * Define constantes globais usadas em toda a aplicação.
 */

// Carrega phpdotenv se o .env existir
$envFile = BASE_PATH . '/.env';
if (file_exists($envFile) && class_exists(\Dotenv\Dotenv::class)) {
    $dotenv = \Dotenv\Dotenv::createImmutable(BASE_PATH);
    $dotenv->safeLoad();
}

// Helper: lê variável de ambiente com fallback
function env(string $key, string $default = ''): string
{
    $value = $_ENV[$key] ?? getenv($key);
    return ($value !== false && $value !== null && $value !== '')
        ? (string) $value
        : $default;
}

// Ambiente
define('APP_ENV',        env('APP_ENV', 'production'));
define('ALLOW_LOCALHOST', env('ALLOW_LOCALHOST', 'false') === 'true');

// Caminhos
define('TOKENS_FILE', env('TOKENS_FILE', BASE_PATH . '/data/tokens.json'));
define('LOG_ENABLED', env('LOG_ENABLED', 'true') === 'true');
define('LOG_FILE',    env('LOG_FILE', BASE_PATH . '/data/api.log'));

// SMTP
define('SMTP_HOST',      env('SMTP_HOST'));
define('SMTP_PORT',      (int) env('SMTP_PORT', '587'));
define('SMTP_SECURE',    env('SMTP_SECURE', 'tls'));
define('SMTP_USER',      env('SMTP_USER'));
define('SMTP_PASS',      env('SMTP_PASS'));
define('SMTP_FROM',      env('SMTP_FROM'));
define('SMTP_FROM_NAME', env('SMTP_FROM_NAME', 'API de Contato'));
