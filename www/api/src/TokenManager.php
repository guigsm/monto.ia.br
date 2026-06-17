<?php
declare(strict_types=1);

namespace MontoAPI;

/**
 * TokenManager — Gerenciamento de tokens por arquivo JSON
 *
 * Estratégia de segurança:
 *  - Apenas o HASH SHA-256 do token é armazenado; o token puro só é exibido uma vez (na criação via CLI).
 *  - Cada token fica vinculado a um ou mais domínios; requisições com Origin diferente são rejeitadas.
 *  - Status possíveis: active | inactive | revoked
 *
 * Sobre escalabilidade:
 *  - Arquivo JSON é adequado para até ~200 tokens e tráfego moderado.
 *  - Migrações para banco de dados (SQLite, MySQL, PostgreSQL) são simples:
 *    basta reescrever loadTokens() / saveTokens() mantendo a interface pública.
 */
final class TokenManager
{
    private string $filePath;

    public function __construct()
    {
        $this->filePath = TOKENS_FILE;
        $this->ensureFileExists();
    }

    // ----------------------------------------------------------------
    //  Validação (usada pela API em cada requisição)
    // ----------------------------------------------------------------

    /**
     * Valida um token recebido na requisição.
     *
     * @param  string $token  Token puro enviado pelo cliente
     * @param  string $origin Valor do header HTTP Origin
     * @return array<string, mixed>|false  Dados do token ou false se inválido
     */
    public function validate(string $token, string $origin): array|false
    {
        if (empty($token)) {
            return false;
        }

        $hash = $this->hash($token);
        $tokens = $this->loadTokens();

        if (!isset($tokens[$hash])) {
            return false;
        }

        $entry = $tokens[$hash];

        // Verifica status
        if ($entry['status'] !== 'active') {
            $this->log("Token {$entry['short_id']} recusado: status={$entry['status']}");
            return false;
        }

        // Verifica expiração
        if (!empty($entry['expires_at'])) {
            $expiresAt = new \DateTimeImmutable($entry['expires_at']);
            if ($expiresAt < new \DateTimeImmutable()) {
                $this->log("Token {$entry['short_id']} recusado: expirado em {$entry['expires_at']}");
                return false;
            }
        }

        // Verifica domínio (Origin)
        if (!$this->isOriginAllowedForToken($origin, $entry['domains'] ?? [])) {
            $host = $this->extractHost($origin);
            $this->log("Token {$entry['short_id']} recusado: origin=$origin não está na allowlist");
            return false;
        }

        return $entry;
    }

    /**
     * Verifica se a origem tem permissão em QUALQUER token ativo (usado para CORS preflight).
     */
    public function isOriginAllowed(string $origin): bool
    {
        if (empty($origin)) {
            return false;
        }

        // Localhost em modo desenvolvimento
        if (ALLOW_LOCALHOST && $this->isLocalhost($origin)) {
            return true;
        }

        $host = $this->extractHost($origin);
        if (empty($host)) {
            return false;
        }

        foreach ($this->loadTokens() as $entry) {
            if ($entry['status'] !== 'active') {
                continue;
            }
            if ($this->hostMatchesDomains($host, $entry['domains'] ?? [])) {
                return true;
            }
        }

        return false;
    }

    // ----------------------------------------------------------------
    //  CRUD (usada pelo CLI)
    // ----------------------------------------------------------------

    /**
     * Cria um novo token. Retorna o token puro (exibido apenas aqui).
     *
     * @param  string   $label    Nome/rótulo do cliente
     * @param  string[] $domains  Lista de domínios autorizados (sem protocolo)
     * @param  string   $emailTo  Email de destino dos formulários
     * @param  string   $notes    Observações opcionais
     * @param  string|null $expiresAt  Data de expiração ISO 8601 ou null
     * @return array{token: string, entry: array<string, mixed>}
     */
    public function create(
        string $label,
        array  $domains,
        string $emailTo,
        string $notes = '',
        ?string $expiresAt = null
    ): array {
        // Gera token seguro: prefixo mt_ + 32 bytes aleatórios em hex
        $rawToken  = 'mt_' . bin2hex(random_bytes(32));
        $shortId   = substr($rawToken, 3, 8); // 8 primeiros hex após mt_
        $hash      = $this->hash($rawToken);

        $entry = [
            'short_id'   => $shortId,
            'label'      => $label,
            'domains'    => array_values(array_unique(array_map('strtolower', $domains))),
            'email_to'   => $emailTo,
            'status'     => 'active',
            'created_at' => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM),
            'expires_at' => $expiresAt,
            'revoked_at' => null,
            'notes'      => $notes,
        ];

        $tokens = $this->loadTokens();
        $tokens[$hash] = $entry;
        $this->saveTokens($tokens);

