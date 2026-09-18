import { createClient } from "@supabase/supabase-js";
const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const name = "owner-enquiries";
const existing = await db.storage.getBucket(name);
if (existing.data?.public)
  throw new Error(
    "Enquiry bucket must be private; refusing to use public storage.",
  );
if (!existing.data) {
  const result = await db.storage.createBucket(name, {
    public: false,
    fileSizeLimit: 65536,
    allowedMimeTypes: ["application/json"],
  });
  if (result.error)
    throw new Error("Could not create private enquiry storage.");
}
const verify = await db.storage.getBucket(name);
if (verify.error || verify.data.public)
  throw new Error("Private storage verification failed.");
console.log("Private enquiry storage ready. No emails sent.");
