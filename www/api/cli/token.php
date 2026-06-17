#!/usr/bin/env php
<?php
declare(strict_types=1);

/**
 * Monto API — CLI de gerenciamento de tokens
 *
 * Uso:
 *   php cli/token.php <comando> [opções]
 *
 * Comandos disponíveis:
 *   create      Cria um novo token
 *   list        Lista todos os tokens
 *   info        Exibe detalhes de um token
 *   activate    Ativa um token (active)
 *   deactivate  Suspende temporariamente (inactive)
 *   revoke      Revoga permanentemente (revoked)
 *   add-domain  Adiciona domínio a um token
 *   rm-domain   Remove domínio de um token
 *
 * Exemplos:
 *   php cli/token.php create --label="Cliente XYZ" --domains="xyz.com,www.xyz.com" --email="contato@xyz.com"
 *   php cli/token.php list
 *   php cli/token.php info a3f8b2c1
 *   php cli/token.php deactivate a3f8b2c1
 *   php cli/token.php activate a3f8b2c1
 *   php cli/token.php revoke a3f8b2c1
 *   php cli/token.php add-domain a3f8b2c1 blog.xyz.com
 *   php cli/token.php rm-domain a3f8b2c1 blog.xyz.com
 */

// Garante execução apenas via CLI
if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('Acesso negado. Este script é exclusivo para execução via CLI.' . PHP_EOL);
}

// Resolve BASE_PATH independente do diretório de onde o script é chamado
define('BASE_PATH', dirname(__DIR__));

// Autoloader
$autoloader = BASE_PATH . '/vendor/autoload.php';
if (!file_exists($autoloader)) {
    die(red('Erro: dependências não instaladas. Execute: composer install') . PHP_EOL);
}
require_once $autoloader;
require_once BASE_PATH . '/config/settings.php';

use MontoAPI\TokenManager;

// ── Parse de argumentos ──────────────────────────────────────────────
$args    = array_slice($argv, 1);
$command = array_shift($args) ?? 'help';
$opts    = parseArgs($args);
$positional = array_values(array_filter($args, fn($a) => !str_starts_with($a, '--')));

$manager = new TokenManager();

// ── Dispatch ─────────────────────────────────────────────────────────
match ($command) {
    'create'     => cmdCreate($manager, $opts),
    'list'       => cmdList($manager),
    'info'       => cmdInfo($manager, $positional[0] ?? ''),
    'activate'   => cmdSetStatus($manager, $positional[0] ?? '', 'active'),
    'deactivate' => cmdSetStatus($manager, $positional[0] ?? '', 'inactive'),
    'revoke'     => cmdSetStatus($manager, $positional[0] ?? '', 'revoked'),
    'add-domain' => cmdAddDomain($manager, $positional[0] ?? '', $positional[1] ?? ''),
    'rm-domain'  => cmdRemoveDomain($manager, $positional[0] ?? '', $positional[1] ?? ''),
    default      => cmdHelp(),
};

// ── Comandos ─────────────────────────────────────────────────────────

function cmdCreate(TokenManager $m, array $opts): void
{
    $label  = $opts['label']  ?? '';
    $email  = $opts['email']  ?? '';
    $domains = isset($opts['domains'])
        ? array_map('trim', explode(',', $opts['domains']))
        : [];
    $notes     = $opts['notes']      ?? '';
    $expiresAt = $opts['expires-at'] ?? null;

    if (empty($label)) {
        die(red('Erro: --label é obrigatório.') . PHP_EOL);
    }
    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        die(red('Erro: --email inválido ou ausente.') . PHP_EOL);
    }
    if (empty($domains)) {
        die(red('Erro: --domains é obrigatório (ex: --domains="exemplo.com,www.exemplo.com")') . PHP_EOL);
    }

    $result = $m->create($label, $domains, $email, $notes, $expiresAt);

    echo PHP_EOL;
    echo green('✔ Token criado com sucesso!') . PHP_EOL;
    echo PHP_EOL;
    echo yellow('⚠  GUARDE O TOKEN ABAIXO — ele não será exibido novamente:') . PHP_EOL;
    echo PHP_EOL;
    echo '  ' . bold($result['token']) . PHP_EOL;
    echo PHP_EOL;
    printTokenEntry($result['entry']);
    echo PHP_EOL;
}

function cmdList(TokenManager $m): void
{
    $tokens = $m->list();

    if (empty($tokens)) {
        echo yellow('Nenhum token cadastrado.') . PHP_EOL;
        return;
    }

    echo PHP_EOL;
    echo bold('TOKENS CADASTRADOS') . PHP_EOL;
    echo str_repeat('─', 60) . PHP_EOL;

    foreach ($tokens as $entry) {
        $statusColor = match ($entry['status']) {
            'active'   => green($entry['status']),
            'inactive' => yellow($entry['status']),
            'revoked'  => red($entry['status']),
            default    => $entry['status'],
        };

        echo sprintf(
            "  [%s]  %-10s  %-30s  %s\n",
            bold($entry['short_id']),
            $statusColor,
            $entry['label'],
            implode(', ', $entry['domains'])
        );
    }

    echo str_repeat('─', 60) . PHP_EOL;
    echo count($tokens) . ' token(s) encontrado(s).' . PHP_EOL . PHP_EOL;
}

