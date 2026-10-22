import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000), // 15 mins
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100), // 100 requests per window
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').default('voyagevista_secure_jwt_secret_key_at_least_32_chars'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECRET: z.string().min(16).default('voyagevista_cookie_secret_key_32_chars'),
  EMAIL_PROVIDER: z.enum(['console', 'smtp', 'sendgrid', 'resend', 'none']).default('console'),
  APP_URL: z.string().url().default('http://localhost:5173'),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000), // 15 mins
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10), // 10 attempts per window for auth
  RAZORPAY_KEY_ID: z.string().default('rzp_test_placeholder_key_id'),
  RAZORPAY_KEY_SECRET: z.string().default('rzp_test_placeholder_key_secret'),
  RAZORPAY_WEBHOOK_SECRET: z.string().default('rzp_webhook_placeholder_secret'),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables configuration:');
    console.error(JSON.stringify(result.error.flatten().fieldErrors, null, 2));
    throw new Error('Invalid environment configuration');
  }

  return result.data;
};

export const env = parseEnv();
export type Environment = z.infer<typeof envSchema>;
