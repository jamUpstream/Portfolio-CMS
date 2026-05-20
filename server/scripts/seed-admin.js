import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const email = process.env.ADMIN_EMAIL || 'admin@panel.com';
const password = process.env.ADMIN_PASSWORD || 'admin123panel';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server/.env');
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const { data: created, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true
});

if (error && !/already registered|already been registered|already exists/i.test(error.message)) {
  console.error(error.message);
  process.exit(1);
}

if (error) {
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error(listError.message);
    process.exit(1);
  }

  const existing = users.users.find((user) => user.email === email);
  if (!existing) {
    console.error(`User ${email} already exists error was returned, but user was not found.`);
    process.exit(1);
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true
  });

  if (updateError) {
    console.error(updateError.message);
    process.exit(1);
  }

  console.log(`Updated admin user: ${email}`);
} else {
  console.log(`Created admin user: ${created.user.email}`);
}
