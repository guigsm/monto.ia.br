<?php
declare(strict_types=1);

namespace MontoAPI;

/**
 * Response — Helper de respostas JSON padronizadas
 *
 * Todas as respostas da API seguem o envelope:
 * {
 *   "success": bool,
 *   "message": string,
 *   "data": mixed|null    (apenas em respostas de sucesso com payload)
 * }
 */
final class Response
{
    /**
     * Resposta de sucesso (HTTP 200)
     *
     * @param string $message Mensagem descritiva
     * @param mixed  $data    Payload opcional
     */
    public static function success(string $message, mixed $data = null): never
    {
        self::send(200, true, $message, $data);
    }

    /**
     * Resposta de erro
     *
     * @param string $message   Mensagem de erro
     * @param int    $httpCode  Código HTTP (4xx ou 5xx)
     */
    public static function error(string $message, int $httpCode = 400): never
    {
        self::send($httpCode, false, $message);
    }

    /**
     * Envia a resposta JSON e encerra a execução
     */
    private static function send(int $code, bool $success, string $message, mixed $data = null): never
    {
        if (!headers_sent()) {
            http_response_code($code);
            header('Content-Type: application/json; charset=utf-8');
        }

        $body = ['success' => $success, 'message' => $message];

        if ($data !== null) {
            $body['data'] = $data;
        }

        echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}
