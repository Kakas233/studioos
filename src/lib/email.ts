import { Resend } from "resend";

let resendInstance: Resend | null = null;

function getResend() {
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

// ─── Shared email wrapper matching original Base44 dark/gold theme ───

const YEAR = new Date().getFullYear();

function emailWrapper(bodyHtml: string): string {
  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #050505;">
      <div style="padding: 40px 32px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <span style="font-size: 22px; font-weight: 600; background: linear-gradient(to right, #C9A84C, #E8D48B); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -0.02em;">StudioOS</span>
        </div>
        <div style="background: #0A0A0A; border-radius: 16px; padding: 40px 32px; border: 1px solid rgba(201, 168, 76, 0.1);">
          ${bodyHtml}
        </div>
        <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.04);">
          <p style="color: rgba(168, 164, 154, 0.2); font-size: 11px; margin: 0;">
            &copy; ${YEAR} StudioOS. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  `;
}

function goldButton(text: string, href: string): string {
  return `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${href}"
         style="background: linear-gradient(to right, #C9A84C, #E8D48B); color: #000000; padding: 14px 40px; border-radius: 100px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
        ${text}
      </a>
    </div>
  `;
}

// ─── Email sending helper ───

interface SendResult {
  success: boolean;
  error?: string;
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  from = "StudioOS <noreply@getstudioos.com>"
): Promise<SendResult> {
  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
    });
    if (error) {
      console.error("Resend email error:", JSON.stringify(error));
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error("Email send error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ─── Remove from suppression list (for invite emails) ───

async function removeFromSuppressionList(email: string): Promise<boolean> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return false;

    const listRes = await fetch("https://api.resend.com/suppressions", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!listRes.ok) return false;

    const listData = await listRes.json();
    const suppressions = listData.data || [];
    const match = suppressions.find((s: { email: string; id: string }) => s.email === email);
    if (!match) return false;

    const delRes = await fetch(`https://api.resend.com/suppressions/${match.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return delRes.ok;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════
// EMAIL TEMPLATES
// ═══════════════════════════════════════════════════

// 1. Email Verification (signup)
export async function sendVerificationEmail(
  to: string,
  firstName: string,
  studioName: string,
  verifyUrl: string
): Promise<SendResult> {
  const html = emailWrapper(`
    <h2 style="color: #ffffff; font-size: 20px; font-weight: 500; margin: 0 0 8px 0;">Welcome, ${firstName}!</h2>
    <p style="color: #A8A49A; font-size: 14px; line-height: 1.7; margin: 0 0 12px 0;">
      Your studio <strong style="color: #C9A84C;">${studioName}</strong> has been created with a <strong style="color: #C9A84C;">7-day free trial</strong>.
    </p>
    <p style="color: #A8A49A; font-size: 14px; line-height: 1.7; margin: 0 0 28px 0;">
      Verify your email to activate your account and start managing your studio.
    </p>
    ${goldButton("Verify Email Address", verifyUrl)}
    <p style="color: rgba(168, 164, 154, 0.4); font-size: 13px; line-height: 1.6; margin: 0;">
      This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.
    </p>
    <div style="margin-top: 24px; padding: 0 8px;">
      <p style="color: rgba(168, 164, 154, 0.25); font-size: 11px; line-height: 1.6;">
        If the button doesn't work, copy and paste this link:<br/>
        <a href="${verifyUrl}" style="color: rgba(201, 168, 76, 0.5); text-decoration: none; word-break: break-all;">${verifyUrl}</a>
      </p>
    </div>
  `);

  return sendEmail(to, "Verify your StudioOS account", html);
}

// 2. Team Member Invite
export async function sendInviteEmail(
  to: string,
  password: string,
  role: string,
  studioName: string
): Promise<SendResult> {
  // Remove from suppression list first
  await removeFromSuppressionList(to.toLowerCase().trim());

  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  const html = emailWrapper(`
    <h2 style="color: #ffffff; font-size: 20px; font-weight: 500; margin: 0 0 8px 0;">You've been invited!</h2>
    <p style="color: #A8A49A; font-size: 14px; line-height: 1.7; margin: 0 0 24px 0;">
      <strong style="color: #C9A84C;">${studioName}</strong> has invited you to join their team as <strong style="color: #ffffff;">${roleLabel}</strong>.
    </p>
    <div style="background: rgba(201, 168, 76, 0.08); border: 1px solid rgba(201, 168, 76, 0.2); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <p style="color: rgba(168, 164, 154, 0.6); font-size: 12px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.05em;">Your Login Credentials</p>
      <div style="margin-bottom: 8px;">
        <span style="color: rgba(168, 164, 154, 0.5); font-size: 12px;">Email:</span>
        <span style="color: #ffffff; font-size: 14px; font-weight: 500; margin-left: 8px;">${to}</span>
      </div>
      <div>
        <span style="color: rgba(168, 164, 154, 0.5); font-size: 12px;">Password:</span>
        <span style="color: #C9A84C; font-size: 14px; font-weight: 600; margin-left: 8px; font-family: monospace;">${password}</span>
      </div>
    </div>
    ${goldButton("Log In", "https://getstudioos.com/sign-in")}
    <p style="color: rgba(168, 164, 154, 0.4); font-size: 12px; line-height: 1.6; margin: 0;">
      If you weren't expecting this invitation, you can safely ignore this email.
    </p>
  `);

  return sendEmail(
    to,
    `You've been invited to join ${studioName} on StudioOS`,
    html
  );
}

// 3. Temporary Password (forgot password)
export async function sendTempPasswordEmail(
  to: string,
  tempPassword: string,
  studioName: string
): Promise<SendResult> {
  const html = emailWrapper(`
    <h2 style="color: #ffffff; font-size: 20px; font-weight: 500; margin: 0 0 8px 0;">Password Reset</h2>
    <p style="color: #A8A49A; font-size: 14px; line-height: 1.7; margin: 0 0 24px 0;">
      A password reset was requested for your account on <strong style="color: #C9A84C;">${studioName}</strong>.
    </p>
    <div style="background: rgba(201, 168, 76, 0.08); border: 1px solid rgba(201, 168, 76, 0.2); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
      <p style="color: rgba(168, 164, 154, 0.6); font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.05em;">Temporary Password</p>
      <p style="color: #C9A84C; font-size: 24px; font-weight: 600; margin: 0; letter-spacing: 2px; font-family: monospace;">${tempPassword}</p>
    </div>
    <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
      <p style="color: #ffffff; font-size: 13px; font-weight: 500; margin: 0 0 8px 0;">Next Steps:</p>
      <ol style="color: #A8A49A; font-size: 13px; line-height: 1.8; margin: 0; padding-left: 16px;">
        <li>Sign in using the temporary password above</li>
        <li>Go to <strong style="color: #C9A84C;">Users</strong> tab in the sidebar</li>
        <li>Click the <strong style="color: #C9A84C;">edit</strong> button next to your account</li>
        <li>Set a new, secure password</li>
      </ol>
    </div>
    <p style="color: rgba(168, 164, 154, 0.4); font-size: 12px; line-height: 1.6; margin: 0;">
      If you didn't request this reset, please contact your studio administrator immediately. This temporary password will work until you change it.
    </p>
  `);

  return sendEmail(to, "Your Temporary Password \u2014 StudioOS", html);
}

// 4. Super Admin 2FA Code
export async function sendAdmin2FAEmail(
  to: string,
  code: string
): Promise<SendResult> {
  const html = emailWrapper(`
    <h2 style="color: #ffffff; font-size: 20px; font-weight: 500; margin: 0 0 8px 0;">Two-Factor Authentication</h2>
    <p style="color: #A8A49A; font-size: 14px; line-height: 1.7; margin: 0 0 24px 0;">
      Use the code below to complete your super admin login.
    </p>
    <div style="background: rgba(201, 168, 76, 0.08); border: 1px solid rgba(201, 168, 76, 0.2); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
      <p style="color: rgba(168, 164, 154, 0.6); font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.05em;">Verification Code</p>
      <p style="color: #C9A84C; font-size: 32px; font-weight: 700; margin: 0; letter-spacing: 6px; font-family: monospace;">${code}</p>
    </div>
    <p style="color: rgba(168, 164, 154, 0.4); font-size: 12px; line-height: 1.6; margin: 0;">
      This code expires in 10 minutes. If you didn't attempt to log in, your account may be compromised.
    </p>
  `);

  return sendEmail(to, "StudioOS Super Admin \u2014 2FA Code", html);
}

// 5. Trial Reminder — 3 Days Left
export async function sendTrial3DayEmail(
  to: string,
  studioName: string,
  subdomain: string
): Promise<SendResult> {
  const html = emailWrapper(`
    <h2 style="color: #fff; font-size: 20px; margin: 0 0 12px;">Your trial ends in 3 days</h2>
    <p style="color: #A8A49A; font-size: 14px; line-height: 1.7;">
      Your free trial for <strong style="color: #C9A84C;">${studioName}</strong> will expire in 3 days.
    </p>
    <p style="color: #A8A49A; font-size: 14px; line-height: 1.7;">
      To keep all your data and continue using StudioOS, choose a plan before your trial ends.
    </p>
    ${goldButton("Choose a Plan", `https://getstudioos.com/billing`)}
  `);

  return sendEmail(to, "StudioOS: 3 days left on your free trial", html);
}

// 6. Trial Reminder — 1 Day Left
export async function sendTrial1DayEmail(
  to: string,
  studioName: string,
  subdomain: string
): Promise<SendResult> {
  const html = emailWrapper(`
    <h2 style="color: #fff; font-size: 20px; margin: 0 0 12px;">Last day of your free trial</h2>
    <p style="color: #A8A49A; font-size: 14px; line-height: 1.7;">
      Your free trial for <strong style="color: #C9A84C;">${studioName}</strong> expires <strong style="color: #fff;">tomorrow</strong>.
    </p>
    <p style="color: #A8A49A; font-size: 14px; line-height: 1.7;">
      After expiration, your team won't be able to access the studio. All your data will be preserved &mdash; just subscribe to restore access.
    </p>
    ${goldButton("Subscribe Now", `https://getstudioos.com/billing`)}
  `);

  return sendEmail(to, "\u26A0\uFE0F StudioOS: Your trial expires tomorrow", html);
}

// 7. Trial Expired
export async function sendTrialExpiredEmail(
  to: string,
  studioName: string,
  subdomain: string
): Promise<SendResult> {
  const TYPEFORM_URL = "https://form.typeform.com/to/nG2a9HHD";

  const html = emailWrapper(`
    <h2 style="color: #fff; font-size: 20px; margin: 0 0 12px;">We're sad to see you go</h2>
    <p style="color: #A8A49A; font-size: 14px; line-height: 1.7;">
      Your free trial for <strong style="color: #C9A84C;">${studioName}</strong> has ended, and your studio has been paused.
    </p>
    <p style="color: #A8A49A; font-size: 14px; line-height: 1.7;">
      We really enjoyed having you! Your data is safely stored &mdash; if you ever want to come back, just subscribe to instantly restore everything.
    </p>
    <p style="color: #A8A49A; font-size: 14px; line-height: 1.7; margin-top: 20px;">
      <strong style="color: #fff;">Special Offer:</strong> Tell us about your experience and get <strong style="color: #C9A84C;">50% off your first month</strong> on any plan.
    </p>
    ${goldButton("Share Feedback & Get 50% Off", TYPEFORM_URL)}
    <div style="text-align: center; margin-top: 12px;">
      <a href="https://getstudioos.com/billing"
         style="color: #C9A84C; text-decoration: none; font-size: 13px;">
        Or subscribe at full price &rarr;
      </a>
    </div>
  `);

  return sendEmail(to, "StudioOS: Your free trial has ended", html);
}

// 8. Account Suspended (grace period expired / payment overdue)
export async function sendSuspendedEmail(
  to: string,
  studioName: string
): Promise<SendResult> {
  const html = emailWrapper(`
    <h2 style="color: #fff; font-size: 20px; margin: 0 0 12px;">Account Suspended</h2>
    <p style="color: #A8A49A; font-size: 14px; line-height: 1.7;">
      Your studio <strong style="color: #C9A84C;">${studioName}</strong> has been suspended due to an unpaid subscription.
    </p>
    <p style="color: #A8A49A; font-size: 14px; line-height: 1.7;">
      Update your payment method to reactivate immediately.
    </p>
    ${goldButton("Update Payment", "https://getstudioos.com/billing")}
  `);

  return sendEmail(to, "StudioOS: Account Suspended \u2014 Payment Required", html);
}

// 9. Payment Failed
export async function sendPaymentFailedEmail(
  to: string,
  studioName: string,
  graceDaysRemaining: number
): Promise<SendResult> {
  const html = emailWrapper(`
    <h2 style="color: #fff; font-size: 20px; margin: 0 0 12px;">Payment Failed</h2>
    <p style="color: #A8A49A; font-size: 14px; line-height: 1.7;">
      We were unable to process your payment for <strong style="color: #C9A84C;">${studioName}</strong>.
    </p>
    <p style="color: #A8A49A; font-size: 14px; line-height: 1.7;">
      You have <strong style="color: #ffffff;">${graceDaysRemaining} days</strong> to update your payment method before your studio is suspended.
    </p>
    ${goldButton("Update Payment Method", "https://getstudioos.com/billing")}
    <p style="color: rgba(168, 164, 154, 0.4); font-size: 12px; line-height: 1.6; margin: 0;">
      If you believe this is a mistake, please contact support@getstudioos.com.
    </p>
  `);

  return sendEmail(to, "StudioOS: Payment Failed \u2014 Action Required", html);
}
