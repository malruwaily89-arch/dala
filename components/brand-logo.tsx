import { cn } from '@/lib/utils'

/** The clock is a booking symbol, not a live clock. */
export function BrandLogo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-brand', className)}>
      <span aria-hidden="true" className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-brand bg-white shadow-sm">
        <span className="absolute -top-1.5 left-2 h-2 w-1.5 rounded-full bg-brand" />
        <span className="absolute -top-1.5 right-2 h-2 w-1.5 rounded-full bg-brand" />
        <span className="font-mono text-[0.58rem] font-bold tracking-[-0.08em] text-brand">09:00</span>
        <span className="absolute -bottom-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-gold text-[0.6rem] font-black text-white">✓</span>
      </span>
      {!compact && <span className="font-serif text-2xl font-extrabold tracking-tight text-brand">دلال</span>}
    </span>
  )
}
