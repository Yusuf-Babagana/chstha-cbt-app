// One-step project setup: creates .env, generates the Prisma client,
// creates the SQLite database and seeds a demo student.
import { existsSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { execSync } from 'node:child_process';

if (!existsSync('.env')) {
  copyFileSync('.env.example', '.env');
  const env = readFileSync('.env', 'utf8').replace(
    'replace-me-with-a-long-random-string',
    randomBytes(32).toString('hex')
  );
  writeFileSync('.env', env);
  console.log('Created .env (edit ADMIN_USERNAME / ADMIN_PASSWORD before going live).');
} else {
  console.log('.env already exists - keeping it.');
}

const run = (cmd) => execSync(cmd, { stdio: 'inherit' });
run('npx prisma generate');
run('npx prisma migrate deploy');
run('npx prisma db seed');
console.log('\nSetup complete. Start the app with: npm run dev');
