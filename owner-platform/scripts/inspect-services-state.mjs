import {createClient} from '@supabase/supabase-js';
import {writeFile,mkdir} from 'node:fs/promises';
import {isDeepStrictEqual} from 'node:util';
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const site=process.env.SITE_ID||'00000000-0000-4000-8000-000000000001';
const {data:draft,error}=await db.from('drafts').select('document,version').eq('site_id',site).single();
const pub=await db.rpc('read_published',{p_site:site});
if(error||pub.error)throw Error('Cannot read state');
await mkdir('../outputs/services-page',{recursive:true});
await writeFile('../outputs/services-page/current-state.json',JSON.stringify({draft,publication:pub.data},null,2));
console.log({version:draft.version,deepEqual:isDeepStrictEqual(draft.document,pub.data),settingsEqual:isDeepStrictEqual(draft.document.settings,pub.data.settings),formsEqual:isDeepStrictEqual(draft.document.forms,pub.data.forms)});
for(const p of draft.document.pages){const old=pub.data.pages.find(x=>x.id===p.id); console.log({id:p.id,path:p.path,changes:Object.keys(p).filter(k=>!isDeepStrictEqual(p[k],old?.[k])),draftHtmlLength:p.html.length,publishedHtmlLength:old?.html.length});}
