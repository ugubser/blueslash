import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// Parse root .env file
const envFile = readFileSync(resolve(rootDir, '.env'), 'utf8');
const env = {};
for (const line of envFile.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIndex = trimmed.indexOf('=');
  if (eqIndex === -1) continue;
  env[trimmed.slice(0, eqIndex)] = trimmed.slice(eqIndex + 1);
}

// 1. Generate functions/.env (OpenRouter config)
const functionsEnv = Object.entries(env)
  .filter(([key]) => key.startsWith('OPENROUTER_'))
  .map(([key, val]) => `${key}=${val}`)
  .join('\n');
writeFileSync(resolve(rootDir, 'functions/.env'), functionsEnv + '\n');
console.log('Generated functions/.env');

// 2. Generate extensions/firestore-send-email.env
mkdirSync(resolve(rootDir, 'extensions'), { recursive: true });

const extensionEnv = `DATABASE=(default)
DATABASE_REGION=eur3
firebaseextensions.v1beta.function/location=europe-west3
AUTH_TYPE=UsernamePassword
SMTP_CONNECTION_URI=${env.SMTP_CONNECTION_URI || ''}
DEFAULT_FROM=${env.MAIL_FROM || ''}
DEFAULT_REPLY_TO=${env.MAIL_REPLY_TO || ''}
MAIL_COLLECTION=mail
USERS_COLLECTION=users
TEMPLATES_COLLECTION=mail_templates
TTL_EXPIRE_TYPE=Never
TTL_EXPIRE_VALUE=1
TLS_OPTIONS={}`;
writeFileSync(resolve(rootDir, 'extensions/firestore-send-email.env'), extensionEnv + '\n');
console.log('Generated extensions/firestore-send-email.env');

// 3. Generate extensions/firestore-send-email.secret
writeFileSync(resolve(rootDir, 'extensions/firestore-send-email.secret'), `SMTP_PASSWORD=${env.SMTP_PASSWORD || ''}\n`);
console.log('Generated extensions/firestore-send-email.secret');