        return ['token' => $rawToken, 'entry' => $entry];
    }

    /**
     * Lista todos os tokens com metadados (sem revelar o hash ou o token puro).
     *
     * @return array<int, array<string, mixed>>
     */
    public function list(): array
    {
        $result = [];
        foreach ($this->loadTokens() as $hash => $entry) {
            $result[] = array_merge($entry, ['hash_preview' => substr($hash, 0, 8) . '...']);
        }
        return $result;
    }

    /**
     * Altera o status de um token identificado pelo short_id.
     *
     * @param  string $shortId  Os primeiros 8 caracteres hex do token
     * @param  string $status   'active' | 'inactive' | 'revoked'
     * @return bool
     */
    public function setStatus(string $shortId, string $status): bool
    {
        $allowed = ['active', 'inactive', 'revoked'];
        if (!in_array($status, $allowed, true)) {
            return false;
        }

        $tokens = $this->loadTokens();
        foreach ($tokens as $hash => &$entry) {
            if ($entry['short_id'] === $shortId) {
                $entry['status'] = $status;
                if ($status === 'revoked') {
                    $entry['revoked_at'] = (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM);
                }
                $this->saveTokens($tokens);
                return true;
            }
        }

        return false;
    }

    /**
     * Adiciona um domínio à lista de um token.
     */
    public function addDomain(string $shortId, string $domain): bool
    {
        $tokens = $this->loadTokens();
        foreach ($tokens as $hash => &$entry) {
            if ($entry['short_id'] === $shortId) {
                $domain = strtolower(trim($domain));
                if (!in_array($domain, $entry['domains'], true)) {
                    $entry['domains'][] = $domain;
                    $this->saveTokens($tokens);
                }
                return true;
            }
        }
        return false;
    }

    /**
     * Remove um domínio da lista de um token.
     */
    public function removeDomain(string $shortId, string $domain): bool
    {
        $tokens = $this->loadTokens();
        foreach ($tokens as $hash => &$entry) {
            if ($entry['short_id'] === $shortId) {
                $domain = strtolower(trim($domain));
                $entry['domains'] = array_values(
                    array_filter($entry['domains'], fn($d) => $d !== $domain)
                );
                $this->saveTokens($tokens);
                return true;
            }
        }
        return false;
    }

    /**
     * Retorna dados de um token pelo short_id.
     *
     * @return array<string, mixed>|null
     */
    public function find(string $shortId): ?array
    {
        foreach ($this->loadTokens() as $entry) {
            if ($entry['short_id'] === $shortId) {
                return $entry;
            }
        }
        return null;
    }

    // ----------------------------------------------------------------
    //  Internos
    // ----------------------------------------------------------------

    /** @return array<string, array<string, mixed>> */
    private function loadTokens(): array
    {
        $fp = fopen($this->filePath, 'r');
        if (!$fp) {
            return [];
        }
        flock($fp, LOCK_SH);
        $contents = stream_get_contents($fp);
        flock($fp, LOCK_UN);
        fclose($fp);

        $data = json_decode($contents ?: '{}', true);
        return is_array($data['tokens'] ?? null) ? $data['tokens'] : [];
    }

    /** @param array<string, array<string, mixed>> $tokens */
    private function saveTokens(array $tokens): void
    {
        $data = [
            'version'    => 1,
            'updated_at' => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM),
            'tokens'     => $tokens,
        ];

        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        $fp = fopen($this->filePath, 'c');
        if (!$fp) {
            throw new \RuntimeException("Não foi possível abrir o arquivo de tokens: {$this->filePath}");
        }
        flock($fp, LOCK_EX);
        ftruncate($fp, 0);
        fwrite($fp, $json);
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
    }

    private function ensureFileExists(): void
    {
        if (!file_exists($this->filePath)) {
            $dir = dirname($this->filePath);
            if (!is_dir($dir)) {
                mkdir($dir, 0750, true);
            }
            $data = json_encode(
                ['version' => 1, 'updated_at' => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM), 'tokens' => []],
                JSON_PRETTY_PRINT
            );
            file_put_contents($this->filePath, $data);
        }
    }

    private function hash(string $token): string
    {
        return hash('sha256', $token);
    }

    private function extractHost(string $origin): string
    {
        $host = parse_url($origin, PHP_URL_HOST) ?: '';
        // Remove porta, se houver
        return strtolower(explode(':', $host)[0]);
    }

    private function isLocalhost(string $origin): bool
    {
        $host = $this->extractHost($origin);
        return in_array($host, ['localhost', '127.0.0.1', '::1'], true);
    }

    private function isOriginAllowedForToken(string $origin, array $domains): bool
    {
        if (ALLOW_LOCALHOST && $this->isLocalhost($origin)) {
            return true;
        }

        $host = $this->extractHost($origin);
        if (empty($host)) {
            return false;
        }

        return $this->hostMatchesDomains($host, $domains);
    }

    private function hostMatchesDomains(string $host, array $domains): bool
    {
        foreach ($domains as $domain) {
            $domain = strtolower(trim($domain));

            // Wildcard: *.exemplo.com cobre qualquer subdomínio
            if (str_starts_with($domain, '*.')) {
                $root = substr($domain, 2);
                if ($host === $root || str_ends_with($host, '.' . $root)) {
                    return true;
                }
                continue;
            }

            if ($host === $domain) {
                return true;
            }
        }
        return false;
    }

    private function log(string $message): void
    {
        if (!LOG_ENABLED || !LOG_FILE) {
            return;
        }
        $line = '[' . date('Y-m-d H:i:s') . '] ' . $message . PHP_EOL;
        file_put_contents(LOG_FILE, $line, FILE_APPEND | LOCK_EX);
    }
}
