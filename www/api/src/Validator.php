<?php
declare(strict_types=1);

namespace MontoAPI;

/**
 * Validator — Validação e sanitização de inputs do Formail
 *
 * Garante que os dados mínimos estejam presentes e dentro
 * de limites aceitáveis antes do processamento.
 */
final class Validator
{
    // Campos com tratamento especial no Formail
    public const KNOWN_FIELDS = ['email', 'message', 'name', 'company', 'subject'];

    // Prefixo reservado: campos com _ são metadados de sistema (nunca vão para extras)
    private const SYSTEM_PREFIX = '_';

    // Limites de tamanho (caracteres)
    private const MAX_EMAIL   = 254;
    private const MAX_SHORT   = 200;   // name, company, subject
    private const MAX_MESSAGE = 10_000;
    private const MAX_EXTRA   = 1_000; // campos extras

    /**
     * Valida os dados do Formail.
     *
     * @param  array<string, mixed> $data
     * @return array{ok: bool, errors: string[]}
     */
    public static function formail(array $data): array
    {
        $errors = [];

        // Campos obrigatórios
        if (empty($data['email'])) {
            $errors[] = 'O campo "email" é obrigatório.';
        } elseif (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'O campo "email" não é um endereço válido.';
        } elseif (strlen($data['email']) > self::MAX_EMAIL) {
            $errors[] = 'O campo "email" excede o tamanho máximo permitido.';
        }

        if (empty($data['message'])) {
            $errors[] = 'O campo "message" é obrigatório.';
        } elseif (strlen((string) $data['message']) > self::MAX_MESSAGE) {
            $errors[] = 'O campo "message" excede ' . number_format(self::MAX_MESSAGE) . ' caracteres.';
        }

        // Campos opcionais — apenas valida tamanho se presentes
        foreach (['name', 'company', 'subject'] as $field) {
            if (!empty($data[$field]) && strlen((string) $data[$field]) > self::MAX_SHORT) {
                $errors[] = "O campo \"$field\" excede " . self::MAX_SHORT . " caracteres.";
            }
        }

        // Campos extras — valida tamanho de cada valor
        $extras = self::extractExtras($data);
        foreach ($extras as $key => $value) {
            if (strlen((string) $value) > self::MAX_EXTRA) {
                $errors[] = "O campo extra \"$key\" excede " . self::MAX_EXTRA . " caracteres.";
            }
        }

        return ['ok' => empty($errors), 'errors' => $errors];
    }

    /**
     * Sanitiza todos os campos de string do array (trim + htmlspecialchars).
     *
     * @param  array<string, mixed> $data
     * @return array<string, string>
     */
    public static function sanitize(array $data): array
    {
        $clean = [];
        foreach ($data as $key => $value) {
            $key = trim(strip_tags((string) $key));
            $clean[$key] = trim(htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'));
        }
        return $clean;
    }

    /**
     * Extrai campos além dos conhecidos (serão tabulados no email).
     * Campos com prefixo _ são metadados de sistema e são ignorados.
     *
     * @param  array<string, mixed> $data
     * @return array<string, string>
     */
    public static function extractExtras(array $data): array
    {
        $extras = [];
        foreach ($data as $key => $value) {
            if (
                !in_array($key, self::KNOWN_FIELDS, true)
                && !str_starts_with($key, self::SYSTEM_PREFIX)
            ) {
                $extras[$key] = (string) $value;
            }
        }
        return $extras;
    }
}
