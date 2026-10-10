import type Anthropic from "@anthropic-ai/sdk";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { TIME_ZONE } from "./files.js";

const USD_TO_SAR = 3.75;
const WEB_SEARCH_USD = 10 / 1000;
const ALERT_LEVELS = [70, 90, 100];

interface Rates {
  input: number;
  output: number;
  cacheRead: number;
}
// USD per million tokens; 5-minute cache writes cost 1.25x input. Haiku 5.5 bills prompts over 100K at a higher card.
const PRICES: Record<string, Rates & { long?: Rates }> = {
  "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheRead: 0.01, long: { input: 0.5, output: 2.5, cacheRead: 0.05 } },
  "claude-sonnet-5-5": { input: 2, output: 10, cacheRead: 0.2 },
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2 },
  "claude-sonnet-5": { input: 2, output: 10, cacheRead: 0.2 },
  "claude-opus-5": { input: 5, output: 25, cacheRead: 0.5 },
  "claude-opus-4-8": { input: 5, output: 25, cacheRead: 0.5 },
};
const UNKNOWN_MODEL = PRICES["claude-opus-5"];

export const MODEL_LABELS: Record<string, string> = {
  "claude-haiku-5-5": "Claude Haiku 5.5",
  "claude-sonnet-5-5": "Claude Sonnet 5.5",
  "claude-opus-5-5": "Claude Opus 5.5",
};

export function priceLine(model: string): string {
  const p = PRICES[model] ?? UNKNOWN_MODEL;
  return `${MODEL_LABELS[model] ?? model}: ${p.input}$ للمدخلات و${p.output}$ للمخرجات لكل مليون توكن`;
}

export function costUsd(model: string, usage: Anthropic.Beta.BetaUsage): number {
  const read = usage.cache_read_input_tokens ?? 0;
  const write = usage.cache_creation_input_tokens ?? 0;
  const base = PRICES[model] ?? UNKNOWN_MODEL;
  const p = base.long && usage.input_tokens + read + write > 100_000 ? base.long : base;
  const tokens = usage.input_tokens * p.input + write * p.input * 1.25 + read * p.cacheRead + usage.output_tokens * p.output;
  return tokens / 1e6 + (usage.server_tool_use?.web_search_requests ?? 0) * WEB_SEARCH_USD;
}

const monthFormat = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit" });

interface MonthUsage {
  month: string;
  usd: number;
  byModel: Record<string, number>;
  alerted: number[];
}

/** Tracks estimated spend per calendar month (Riyadh time) against a SAR budget. */
export class UsageMeter {
  private usage: MonthUsage = { month: "", usd: 0, byModel: {}, alerted: [] };

  constructor(
    private readonly file: string,
    readonly budgetSar: number,
  ) {}

  async load(): Promise<void> {
    this.usage = JSON.parse(await readFile(this.file, "utf8").catch(() => JSON.stringify(this.usage)));
  }

  private current(now = new Date()): MonthUsage {
    const month = monthFormat.format(now);
    if (this.usage.month !== month) this.usage = { month, usd: 0, byModel: {}, alerted: [] };
    return this.usage;
  }

  spentSar(now?: Date): number {
    return this.current(now).usd * USD_TO_SAR;
  }

  isExhausted(now?: Date): boolean {
    return this.spentSar(now) >= this.budgetSar;
  }

  /** Adds one request's cost and returns the alert levels (percent of budget) it crossed for the first time. */
  async record(model: string, usage: Anthropic.Beta.BetaUsage, now?: Date): Promise<number[]> {
    const month = this.current(now);
    const usd = costUsd(model, usage);
    month.usd += usd;
    month.byModel[model] = (month.byModel[model] ?? 0) + usd;
    const percent = (this.spentSar(now) / this.budgetSar) * 100;
    const crossed = ALERT_LEVELS.filter((level) => percent >= level && !month.alerted.includes(level));
    month.alerted.push(...crossed);

    await mkdir(path.dirname(this.file), { recursive: true });
    await writeFile(`${this.file}.tmp`, JSON.stringify(month));
    await rename(`${this.file}.tmp`, this.file);
    return crossed;
  }

  summary(now?: Date): string {
    const month = this.current(now);
    const spent = this.spentSar(now);
    const lines = [
      `المصروف التقديري لشهر ${month.month}: ${spent.toFixed(2)} ريال من ${this.budgetSar} (${((spent / this.budgetSar) * 100).toFixed(1)}%).`,
      `المتبقي: ${Math.max(0, this.budgetSar - spent).toFixed(2)} ريال.`,
    ];
    for (const [model, usd] of Object.entries(month.byModel)) {
      lines.push(`- ${MODEL_LABELS[model] ?? model}: ${(usd * USD_TO_SAR).toFixed(2)} ريال`);
    }
    lines.push("التقدير محسوب من استهلاك التوكنات وأسعار Anthropic المعلنة؛ الفاتورة الفعلية في platform.claude.com.");
    return lines.join("\n");
  }
}
