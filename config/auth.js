import 'dotenv/config';

export function validateJwtSecret(secret) {
  if (typeof secret !== 'string' || secret.length < 32 ||
      /super_secret_jwt_key|your_jwt_secret|change.?me/i.test(secret)) {
    throw new Error('JWT_SECRET wajib berupa rahasia acak minimal 32 karakter.');
  }
  return secret;
}

export const JWT_SECRET = validateJwtSecret(process.env.JWT_SECRET);
