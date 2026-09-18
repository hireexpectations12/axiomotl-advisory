import { createClient } from '@supabase/supabase-js';
const options = { auth: { persistSession: false } };
const service = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, options);
const guest = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, options);
const key = `verification/${crypto.randomUUID()}.json`;
const bucket = 'owner-enquiries';
try {
  const write = await service.storage.from(bucket).upload(key, '{"verification":true}', { contentType: 'application/json', upsert: false });
  if (write.error) throw new Error('Private storage write failed');
  const read = await service.storage.from(bucket).download(key);
  if (read.error) throw new Error('Private storage read failed');
  const denied = await guest.storage.from(bucket).download(key);
  if (!denied.error) throw new Error('Anonymous access must be denied');
  console.log('Private enquiry write/read passed; anonymous download denied.');
} finally {
  const removed = await service.storage.from(bucket).remove([key]);
  if (removed.error) throw new Error('Verification file cleanup failed');
}
