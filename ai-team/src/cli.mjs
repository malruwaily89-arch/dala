import { readFile, mkdir, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { makeRequest, roles, reservationSar, usageSar, safeText, validateEvidence } from './team.mjs';
import { reserve } from './budget.mjs';

async function main() {
  const args = process.argv.slice(2);
  const live = args.includes('--live');
  const file = args.find(a => !a.startsWith('--'));
  if (!file || (await stat(file)).size > 30000) throw Error('Usage: node src/cli.mjs evidence.json [--live] (max 30KB)');
  const evidence = validateEvidence(JSON.parse(await readFile(file, 'utf8')));
  const selected = (process.env.DALA_ROLES ?? 'technical,database,security').split(',');
  if (selected.some(r => !Object.hasOwn(roles,r))) throw Error('Unknown role');
  const plan = [...new Set([...selected.filter(r => !['manager','validation'].includes(r)), 'validation', 'manager'])];
  if (!live) {
    console.log(JSON.stringify({mode:'dry-run',commit:evidence.commit,roles:plan,maximumReservedSar:plan.length * reservationSar,networkCalls:0,productionAccess:false},null,2));
    return;
  }
  if (process.env.DALA_ENABLE_API !== 'true' || process.env.DALA_KILL_SWITCH === 'true') throw Error('Live API disabled');
  if (!process.env.OPENAI_API_KEY || process.env.DALA_EVIDENCE_REVIEWED !== 'true') throw Error('API credentials and reviewed non-sensitive evidence required');
  const limit = Number(process.env.DALA_MONTHLY_CAP_SAR);
  const base = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const reports = path.join(base, 'reports');
  await mkdir(reports,{recursive:true,mode:0o700});
  const run = {id:randomUUID(),commit:evidence.commit,status:'incomplete',mode:'suggest-only',findings:[]};
  const reportPath = path.join(reports, `${run.id}.json`);
  try {
    for (const role of plan) {
      // Validation receives original evidence and all preceding reviewer outputs within the same size ceiling.
      const reviewed = ['validation','manager'].includes(role) ? {
        commit:evidence.commit,
        items:[...evidence.items, ...run.findings.map(f => ({source:`review/${f.role}`,text:f.text}))]
      } : evidence;
      const request = makeRequest(role, reviewed);
      const reservation = await reserve(path.join(base,'state'), reservationSar, limit);
      const response = await fetch('https://api.openai.com/v1/responses', {
        method:'POST', signal:AbortSignal.timeout(90000),
        headers:{'Content-Type':'application/json', Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},
        body:JSON.stringify(request)
      });
      if (!response.ok) throw Error(`API HTTP ${response.status}; reservation retained; no retry`);
      const body = await response.json();
      if (body.status !== 'completed') throw Error('Incomplete API response; reservation retained');
      const text = safeText((body.output ?? []).filter(i => i.type === 'message').flatMap(i => i.content ?? []).filter(c => c.type === 'output_text').map(c => c.text).join('\n'));
      if (!text.trim()) throw Error('Missing review output');
      const cost = usageSar(body.usage);
      if (cost > reservationSar) throw Error('Usage exceeded reservation; disable live service and reconcile ledger');
      run.findings.push({role,text,usage:body.usage,estimatedSar:cost,reservationId:reservation.id});
      await writeFile(reportPath,JSON.stringify(run,null,2),{mode:0o600});
    }
    run.status='review-complete-not-release-approved';
  } finally { await writeFile(reportPath,JSON.stringify(run,null,2),{mode:0o600}); }
  console.log(JSON.stringify({report:reportPath,status:run.status,productionAccess:false}));
}
main().catch(() => { console.error('Audit stopped safely. Check configuration, evidence, budget and API status locally; no automatic retry.'); process.exitCode=1; });
