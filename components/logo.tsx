import { cn } from '@/lib/utils'
import { BrandLogo } from '@/components/brand-logo'

export function Logo({
  className,
  showText = true,
}: {
  className?: string
  showText?: boolean
}) {
  return <BrandLogo className={cn(className)} compact={!showText} />
}
