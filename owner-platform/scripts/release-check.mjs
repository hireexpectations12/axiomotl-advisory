import { createClient } from '@supabase/supabase-js';
console.log('Configured environment keys:', Object.keys(process.env).filter(k => /SUPABASE|RESEND|SMTP|MAIL|VERCEL|APP_URL/.test(k)));
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {auth:{persistSession:false}});
const site = process.env.SITE_ID || '00000000-0000-4000-8000-000000000001';
const draft = await db.from('drafts').select('document,version').eq('site_id',site).single();
const pub = await db.rpc('read_published',{p_site:site});
if(draft.error || pub.error) throw new Error('Unable to inspect site');
console.log({version:draft.data.version, draftMatchesPublished:JSON.stringify(draft.data.document) === JSON.stringify(pub.data), pages:draft.data.document.pages.map(p=>({id:p.id,path:p.path})), forms:draft.data.document.forms.length});
