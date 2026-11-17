/**
 * Production Email Dispatcher Service for Magic Link Authentication
 * ─────────────────────────────────────────────────────────────────
 * Supports Resend, Postmark, and custom SMTP/Webhooks.
 * Fails safely in production if no provider is configured (no silent fake success).
 */

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export class EmailService {
  /**
   * Dispatches transactional email using configured provider.
   */
  static async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; provider: string; messageId?: string }> {
    const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL)
    const resendKey = process.env.RESEND_API_KEY
    const postmarkToken = process.env.POSTMARK_SERVER_TOKEN
    const fromAddress = process.env.EMAIL_FROM || 'Ada Security <security@ada.ai>'

    // 1. Resend Provider
    if (resendKey && resendKey.trim().length > 0) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [options.to],
            subject: options.subject,
            html: options.html,
            text: options.text || options.html.replace(/<[^>]+>/g, ''),
          }),
        })

        if (!res.ok) {
          const errBody = await res.text()
          throw new Error(`Resend API HTTP ${res.status}: ${errBody}`)
        }

        const data = await res.json()
        return { success: true, provider: 'resend', messageId: data.id }
      } catch (err: any) {
        console.error('[EmailService] Resend dispatch failed:', err.message)
        if (isProd) throw err
      }
    }

    // 2. Postmark Provider
    if (postmarkToken && postmarkToken.trim().length > 0) {
      try {
        const res = await fetch('https://api.postmarkapp.com/email', {
          method: 'POST',
          headers: {
            'X-Postmark-Server-Token': postmarkToken.trim(),
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            From: fromAddress,
            To: options.to,
            Subject: options.subject,
            HtmlBody: options.html,
            TextBody: options.text || options.html.replace(/<[^>]+>/g, ''),
          }),
        })

        if (!res.ok) {
          const errBody = await res.text()
          throw new Error(`Postmark API HTTP ${res.status}: ${errBody}`)
        }

        const data = await res.json()
        return { success: true, provider: 'postmark', messageId: data.MessageID }
      } catch (err: any) {
        console.error('[EmailService] Postmark dispatch failed:', err.message)
        if (isProd) throw err
      }
    }

    // 3. Fallback / Dev Mode
    if (isProd && process.env.ENABLE_TEST_AUTH !== 'true') {
      throw new Error(
        'FATAL [EmailService]: No transactional email provider configured (RESEND_API_KEY or POSTMARK_SERVER_TOKEN required in production).'
      )
    }

    console.log(`[EmailService DEV] Simulated email dispatched to ${options.to} (${options.subject})`)
    return { success: true, provider: 'dev-console' }
  }

  /**
   * Helper: Dispatches Magic Login Link
   */
  static async sendMagicLink(email: string, rawToken: string, origin = 'http://localhost:5173'): Promise<void> {
    const magicUrl = `${origin.replace(/\/$/, '')}/login/verify?email=${encodeURIComponent(email)}&token=${encodeURIComponent(rawToken)}`

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #1e293b; border-radius: 8px; background-color: #0f172a; color: #f8fafc;">
        <h2 style="color: #00f3ff; margin-bottom: 16px;">Ada System — Secure Magic Login Link</h2>
        <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6;">
          You requested a secure, passwordless authentication link for your Ada account (<strong>${email}</strong>).
        </p>
        <div style="margin: 32px 0;">
          <a href="${magicUrl}" style="background-color: #00f3ff; color: #020617; text-decoration: none; font-weight: bold; padding: 12px 28px; border-radius: 6px; display: inline-block;">
            Verify & Sign In to Ada
          </a>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
          This link will expire in <strong>15 minutes</strong> and can only be used once.<br/>
          If you did not request this link, you can safely ignore this email.
        </p>
        <hr style="border: 0; border-top: 1px solid #1e293b; margin: 24px 0;" />
        <p style="color: #475569; font-size: 11px;">
          Security Verification Code: <code style="color: #94a3b8;">${rawToken}</code>
        </p>
      </div>
    `

    await this.sendEmail({
      to: email,
      subject: 'Ada System — Your Magic Login Link',
      html,
    })
  }
}
