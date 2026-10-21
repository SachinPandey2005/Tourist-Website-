import { env } from '../config/env.js';

export interface EmailDeliveryResult {
  delivered: boolean;
  provider: string;
  previewUrl?: string;
  message: string;
}

export class EmailService {
  /**
   * Configurable password reset delivery.
   * Does NOT falsely pretend emails were sent when no provider is configured.
   */
  static async sendPasswordResetEmail(
    recipientEmail: string,
    rawResetToken: string
  ): Promise<EmailDeliveryResult> {
    const resetUrl = `${env.APP_URL}/reset-password?token=${rawResetToken}`;

    switch (env.EMAIL_PROVIDER) {
      case 'console': {
        // Safe development mode: Print token/link to console without pretending an email was dispatched
        console.log('\n======================================================');
        console.log('📨 [EMAIL SERVICE - CONSOLE MODE (No external provider)]');
        console.log(`Recipient: ${recipientEmail}`);
        console.log(`Reset Token: ${rawResetToken}`);
        console.log(`Reset Link: ${resetUrl}`);
        console.log('Expires In: 15 minutes');
        console.log('======================================================\n');

        return {
          delivered: false,
          provider: 'console',
          previewUrl: resetUrl,
          message: 'Password reset token generated. In development mode (no external email provider configured), use the provided token or check server console.',
        };
      }

      case 'none': {
        console.warn(`⚠️ Password reset requested for ${recipientEmail}, but EMAIL_PROVIDER is set to "none".`);
        return {
          delivered: false,
          provider: 'none',
          message: 'Email delivery is disabled on this server. Contact system administrator for password assistance.',
        };
      }

      case 'smtp':
      case 'sendgrid':
      case 'resend': {
        // Future production providers (e.g. Resend, Sendgrid, SMTP)
        // If credentials are not present, do not pretend delivery succeeded
        console.warn(`⚠️ Configured email provider [${env.EMAIL_PROVIDER}] lacks active credentials in environment.`);
        return {
          delivered: false,
          provider: env.EMAIL_PROVIDER,
          message: `Email provider [${env.EMAIL_PROVIDER}] is configured but active credentials are not verified.`,
        };
      }

      default: {
        return {
          delivered: false,
          provider: 'unknown',
          message: 'Unknown email provider configuration.',
        };
      }
    }
  }
}
