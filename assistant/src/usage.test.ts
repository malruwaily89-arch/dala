import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { UsageMeter, costUsd } from "./usage.js";

const usage = (u: Partial<{ input_tokens: number; output_tokens: number; cache_read_input_tokens: number; cache_creation_input_tokens: number; web: number }>) =>
  ({
    input_tokens: u.input_tokens ?? 0,
    output_tokens: u.output_tokens ?? 0,
    cache_read_input_tokens: u.cache_read_input_tokens ?? 0,
    cache_creation_input_tokens: u.cache_creation_input_tokens ?? 0,
    server_tool_use: { web_search_requests: u.web ?? 0, web_fetch_requests: 0 },
  }) as never;

test("costUsd follows the published per-model rates", () => {
  const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
  close(costUsd("claude-haiku-5-5", usage({ input_tokens: 10_000, output_tokens: 10_000 })), (10_000 * 0.1 + 10_000 * 0.5) / 1e6);
  // Over 100K prompt tokens Haiku 5.5 bills the higher card for the whole request.
  close(costUsd("claude-haiku-5-5", usage({ input_tokens: 150_000 })), 0.075);
  close(
    costUsd("claude-opus-5-5", usage({ input_tokens: 1000, cache_creation_input_tokens: 10_000, cache_read_input_tokens: 100_000, output_tokens: 2000 })),
    (1000 * 4 + 10_000 * 5 + 100_000 * 0.2 + 2000 * 20) / 1e6,
  );
  close(costUsd("claude-sonnet-5-5", usage({ web: 3 })), 0.03);
});

test("UsageMeter alerts once per level, persists, and resets each Riyadh month", async () => {
  const file = path.join(await mkdtemp(path.join(tmpdir(), "assistant-usage-")), "usage.json");
  const oct = new Date("2026-10-15T10:00:00Z");
  const meter = new UsageMeter(file, 7.5); // 7.5 SAR = $2
  const opusDollar = usage({ output_tokens: 50_000 }); // $1 on Opus 5.5

  assert.deepEqual(await meter.record("claude-opus-5-5", opusDollar, oct), []);
  assert.deepEqual(await meter.record("claude-opus-5-5", usage({ output_tokens: 20_000 }), oct), [70]);
  assert.deepEqual(await meter.record("claude-opus-5-5", usage({ output_tokens: 1000 }), oct), []);
  assert.deepEqual(await meter.record("claude-opus-5-5", opusDollar, oct), [90, 100]);
  assert.equal(meter.isExhausted(oct), true);

  const reloaded = new UsageMeter(file, 7.5);
  await reloaded.load();
  assert.equal(reloaded.isExhausted(oct), true);
  // $1 + $0.40 + $0.02 + $1 = $2.42 = 9.075 SAR
  assert.match(reloaded.summary(oct), /2026-10: 9\.0[78] ريال من 7\.5/);

  // 21:30 UTC on Oct 31 is already November in Riyadh.
  const nov = new Date("2026-10-31T21:30:00Z");
  assert.equal(reloaded.isExhausted(nov), false);
  assert.equal(reloaded.spentSar(nov), 0);
});
