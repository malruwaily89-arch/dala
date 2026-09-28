import Image from 'next/image'
import { cn } from '@/lib/utils'

export function Logo({
  className,
  showText = true,
}: {
  className?: string
  showText?: boolean
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <Image
        src="/dalal-logo.png"
        alt="Dalal logo"
        width={40}
        height={40}
        className="h-10 w-10 object-contain"
        priority
      />
      {showText && (
        <div className="flex flex-col leading-none">
          <span className="font-serif text-xl font-semibold tracking-wide text-primary">
            Dalal
          </span>
          <span className="text-[0.65rem] uppercase tracking-[0.25em] text-accent-foreground/70">
            دلال
          </span>
        </div>
      )}
    </div>
  )
}
