import fs from 'node:fs';
import Stripe from 'stripe';
const env=Object.fromEntries(fs.readFileSync('.env','utf8').split('\n').filter(l=>l.includes('=')&&!l.trim().startsWith('#')).map(l=>[l.slice(0,l.indexOf('=')),l.slice(l.indexOf('=')+1)]));
async function main(){
  const stripe=new Stripe(env.STRIPE_SECRET_KEY!,{apiVersion:'2024-06-20' as never});
  const eps=await stripe.webhookEndpoints.list({limit:10});
  for(const e of eps.data){
    console.log(`${e.id}  status=${e.status}`);
    console.log(`  url:    ${e.url}`);
    console.log(`  events: ${e.enabled_events.join(', ')}`);
    console.log(`  customer.updated enabled: ${e.enabled_events.includes('customer.updated')||e.enabled_events.includes('*')}`);
  }
  process.exit(0);
}
main().catch(e=>{console.error(e.message);process.exit(1);});
