import type * as React from 'react'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PageHeader({
  title,
  subtitle,
  right,
  showBack = false,
  className,
}: {
  title: string
  subtitle?: string
  right?: React.ReactNode
  showBack?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-row items-center justify-between gap-2 px-1 py-2',
        className
      )}
    >
      <div className='flex min-w-0 items-center gap-2'>
        {showBack && (
          <button
            onClick={() => window.history.back()}
            className='flex size-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-muted'
          >
            <ChevronLeft className='size-4 text-foreground' />
          </button>
        )}
        <div className='min-w-0'>
          <h1 className='truncate text-lg leading-tight font-bold text-foreground'>
            {title}
          </h1>
          {subtitle ? (
            <div className='mt-0.5 text-xs text-muted-foreground'>
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>
      {right ? (
        <div className='flex shrink-0 items-center gap-2'>
          {right}
        </div>
      ) : null}
    </div>
  )
}
