export const prerender = false;

import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { Resend } from 'resend';
import siteConfig from '@/config/site.config';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.email('Please enter a valid email address'),
  subject: z.string().max(200).optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
  honeypot: z.string().max(0), // Anti-spam: must be empty
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();

    const data = {
      name: formData.get('name')?.toString() || '',
      email: formData.get('email')?.toString() || '',
      subject: formData.get('subject')?.toString() || '',
      message: formData.get('message')?.toString() || '',
      honeypot: formData.get('_honeypot')?.toString() || '',
    };

    // Validate
    const result = contactSchema.safeParse(data);

    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const error of result.error.issues) {
        const field = error.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(error.message);
      }

      return new Response(
        JSON.stringify({ success: false, errors: fieldErrors }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Honeypot check (bot detection)
    if (result.data.honeypot) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Send email via Resend
    const apiKey = import.meta.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY is not set');
      return new Response(
        JSON.stringify({ success: false, errors: { form: ['Email service is not configured'] } }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(apiKey);

    const toEmail = siteConfig.email;
    const fromEmail = import.meta.env.RESEND_FROM_EMAIL || toEmail;
    const siteLabel = siteConfig.name;

    const { name, email: replyEmail, message } = result.data;
    const subjectLine = result.data.subject || `Contato via ${siteLabel}`;
    const emailSubject = `[${siteLabel}] ${subjectLine}`;

    const safeMessage = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
    const safeSubject = subjectLine.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Cabeçalho -->
        <tr>
          <td style="background-color:#3b82f6;border-radius:12px 12px 0 0;padding:28px 40px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">${siteLabel}</p>
            <p style="margin:6px 0 0;color:#bfdbfe;font-size:13px;">Nova mensagem recebida via formulário de contato</p>
          </td>
        </tr>

        <!-- Corpo -->
        <tr>
          <td style="background-color:#ffffff;padding:32px 40px;">

            <!-- Tabela de dados zebrada -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #e4e4e7;">
              <tr style="background-color:#f4f4f5;">
                <td style="padding:10px 16px;font-size:11px;font-weight:700;color:#71717a;text-transform:uppercase;letter-spacing:0.6px;width:28%;">Campo</td>
                <td style="padding:10px 16px;font-size:11px;font-weight:700;color:#71717a;text-transform:uppercase;letter-spacing:0.6px;">Informação</td>
              </tr>
              <tr style="background-color:#ffffff;">
                <td style="padding:13px 16px;font-size:13px;font-weight:600;color:#52525b;border-top:1px solid #e4e4e7;">Nome</td>
                <td style="padding:13px 16px;font-size:14px;color:#18181b;border-top:1px solid #e4e4e7;">${name}</td>
              </tr>
              <tr style="background-color:#f9f9fb;">
                <td style="padding:13px 16px;font-size:13px;font-weight:600;color:#52525b;border-top:1px solid #e4e4e7;">E-mail</td>
                <td style="padding:13px 16px;font-size:14px;border-top:1px solid #e4e4e7;"><a href="mailto:${replyEmail}" style="color:#3b82f6;text-decoration:none;font-weight:500;">${replyEmail}</a></td>
              </tr>
              <tr style="background-color:#ffffff;">
                <td style="padding:13px 16px;font-size:13px;font-weight:600;color:#52525b;border-top:1px solid #e4e4e7;">Assunto</td>
                <td style="padding:13px 16px;font-size:14px;color:#18181b;border-top:1px solid #e4e4e7;">${safeSubject}</td>
              </tr>
            </table>

            <!-- Mensagem -->
            <div style="margin-top:24px;">
              <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#71717a;text-transform:uppercase;letter-spacing:0.6px;">Mensagem</p>
              <div style="background-color:#f9f9fb;border:1px solid #e4e4e7;border-left:3px solid #3b82f6;border-radius:0 8px 8px 0;padding:16px 20px;">
                <p style="margin:0;font-size:14px;color:#18181b;line-height:1.7;">${safeMessage}</p>
              </div>
            </div>

            <!-- Botão de resposta -->
            <div style="margin-top:28px;text-align:center;">
              <a href="mailto:${replyEmail}?subject=Re%3A%20${encodeURIComponent(subjectLine)}" style="display:inline-block;background-color:#3b82f6;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">Responder para ${name}</a>
            </div>

          </td>
        </tr>

        <!-- Rodapé -->
        <tr>
          <td style="background-color:#f4f4f5;border-radius:0 0 12px 12px;padding:18px 40px;text-align:center;border-top:1px solid #e4e4e7;">
            <p style="margin:0;font-size:12px;color:#a1a1aa;">Enviado via <a href="https://monto.ia.br" style="color:#3b82f6;text-decoration:none;">monto.ia.br</a> · Responda diretamente a este e-mail para falar com o remetente</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const { error } = await resend.emails.send({
      from: `${siteLabel} <${fromEmail}>`,
      to: toEmail,
      replyTo: replyEmail,
      subject: emailSubject,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return new Response(
        JSON.stringify({ success: false, errors: { form: [error.message || 'Failed to send email'] } }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Contact form error:', error);

    return new Response(
      JSON.stringify({ success: false, errors: { form: ['An unexpected error occurred'] } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
