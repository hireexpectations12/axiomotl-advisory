import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { load } from "cheerio";
import { validateDocument } from "../src/lib/render";
const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {auth:{persistSession:false}});
const site = process.env.SITE_ID || "00000000-0000-4000-8000-000000000001";
const {data:draft,error} = await db.from("drafts").select("document,version").eq("site_id",site).single();
const pub = await db.rpc("read_published",{p_site:site});
if(error || pub.error || !draft) throw Error("Cannot read current state");
if(JSON.stringify(draft.document)!==JSON.stringify(pub.data)) throw Error("Unpublished edits exist; cannot include them in this release");
const bytes = await readFile(new URL("../public/site-assets/combined/axiomotl-logo-master.png",import.meta.url));
const key = `${site}/axiomotl-logo-master-${Date.now()}.png`;
const url = db.storage.from("site-media").getPublicUrl(key).data.publicUrl;
const next = structuredClone(draft.document);
next.settings.logo = url;
next.settings.favicon = url;
const layout = await readFile(new URL("../design/combined/layout.css",import.meta.url),"utf8");
const marker = "/* Supplied stacked master logo:";
const styles = layout.slice(layout.indexOf(marker));
if(!styles.startsWith(marker)) throw Error("Missing logo styles");
for(const page of next.pages) {
 const $ = load(page.html,null,false);
 const logos = $("img[data-site-logo], .brand img");
 if(!logos.length) continue;
 if(page.project) throw Error("Page has editor structure; reconcile first");
 logos.attr({src:url,width:"500",height:"500"});
 page.html = $.html();
 const start = page.css.indexOf(marker);
 page.css = `${start < 0 ? page.css : page.css.slice(0,start)}\n${styles}`;
}
const document = validateDocument(next);
const {data:members,error:memberError} = await db.from("memberships").select("user_id").eq("site_id",site);
if(memberError) throw Error("Cannot verify owner");
let actor;
for(const m of members || []) {const u=await db.auth.admin.getUserById(m.user_id);if(u.data.user && !u.data.user.app_metadata.axiomotl_roles?.[site]) {actor=m.user_id;break;}}
if(!actor) throw Error("No protected owner found");
await mkdir(new URL("../../outputs/release-backups/",import.meta.url),{recursive:true});
await writeFile(new URL(`../../outputs/release-backups/logo-${Date.now()}.json`,import.meta.url),JSON.stringify({draft,publication:pub.data}));
if(!process.argv.includes("--publish")) {console.log({status:"validated",version:draft.version,pages:document.pages.length});process.exit(0);}
const upload=await db.storage.from("site-media").upload(key,bytes,{contentType:"image/png",upsert:false,cacheControl:"31536000"});
if(upload.error) throw Error("Logo upload failed");
const asset=await db.from("assets").insert({site_id:site,object_key:key,url,name:"Axiomotl master logo.png",size:bytes.length});
if(asset.error) throw Error("Media registration failed");
const saved=await db.rpc("owner_change",{p_site:site,p_actor:actor,p_action:"save",p_expected:draft.version,p_document:document});
if(saved.error) throw Error("Save rejected; concurrent change possible");
const published=await db.rpc("owner_change",{p_site:site,p_actor:actor,p_action:"publish",p_expected:saved.data.version,p_document:document});
if(published.error) throw Error("Publish failed; logo remains in draft");
const check=await db.rpc("read_published",{p_site:site});
if(check.error || check.data.settings.logo!==url) throw Error("Publication verification failed");
console.log({status:"published",version:published.data.version,publishedAt:published.data.publishedAt,logo:url});

