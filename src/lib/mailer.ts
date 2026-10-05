/**
 * Email sending. There is no email service yet, so messages are printed to
 * the server terminal. To send real email, replace the body of sendEmail()
 * with a provider call (Resend, SendGrid, SES, SMTP...) and set its API key
 * in .env.local. Callers do not need to change.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  console.log(
    [
      "",
      "──────── EMAIL (dev mode: not actually sent) ────────",
      `To:      ${message.to}`,
      `Subject: ${message.subject}`,
      "",
      message.text,
      "──────────────────────────────────────────────────────",
      "",
    ].join("\n"),
  );
}

/** True while no real email provider is configured. */
export const isDevMailer = true;
