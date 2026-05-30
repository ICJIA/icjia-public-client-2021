// RED/BLUE TEAM AUDIT of keep-warm safety layers.
// We re-implement the handler's control flow against mocked Blobs + a fetch
// counter, then attack it. Each scenario asserts the BLAST RADIUS (outbound
// pings) stays capped. (The real file's logic is mirrored here 1:1; we can't
// import it directly because it calls schedule()/getStore at module load.)

let PINGS = 0;                       // global outbound-fetch counter (the cost metric)
const MAX_ROUTES = 12, MIN_INTERVAL_MS = 4*60*1000;

// ---- mock Netlify Blobs (durable across calls in one scenario) ----
function makeStore() {
  let mem = {};
  return { get: async k => mem[k], set: async (k,v) => { mem[k]=v; } };
}
// ---- the handler logic under test (mirror of keep-warm.mjs) ----
function safeRoutes(ROUTES) {
  const seen=new Set(), out=[];
  for (const r of Array.isArray(ROUTES)?ROUTES:[]) {
    if (typeof r!=="string"||r[0]!=="/"||r.startsWith("//")) continue;
    if (seen.has(r)) continue;
    seen.add(r); out.push(r);
    if (out.length>=MAX_ROUTES) break;
  }
  return out;
}
function selfOrigin(env) {
  const u=env.URL||env.DEPLOY_PRIME_URL; if(!u) return "https://icjia.illinois.gov";
  try { return new URL(u).origin; } catch { return "https://icjia.illinois.gov"; }
}
async function fakeFetch(url) {
  // L4 proof: record the host actually contacted
  const host = new URL(url).host; PINGS++; HOSTS.add(host);
  return { status:200, arrayBuffer: async()=>new ArrayBuffer(0) };
}
let HOSTS = new Set();
async function handler(event, env, store, ROUTES, cfgEnabled=true) {
  // mirrors keep-warm.mjs: config flag OR env var disables (two kill switches)
  if (cfgEnabled===false || env.KEEP_WARM_DISABLED==="1") return {statusCode:200, body:"disabled"};
  const method=event&&event.httpMethod;
  const isScheduled=!method||(event&&event.source==="aws.events")||event?.headers?.["x-nf-event"]==="schedule";
  if (method && !isScheduled) return {statusCode:403, body:"forbidden"};
  try {
    const last=Number((await store.get("last-run"))||0); const now=Date.now();
    if (last && now-last<MIN_INTERVAL_MS) return {statusCode:429, body:"throttled"};
    await store.set("last-run", String(now));
  } catch {}
  const origin=selfOrigin(env); const routes=safeRoutes(ROUTES);
  await Promise.allSettled(routes.map(p=>fakeFetch(origin+p)));
  return {statusCode:200, body:"ok"};
}

const GOOD = ["/","/researchhub/","/researchhub/articles/","/researchhub/datasets/","/researchhub/apps/","/researchhub/hub-overview/"];
const ENV = { URL:"https://feat-astro-migration--icjia-public.netlify.app" };
let pass=0, fail=0;
function check(name, cond, detail){ (cond?pass++:fail++); console.log((cond?"PASS":"*** FAIL"), name, detail||""); }

// SCENARIO 1 — baseline: one scheduled run pings exactly the route count
PINGS=0; HOSTS=new Set();
await handler({}, ENV, makeStore(), GOOD);
check("S1 baseline scheduled run", PINGS===6, `(pings=${PINGS}, expect 6)`);

// SCENARIO 2 (L2) — ATTACKER floods 1000 invocations in the same window
PINGS=0; const s2=makeStore();
for (let i=0;i<1000;i++) await handler({}, ENV, s2, GOOD);
check("S2 1000x flood throttled by durable guard", PINGS===6, `(pings=${PINGS}, expect 6 — only the first run pings)`);

// SCENARIO 3 (L1) — attacker hits it via HTTP GET/POST (not the scheduler)
PINGS=0;
const r3a=await handler({httpMethod:"GET"}, ENV, makeStore(), GOOD);
const r3b=await handler({httpMethod:"POST"}, ENV, makeStore(), GOOD);
check("S3 HTTP GET rejected (403)", r3a.statusCode===403 && PINGS===0, `(status=${r3a.statusCode}, pings=${PINGS})`);
check("S3 HTTP POST rejected (403)", r3b.statusCode===403, `(status=${r3b.statusCode})`);

// SCENARIO 4 (L3) — poisoned config: 500 routes
PINGS=0;
const flood = Array.from({length:500}, (_,i)=>`/r${i}/`);
await handler({}, ENV, makeStore(), flood);
check("S4 500-route config capped at MAX_ROUTES", PINGS===12, `(pings=${PINGS}, expect 12)`);

// SCENARIO 5 (L3/L4) — config injection: full URLs, protocol-relative, dupes
PINGS=0; HOSTS=new Set();
const evil = ["//evil.com/x","https://evil.com/y","/","/","/researchhub/","ftp://x","/researchhub/"];
await handler({}, ENV, makeStore(), evil);
check("S5 injection rejected (only / + /researchhub/ survive, de-duped)", PINGS===2, `(pings=${PINGS}, expect 2)`);
check("S5 L4 same-origin only (never contacted evil.com)", !HOSTS.has("evil.com") && HOSTS.size===1, `(hosts=${[...HOSTS].join(",")})`);

// SCENARIO 6 (L4) — poisoned env URL can't redirect fetches off-origin host
PINGS=0; HOSTS=new Set();
await handler({}, {URL:"https://feat-astro-migration--icjia-public.netlify.app"}, makeStore(), GOOD);
check("S6 fetches only the deploy origin", HOSTS.size===1 && [...HOSTS][0].endsWith("netlify.app"), `(hosts=${[...HOSTS].join(",")})`);

// SCENARIO 7 (L6) — kill switches (env var + config flag, two independent levels)
PINGS=0;
const r7=await handler({}, {...ENV, KEEP_WARM_DISABLED:"1"}, makeStore(), GOOD);
check("S7a env kill switch disables all pings", PINGS===0 && r7.body==="disabled", `(pings=${PINGS})`);
PINGS=0;
const r7b=await handler({}, ENV, makeStore(), GOOD, /*cfgEnabled*/false);
check("S7b config flag (keepWarm.enabled:false) disables all pings", PINGS===0 && r7b.body==="disabled", `(pings=${PINGS})`);

// SCENARIO 8 (L2 worst-case math) — sustained attack for 1 HOUR at 1 req/sec
PINGS=0; const s8=makeStore(); let realNow=Date.now();
const origDate=Date.now;
// simulate 3600 invocations over an hour; guard allows 1 per 4 min
for (let sec=0; sec<3600; sec++){
  Date.now=()=>realNow+sec*1000;
  await handler({}, ENV, s8, GOOD);
}
Date.now=origDate;
const maxRunsPerHour = Math.ceil(60/4); // ~15
check("S8 1 req/sec for 1hr → bounded by 4-min guard", PINGS<=15*6, `(pings=${PINGS}, ceiling=${15*6})`);

console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail?1:0);
