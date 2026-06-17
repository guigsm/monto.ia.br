<?php
declare(strict_types=1);

/**
 * Monto API — Entry point
 *
 * Todas as requisições passam por aqui. O router detecta
 * automaticamente o prefixo de caminho (funciona tanto em
 * /www/api/ quanto em um subdomínio api.monto.ia.br/).
 */

define('BASE_PATH', __DIR__);

// ── Autoloader (Composer) ────────────────────────────────────────────
$autoloader = BASE_PATH . '/vendor/autoload.php';
if (!file_exists($autoloader)) {
    http_response_code(503);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'Dependências não instaladas. Execute: composer install',
    ]);
    exit;
}
require_once $autoloader;

// ── Configurações ────────────────────────────────────────────────────
require_once BASE_PATH . '/config/settings.php';

use MontoAPI\Response;
use MontoAPI\Validator;
use MontoAPI\TokenManager;
use MontoAPI\Mailer;

// ── CORS ─────────────────────────────────────────────────────────────
// O TokenManager é instanciado cedo para checar origens permitidas
// antes mesmo de validar o token — necessário para o preflight OPTIONS.
$tokenManager = new TokenManager();
$origin       = $_SERVER['HTTP_ORIGIN'] ?? '';

if ($origin && $tokenManager->isOriginAllowed($origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-API-Token');
    header('Access-Control-Max-Age: 86400');
    header('Vary: Origin');
}

// Preflight OPTIONS — responde sem processar o corpo
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Content-Type padrão ──────────────────────────────────────────────
header('Content-Type: application/json; charset=utf-8');

// ── Roteamento ───────────────────────────────────────────────────────
// Detecta o prefixo de instalação automaticamente.
// Ex.: SCRIPT_NAME = /www/api/index.php  → base = /www/api
//      SCRIPT_NAME = /index.php           → base = (raiz)
$scriptDir   = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$route       = '/' . ltrim(substr($requestPath, strlen($scriptDir)), '/');
$route       = rtrim($route, '/') ?: '/';
$method      = strtoupper($_SERVER['REQUEST_METHOD']);

// ── Lê o body da requisição ──────────────────────────────────────────
$rawBody     = file_get_contents('php://input');
$jsonBody    = json_decode($rawBody ?: '{}', true) ?? [];
// Fallback para application/x-www-form-urlencoded
$body        = !empty($jsonBody) ? $jsonBody : (!empty($_POST) ? $_POST : []);

// ── Dispatch ─────────────────────────────────────────────────────────
match (true) {
    $route === '/formail' && $method === 'POST'
        => handleFormail($body, $tokenManager, $origin),

    $route === '/health' && $method === 'GET'
        => Response::success('API operacional', ['version' => '1.0.0', 'env' => APP_ENV]),

    default
        => Response::error('Endpoint não encontrado', 404),
};

// ── Handler: POST /formail ────────────────────────────────────────────

/**
 * @param array<string, mixed> $body
 */
function handleFormail(array $body, TokenManager $tokenManager, string $origin): never
{
    // 1. Extrai e valida o token
    //    Aceita via header HTTP (preferido) ou campo _token no corpo
    $rawToken = $_SERVER['HTTP_X_API_TOKEN'] ?? $body['_token'] ?? '';
    unset($body['_token']); // garante que não vá para o email

    $tokenData = $tokenManager->validate((string) $rawToken, $origin);
    if ($tokenData === false) {
        Response::error('Token inválido, inativo ou origem não autorizada.', 401);
    }

    // 2. Sanitiza inputs
    $data = Validator::sanitize($body);

    // 3. Valida campos obrigatórios e limites
    $validation = Validator::formail($data);
    if (!$validation['ok']) {
        Response::error(implode(' ', $validation['errors']), 422);
    }

    // 4. Envia email
    $mailer = new Mailer($tokenData);
    $result = $mailer->sendFormail($data);

    if ($result['success']) {
        Response::success('Mensagem enviada com sucesso.');
    } else {
        Response::error($result['message'], 500);
    }
}
