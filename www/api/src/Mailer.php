<?php
declare(strict_types=1);

namespace MontoAPI;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

/**
 * Mailer — Envio de emails via SMTP usando PHPMailer
 *
 * Constrói emails HTML + texto simples a partir dos dados do Formail.
 * A estrutura do email segue estas regras:
 *  - Campos "name" e "company": bloco destacado no topo do email
 *  - Campo "subject": concatenado no assunto (Formulário de Contato — {subject})
 *  - Campo "message": corpo principal
 *  - Campos extras: tabela de dados adicionais no rodapé do email
 */
final class Mailer
{
    private readonly string $emailTo;

    /** @param array<string, mixed> $tokenData */
    public function __construct(private readonly array $tokenData)
    {
        $this->emailTo = $tokenData['email_to'];
    }

    /**
     * Processa e envia o formulário de contato.
     *
     * @param  array<string, mixed> $data  Dados sanitizados do POST
     * @return array{success: bool, message: string}
     */
    public function sendFormail(array $data): array
    {
        // Extrai campos conhecidos
        $email   = $data['email']   ?? '';
        $message = $data['message'] ?? '';
        $name    = $data['name']    ?? '';
        $company = $data['company'] ?? '';
        $subject = $data['subject'] ?? '';

        // Campos extras (tudo que não é um campo conhecido)
        $extras = Validator::extractExtras($data);

        // Monta assunto do email
        $emailSubject = 'Formulário de Contato';
        if (!empty($subject)) {
            $emailSubject .= ' — ' . $subject;
        }

        // Remetente: usa o email enviado no formulário (Reply-To)
        $senderName = $name ?: $email;

        try {
            $mail = $this->buildMailer();

            $mail->addAddress($this->emailTo);
            $mail->addReplyTo($email, $senderName);
            $mail->Subject = $emailSubject;
            $mail->Body    = $this->buildHtml($email, $message, $name, $company, $subject, $extras);
            $mail->AltBody = $this->buildPlainText($email, $message, $name, $company, $subject, $extras);

            $mail->send();

            return ['success' => true, 'message' => 'Email enviado com sucesso.'];
        } catch (PHPMailerException $e) {
            $this->log('PHPMailer error: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Falha ao enviar o email. Tente novamente mais tarde.'];
        } catch (\Throwable $e) {
            $this->log('Unexpected error: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Erro interno ao processar o envio.'];
        }
    }

    // ----------------------------------------------------------------
    //  Construção do email
    // ----------------------------------------------------------------

    /**
     * @param array<string, string> $extras
     */
    private function buildHtml(
        string $email,
        string $message,
        string $name,
        string $company,
        string $subject,
        array  $extras
    ): string {
        $html  = $this->htmlHeader();
        $html .= '<div class="container">';

        // ── Cabeçalho ──────────────────────────────────────────────
        $displayTitle = !empty($subject) ? htmlspecialchars($subject) : 'Novo contato';
        $html .= '<div class="header"><h1>' . $displayTitle . '</h1></div>';

        // ── Bloco de identidade (name / company) ────────────────────
        if ($name || $company) {
            $html .= '<div class="identity-block">';
            if ($name) {
                $html .= '<div class="identity-item">';
                $html .= '<span class="identity-label">Nome</span>';
                $html .= '<span class="identity-value">' . htmlspecialchars($name) . '</span>';
                $html .= '</div>';
            }
            if ($company) {
                $html .= '<div class="identity-item">';
                $html .= '<span class="identity-label">Empresa</span>';
                $html .= '<span class="identity-value">' . htmlspecialchars($company) . '</span>';
                $html .= '</div>';
            }
            $html .= '<div class="identity-item">';
            $html .= '<span class="identity-label">Email</span>';
            $html .= '<span class="identity-value"><a href="mailto:' . htmlspecialchars($email) . '">' . htmlspecialchars($email) . '</a></span>';
            $html .= '</div>';
            $html .= '</div>';
        } else {
            // Sem name/company: mostra apenas o email de forma simples
            $html .= '<p class="sender-email">De: <a href="mailto:' . htmlspecialchars($email) . '">' . htmlspecialchars($email) . '</a></p>';
        }

        // ── Mensagem ────────────────────────────────────────────────
        $html .= '<div class="section"><h2>Mensagem</h2>';
        $html .= '<div class="message-body">' . nl2br(htmlspecialchars($message)) . '</div>';
        $html .= '</div>';

        // ── Dados adicionais (tabela) ────────────────────────────────
        if (!empty($extras)) {
            $html .= '<div class="section"><h2>Dados Adicionais</h2>';
            $html .= '<table class="extras-table">';
            $html .= '<thead><tr><th>Campo</th><th>Valor</th></tr></thead><tbody>';
            foreach ($extras as $key => $value) {
                $html .= '<tr>';
                $html .= '<td class="extras-key">' . htmlspecialchars(ucfirst($key)) . '</td>';
                $html .= '<td>' . htmlspecialchars($value) . '</td>';
                $html .= '</tr>';
            }
            $html .= '</tbody></table></div>';
        }

        $html .= '<div class="footer">Enviado via Monto API &mdash; ' . date('d/m/Y H:i') . '</div>';
        $html .= '</div>'; // container
        $html .= '</body></html>';

        return $html;
    }

