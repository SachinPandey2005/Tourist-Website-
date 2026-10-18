import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000), // 15 mins
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100), // 100 requests per window
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
