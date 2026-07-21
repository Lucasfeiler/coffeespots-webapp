import { Resend } from 'resend';

let resend = null;
function getResend() {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY is not set');
    resend = new Resend(apiKey);
  }
  return resend;
}

export async function sendPasswordResetEmail(to, resetUrl) {
  const result = await getResend().emails.send({
    from: 'CoffeeSpots <onboarding@resend.dev>',
    to,
    subject: 'Reset your CoffeeSpots password',
    html: `
      <p>Someone requested a password reset for your CoffeeSpots account.</p>
      <p><a href="${resetUrl}">Click here to set a new password</a>. This link expires in 1 hour.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });

  // The Resend SDK doesn't throw on API-level failures -- it returns them in
  // result.error instead, so this has to be checked explicitly.
  if (result.error) {
    throw new Error(`Resend API error: ${result.error.message || JSON.stringify(result.error)}`);
  }

  return result;
}