    private function htmlHeader(): string
    {
        return <<<HTML
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                   background: #f5f5f5; margin: 0; padding: 20px; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background: #fff;
                         border-radius: 8px; overflow: hidden;
                         box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { background: #1a1a2e; color: #fff; padding: 24px 30px; }
            .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
            .identity-block { background: #f8f9ff; border-left: 4px solid #4f46e5;
                              padding: 16px 30px; }
            .identity-item { display: flex; gap: 12px; margin-bottom: 6px; }
            .identity-label { font-weight: 600; min-width: 80px; color: #4f46e5; font-size: 13px;
                              text-transform: uppercase; letter-spacing: 0.5px; }
            .identity-value { color: #1a1a2e; font-size: 15px; }
            .identity-value a { color: #4f46e5; text-decoration: none; }
            .sender-email { padding: 12px 30px; margin: 0; color: #666; }
            .sender-email a { color: #4f46e5; }
            .section { padding: 20px 30px; }
            .section h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;
                          color: #888; margin: 0 0 12px 0; }
            .message-body { background: #f9f9f9; border-radius: 6px; padding: 16px;
                            line-height: 1.6; color: #333; white-space: pre-wrap; font-size: 15px; }
            .extras-table { width: 100%; border-collapse: collapse; font-size: 14px; }
            .extras-table th { background: #1a1a2e; color: #fff; padding: 8px 12px;
                               text-align: left; font-weight: 600; }
            .extras-table td { padding: 8px 12px; border-bottom: 1px solid #eee; }
            .extras-table tr:last-child td { border-bottom: none; }
            .extras-key { color: #4f46e5; font-weight: 600; white-space: nowrap; }
            .footer { background: #f5f5f5; text-align: center; padding: 12px;
                      font-size: 12px; color: #aaa; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
        HTML;
    }

    /**
     * @param array<string, string> $extras
     */
    private function buildPlainText(
        string $email,
        string $message,
        string $name,
        string $company,
        string $subject,
        array  $extras
    ): string {
        $lines = [];

        if ($subject) {
            $lines[] = 'ASSUNTO: ' . $subject;
            $lines[] = str_repeat('-', 40);
        }

        if ($name)    $lines[] = 'NOME:    ' . $name;
        if ($company) $lines[] = 'EMPRESA: ' . $company;
        $lines[] = 'EMAIL:   ' . $email;

        $lines[] = '';
        $lines[] = 'MENSAGEM:';
        $lines[] = str_repeat('-', 40);
        $lines[] = $message;

        if (!empty($extras)) {
            $lines[] = '';
            $lines[] = 'DADOS ADICIONAIS:';
            $lines[] = str_repeat('-', 40);
            foreach ($extras as $key => $value) {
                $lines[] = strtoupper($key) . ': ' . $value;
            }
        }

        $lines[] = '';
        $lines[] = str_repeat('-', 40);
        $lines[] = 'Enviado via Monto API em ' . date('d/m/Y H:i');

        return implode(PHP_EOL, $lines);
    }

    // ----------------------------------------------------------------
    //  Configuração do PHPMailer
    // ----------------------------------------------------------------

    private function buildMailer(): PHPMailer
    {
        $mail = new PHPMailer(true);

        $mail->isSMTP();
        $mail->Host       = SMTP_HOST;
        $mail->Port       = SMTP_PORT;
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_USER;
        $mail->Password   = SMTP_PASS;
        $mail->SMTPSecure = match (strtolower(SMTP_SECURE)) {
            'ssl'  => PHPMailer::ENCRYPTION_SMTPS,
            default => PHPMailer::ENCRYPTION_STARTTLS,
        };

        $mail->CharSet  = PHPMailer::CHARSET_UTF8;
        $mail->setFrom(SMTP_FROM, SMTP_FROM_NAME);
        $mail->isHTML(true);

        // Debug apenas em desenvolvimento
        if (APP_ENV === 'development') {
            $mail->SMTPDebug = SMTP::DEBUG_SERVER;
        }

        return $mail;
    }

    private function log(string $message): void
    {
        if (!LOG_ENABLED || !LOG_FILE) {
            return;
        }
        $line = '[' . date('Y-m-d H:i:s') . '] [MAILER] ' . $message . PHP_EOL;
        file_put_contents(LOG_FILE, $line, FILE_APPEND | LOCK_EX);
    }
}
