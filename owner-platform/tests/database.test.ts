import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
describe("database security and transactions", () => {
  it("enforces membership, restricted mutation RPC, stale versions and atomic restore/publish", async () => {
    const db = new PGlite();
    try {
      await db.exec(`
        create role anon; create role authenticated; create role service_role bypassrls;
        create schema auth; create schema storage;
        create table auth.users(id uuid primary key,email text);
        create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
        grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
        create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      `);
      await db.exec(
        readFileSync(
          resolve("supabase/migrations/001_owner_platform.sql"),
          "utf8",
        ),
      );
      await db.exec(
        readFileSync(
          resolve("supabase/migrations/002_conflict_status.sql"),
          "utf8",
        ),
      );
      await db.exec(
        readFileSync(resolve("supabase/security-integration.sql"), "utf8"),
      );
      const result = await db.query(
        "select count(*)::int as count from public.drafts",
      );
      expect(result.rows).toEqual([{ count: 0 }]);
    } finally {
      await db.close();
    }
  }, 30000);
});
