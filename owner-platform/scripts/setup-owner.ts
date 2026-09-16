import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";
const email = process.argv[2];
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  throw new Error("Pass the owner email address.");
const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = process.env;
const appUrl = process.argv[3] || process.env.APP_URL;
if (!url || !key || !appUrl)
  throw new Error("Configure the local environment file first.");
const client = createClient(url, key, { auth: { persistSession: false } });
const { data: users, error: userError } = await client.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});
if (userError) throw new Error("Cannot verify the existing owner account.");
const existing = users.users.find(
  (user) => user.email?.toLowerCase() === email.toLowerCase(),
);
const { data, error } = await client.auth.admin.generateLink({
  type: existing ? "recovery" : "invite",
  email,
  options: { redirectTo: new URL("/auth/callback", appUrl).href },
});
if (error)
  throw new Error(`Could not create owner setup link: ${error.message}`);
const siteId = process.env.SITE_ID || "00000000-0000-4000-8000-000000000001";
const { error: memberError } = await client
  .from("memberships")
  .upsert({ site_id: siteId, user_id: data.user.id });
if (memberError)
  throw new Error("Could not add owner membership. Check the SQL migration.");
const setupUrl = new URL("/auth/callback", appUrl);
setupUrl.searchParams.set("token_hash", data.properties.hashed_token);
setupUrl.searchParams.set("type", existing ? "recovery" : "invite");
writeFileSync(
  ".owner-access.json",
  JSON.stringify({ email, url: setupUrl.href, userId: data.user.id }, null, 2),
);
writeFileSync(
  ".owner-access.txt",
  `Axiomotl owner access\n\nOwner: ${email}\n\nOpen this one-use link to set your password:\n${setupUrl.href}\n\nThis link is private. It expires and can be regenerated with scripts/setup-owner.ts.\n`,
);
console.log(
  "Owner membership created. Private one-use setup link saved locally; no email was sent.",
);
