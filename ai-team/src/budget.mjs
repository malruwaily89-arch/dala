import { mkdir, open, readFile, writeFile, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export async function reserve(directory, amount, limit, now = new Date()) {
  if (![amount,limit].every(n => Number.isFinite(n) && n > 0) || limit > 100) throw Error('Invalid budget; maximum 100 SAR');
  await mkdir(directory, {recursive: true, mode: 0o700});
  const lockPath = path.join(directory, 'budget.lock');
  // Fail closed on concurrent access or a stale lock; never auto-delete another run's lock.
  const lock = await open(lockPath, 'wx', 0o600);
  try {
    const file = path.join(directory, 'budget.json');
    let ledger = {version: 1, months: {}};
    try { ledger = JSON.parse(await readFile(file, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    if (ledger.version !== 1 || !ledger.months || typeof ledger.months !== 'object') throw Error('Invalid ledger');
    const month = now.toISOString().slice(0,7);
    const entries = ledger.months[month] ?? [];
    if (!Array.isArray(entries) || entries.some(e => !Number.isFinite(e.sar) || e.sar <= 0)) throw Error('Invalid ledger entries');
    const spent = entries.reduce((n,e) => n + e.sar, 0);
    if (spent + amount > limit + 1e-9) throw Error('Monthly spending cap reached');
    const id = randomUUID();
    entries.push({id, sar: amount, reservedAt: now.toISOString()});
    ledger.months[month] = entries;
    const temporary = path.join(directory, `budget-${id}.tmp`);
    await writeFile(temporary, JSON.stringify(ledger), {flag: 'wx', mode: 0o600});
    await rename(temporary, file);
    // Reservations remain charged even on timeout or crash: no automatic retries/refunds.
    return {id, month, reservedSar: amount};
  } finally { await lock.close(); await unlink(lockPath); }
}