function cmdInfo(TokenManager $m, string $shortId): void
{
    if (empty($shortId)) {
        die(red('Erro: informe o short_id do token. Ex: php cli/token.php info a3f8b2c1') . PHP_EOL);
    }

    $entry = $m->find($shortId);
    if (!$entry) {
        die(red("Token com short_id '$shortId' não encontrado.") . PHP_EOL);
    }

    echo PHP_EOL;
    printTokenEntry($entry);
    echo PHP_EOL;
}

function cmdSetStatus(TokenManager $m, string $shortId, string $status): void
{
    if (empty($shortId)) {
        die(red("Erro: informe o short_id. Ex: php cli/token.php $status a3f8b2c1") . PHP_EOL);
    }

    $labels = ['active' => 'ativado', 'inactive' => 'desativado', 'revoked' => 'revogado'];

    if ($status === 'revoked') {
        echo yellow('Atenção: revogar um token é permanente. Confirma? [s/N] ');
        $confirm = strtolower(trim(fgets(STDIN) ?: ''));
        if ($confirm !== 's') {
            echo 'Operação cancelada.' . PHP_EOL;
            return;
        }
    }

    if ($m->setStatus($shortId, $status)) {
        echo green("✔ Token $shortId {$labels[$status]} com sucesso.") . PHP_EOL;
    } else {
        echo red("Erro: token '$shortId' não encontrado.") . PHP_EOL;
    }
}

function cmdAddDomain(TokenManager $m, string $shortId, string $domain): void
{
    if (empty($shortId) || empty($domain)) {
        die(red('Uso: php cli/token.php add-domain <short_id> <dominio>') . PHP_EOL);
    }

    if ($m->addDomain($shortId, $domain)) {
        echo green("✔ Domínio '$domain' adicionado ao token $shortId.") . PHP_EOL;
    } else {
        echo red("Erro: token '$shortId' não encontrado.") . PHP_EOL;
    }
}

function cmdRemoveDomain(TokenManager $m, string $shortId, string $domain): void
{
    if (empty($shortId) || empty($domain)) {
        die(red('Uso: php cli/token.php rm-domain <short_id> <dominio>') . PHP_EOL);
    }

    if ($m->removeDomain($shortId, $domain)) {
        echo green("✔ Domínio '$domain' removido do token $shortId.") . PHP_EOL;
    } else {
        echo red("Erro: token '$shortId' não encontrado.") . PHP_EOL;
    }
}

function cmdHelp(): void
{
    echo <<<HELP

    \033[1mMonto API — CLI de Tokens\033[0m
    ─────────────────────────────────────────────────────────────

    Uso: php cli/token.php <comando> [opções]

    Comandos:
      create        Cria um novo token
      list          Lista todos os tokens
      info          Exibe detalhes de um token
      activate      Ativa um token
      deactivate    Suspende temporariamente (pode ser reativado)
      revoke        Revoga permanentemente (irreversível)
      add-domain    Adiciona domínio autorizado a um token
      rm-domain     Remove domínio de um token

    Opções do create:
      --label       Nome do cliente ou projeto (obrigatório)
      --email       Email de destino dos formulários (obrigatório)
      --domains     Domínios autorizados, separados por vírgula (obrigatório)
      --notes       Observações opcionais
      --expires-at  Data de expiração ISO 8601 (ex: 2027-01-01T00:00:00Z)

    Exemplos:
      php cli/token.php create --label="Acme Corp" --email="ti@acme.com" --domains="acme.com,www.acme.com"
      php cli/token.php list
      php cli/token.php info a3f8b2c1
      php cli/token.php deactivate a3f8b2c1
      php cli/token.php add-domain a3f8b2c1 blog.acme.com

    ─────────────────────────────────────────────────────────────

    HELP;
}

// ── Helpers de output ─────────────────────────────────────────────────

function printTokenEntry(array $entry): void
{
    $status = match ($entry['status']) {
        'active'   => green('active'),
        'inactive' => yellow('inactive'),
        'revoked'  => red('revoked'),
        default    => $entry['status'],
    };

    $rows = [
        ['Short ID',   $entry['short_id']],
        ['Label',      $entry['label']],
        ['Status',     $status],
        ['Email To',   $entry['email_to']],
        ['Domains',    implode(', ', $entry['domains'])],
        ['Created',    $entry['created_at']],
        ['Expires',    $entry['expires_at'] ?? '(nunca)'],
        ['Revoked at', $entry['revoked_at'] ?? '─'],
        ['Notes',      $entry['notes'] ?: '─'],
    ];

    foreach ($rows as [$label, $value]) {
        echo sprintf("  \033[90m%-12s\033[0m  %s\n", $label . ':', $value);
    }
}

/** @return array<string, string> */
function parseArgs(array $args): array
{
    $opts = [];
    foreach ($args as $arg) {
        if (str_starts_with($arg, '--')) {
            $arg = ltrim($arg, '-');
            if (str_contains($arg, '=')) {
                [$key, $val] = explode('=', $arg, 2);
                $opts[$key] = $val;
            } else {
                $opts[$arg] = 'true';
            }
        }
    }
    return $opts;
}

// ANSI color helpers
function red(string $s): string    { return "\033[31m$s\033[0m"; }
function green(string $s): string  { return "\033[32m$s\033[0m"; }
function yellow(string $s): string { return "\033[33m$s\033[0m"; }
function bold(string $s): string   { return "\033[1m$s\033[0m"; }
