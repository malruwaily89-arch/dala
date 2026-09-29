import { cn } from '@/lib/utils'
import Image from 'next/image'

/** Shared Dala wordmark used by the public and marketing surfaces. */
export function BrandLogo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-brand', className)}>
      <Image
        src="/dala-logo-option-a.png"
        alt=""
        aria-hidden="true"
        width={48}
        height={48}
        className="h-10 w-10 shrink-0 object-contain"
      />
      {!compact && <span className="font-serif text-2xl font-extrabold tracking-tight text-brand">دلال</span>}
    </span>
  )
}
