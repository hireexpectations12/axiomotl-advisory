import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { load } from "cheerio";
import { checkSiteLinks } from "../src/lib/site-health";
import { validateDocument } from "../src/lib/render";

const db = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);
const site = process.env.SITE_ID || "00000000-0000-4000-8000-000000000001";
const { data: draft, error } = await db
  .from("drafts")
  .select("document,version")
  .eq("site_id", site)
  .single();
const publication = await db.rpc("read_published", { p_site: site });
if (error || publication.error) throw new Error("Cannot read website state.");
if (JSON.stringify(draft.document) !== JSON.stringify(publication.data))
  throw new Error("Unpublished edits exist; reconcile before publishing.");

const next = structuredClone(publication.data);
const home = next.pages.find((page: { path: string }) => page.path === "/");
if (!home || home.project) throw new Error("Reconcile editor structure first.");
if(next.pages.some((p: {path:string})=>p.path === "/practice")) throw new Error("Practice page already exists; inspect before replacing.");
const source=load(home.html,null,false);
const header=source(".site-header").first().clone();
const footer=source("footer").last().clone();
for(const fragment of [header,footer]) fragment.find("a[href]").each((_,el)=>{const link=source(el);const href=link.attr("href")||"";if(href.startsWith("#"))link.attr("href",href==="#top"?"/":`/${href}`);});
footer.find("#site-motion").remove();
const content=await readFile(new URL("../design/practice/content.html",import.meta.url),"utf8");
const css=await readFile(new URL("../design/practice/styles.css",import.meta.url),"utf8");
next.pages.push({id:"practice-detail",path:"/practice",title:"Our Practice & Dr Ramzi Abbassi | Axiomotl Advisory",description:"Meet Axiomotl Advisory and Dr Ramzi Abbassi. Business analysis, governance, scientific digital transformation and operational transition.",socialImage:home.socialImage,noIndex:false,project:null,html:`${source("svg.icon-defs").toString()}<a class="svc-skip" href="#practice-main">Skip to content</a>${header.toString()}${content}${footer.toString()}`,css:`${home.css}\n${css}`});
for(const page of next.pages){
 if(page.project) throw new Error("Reconcile editor structures first.");
 const $=load(page.html,null,false);
 $("header a,nav a,footer a").each((_:number,el:any)=>{const a=$(el);const label=a.text().trim().toLowerCase();if(label==="decision brief") a.remove();else if(label==="our practice"||label==="about")a.attr("href","/practice");});
 page.html=$.html();
}
if(next.settings.navigation)next.settings.navigation=next.settings.navigation.filter((l:{label:string})=>l.label.trim().toLowerCase()!=="decision brief").map((l:{label:string,url:string})=>({...l,url:l.label.trim().toLowerCase()==="our practice"?"/practice":l.url}));
if(next.settings.footer?.links)next.settings.footer.links=next.settings.footer.links.filter((l:{label:string})=>l.label.trim().toLowerCase()!=="decision brief").map((l:{label:string,url:string})=>({...l,url:["our practice","about"].includes(l.label.trim().toLowerCase())?"/practice":l.url}));
home.css += "\n/* Match the guided journey opening to the other section spacing. */\nmain > .hero.circuit-hero + #starting-point.finder-section { padding-top: var(--layout-space, 80px) !important; }\n@media(max-width:700px){main > .hero.circuit-hero + #starting-point.finder-section { padding-top:48px !important; }}\n";
const document = validateDocument(next);
const problems=checkSiteLinks(document);
if(problems.length)throw new Error(JSON.stringify(problems));
console.log({internalLinkErrors:problems.length,pages:document.pages.length});
const backupDir = new URL("../../outputs/release-backups/", import.meta.url);
await mkdir(backupDir, { recursive: true });
await writeFile(
  new URL(`practice-release-${Date.now()}.json`, backupDir),
  JSON.stringify({ draft, publication: publication.data }, null, 2),
);
await writeFile(
  new URL(
    "../../outputs/live-backgrounds/proposed-document.json",
    import.meta.url,
  ),
  JSON.stringify(document, null, 2),
);
if (!process.argv.includes("--publish")) {
  console.log({ status: "validated", version: draft.version, sections: 1 });
  process.exit(0);
}

const membership = await db
  .from("memberships")
  .select("user_id")
  .eq("site_id", site);
if (membership.error) throw new Error("Cannot verify owner.");
let actor: string | undefined;
for (const member of membership.data || []) {
  const user = await db.auth.admin.getUserById(member.user_id);
  if (user.data.user && !user.data.user.app_metadata.axiomotl_roles?.[site]) {
    actor = member.user_id;
    break;
  }
}
if (!actor) throw new Error("No protected owner found.");
const saved = await db.rpc("owner_change", {
  p_site: site,
  p_actor: actor,
  p_action: "save",
  p_expected: draft.version,
  p_document: document,
});
if (saved.error) throw new Error("Save failed or draft changed concurrently.");
const published = await db.rpc("owner_change", {
  p_site: site,
  p_actor: actor,
  p_action: "publish",
  p_expected: saved.data.version,
  p_document: document,
});
if (published.error)
  throw new Error("Publish failed; changes remain in draft.");
console.log({
  status: "published",
  version: published.data.version,
  publishedAt: published.data.publishedAt,
});

