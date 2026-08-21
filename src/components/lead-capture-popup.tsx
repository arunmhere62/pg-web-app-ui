import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { X, Sparkles, ArrowRight } from 'lucide-react'
import { getCookie } from '@/lib/cookies'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

const STORAGE_KEY = 'ipgm_lead_popup_dismissed'
const SHOW_COUNT_KEY = 'ipgm_lead_popup_count'
const COOLDOWN_HOURS = 1
const SECOND_SHOW_DELAY = 30000 // 30 seconds after first dismiss
const MAX_SHOWS = 2

function getShowCount(): number {
  return parseInt(localStorage.getItem(SHOW_COUNT_KEY) || '0', 10)
}

function shouldShow(): boolean {
  // Don't show if logged in
  if (getCookie('access_token')) return false

  // Don't show on auth screens
  const path = window.location.pathname
  if (['/login', '/signup', '/owner-login', '/tenant-login'].includes(path)) return false

  // Already shown max times — check cooldown
  if (getShowCount() >= MAX_SHOWS) {
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (dismissed) {
      const hoursSince = (Date.now() - parseInt(dismissed, 10)) / (1000 * 60 * 60)
      if (hoursSince < COOLDOWN_HOURS) return false
      // Cooldown expired — reset count
      localStorage.setItem(SHOW_COUNT_KEY, '0')
    }
  }

  return true
}

export function LeadCapturePopup() {
  const navigate = useNavigate()
  const location = useLocation()
  const [visible, setVisible] = useState(false)
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const triggeredRef = useRef(false)
  const secondShowTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dismiss = useCallback(() => {
    setVisible(false)
    triggeredRef.current = true
    localStorage.setItem(STORAGE_KEY, Date.now().toString())

    const newCount = getShowCount() + 1
    localStorage.setItem(SHOW_COUNT_KEY, String(newCount))

    // If first dismiss, schedule 2nd popup after 30 seconds
    if (newCount < MAX_SHOWS && shouldShow()) {
      if (secondShowTimer.current) clearTimeout(secondShowTimer.current)
      secondShowTimer.current = setTimeout(() => {
        if (shouldShow()) {
          triggeredRef.current = false
          setVisible(true)
        }
      }, SECOND_SHOW_DELAY)
    }
  }, [])

  // Reset trigger guard on route change
  useEffect(() => {
    triggeredRef.current = false
    setVisible(false)
    return () => {
      if (secondShowTimer.current) clearTimeout(secondShowTimer.current)
    }
  }, [location.pathname])

  // Exit-intent detection (desktop)
  useEffect(() => {
    if (!shouldShow()) return

    const trigger = () => {
      if (triggeredRef.current) return
      triggeredRef.current = true
      setVisible(true)
    }

    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0 && !e.relatedTarget) {
        trigger()
      }
    }

    document.addEventListener('mouseout', onMouseOut)
    return () => document.removeEventListener('mouseout', onMouseOut)
  }, [location.pathname])

  // Scroll-based trigger (mobile + desktop fallback)
  useEffect(() => {
    if (!shouldShow()) return

    const onScroll = () => {
      if (triggeredRef.current) return
      const scrollPercent = (window.scrollY + document.documentElement.scrollTop) /
        (document.documentElement.scrollHeight - document.documentElement.clientHeight)
      if (scrollPercent >= 0.6) {
        triggeredRef.current = true
        setVisible(true)
        document.removeEventListener('scroll', onScroll)
      }
    }

    document.addEventListener('scroll', onScroll, { passive: true })
    return () => document.removeEventListener('scroll', onScroll)
  }, [location.pathname])

  // Time delay fallback (15 seconds)
  useEffect(() => {
    if (!shouldShow()) return

    const timer = setTimeout(() => {
      if (!triggeredRef.current) {
        triggeredRef.current = true
        setVisible(true)
      }
    }, 15000)

    return () => clearTimeout(timer)
  }, [location.pathname])

  const handleSubmit = async () => {
    const cleaned = phone.replace(/[^0-9]/g, '')
    if (cleaned.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number')
      return
    }

    setSubmitting(true)
    try {
      // Store lead phone in localStorage so signup can pick it up
      localStorage.setItem('ipgm_lead_phone', cleaned)
      localStorage.setItem(STORAGE_KEY, Date.now().toString())
      localStorage.setItem(SHOW_COUNT_KEY, String(MAX_SHOWS))
      toast.success('Let\'s get you started!')
      navigate(`/signup?phone=${cleaned}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (!visible) return null

  return (
    <div
      className='fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm'
      onClick={dismiss}
    >
      <div
        className='relative mx-4 w-full max-w-md overflow-hidden rounded-3xl bg-white p-8 shadow-2xl'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          className='absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground'
        >
          <X className='size-5' />
        </button>

        {/* Icon */}
        <div className='mb-5 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-600'>
          <Sparkles className='size-7 text-white' />
        </div>

        {/* Heading */}
        <h2 className='text-2xl font-bold text-foreground'>
          Start your free 30-day trial
        </h2>
        <p className='mt-2 text-sm text-muted-foreground'>
          Join 500+ PG owners using IPGM to manage tenants, collect rent automatically, and grow their business. No credit card needed.
        </p>

        {/* Phone input */}
        <div className='mt-6'>
          <div className='flex items-center gap-2'>
            <div className='flex items-center justify-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm font-medium text-muted-foreground'>
              +91
            </div>
            <Input
              type='tel'
              inputMode='numeric'
              maxLength={10}
              placeholder='Enter your 10-digit number'
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className='rounded-l-none'
              autoFocus
            />
          </div>
        </div>

        {/* CTA */}
        <Button
          onClick={handleSubmit}
          disabled={submitting || phone.length !== 10}
          className='mt-4 w-full'
          size='lg'
        >
          Get Started Free
          <ArrowRight className='ml-2 size-4' />
        </Button>

        {/* Trust signals */}
        <div className='mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground'>
          <span>✓ Free 30-day trial</span>
          <span>✓ No credit card</span>
          <span>✓ Setup in 5 minutes</span>
        </div>
      </div>
    </div>
  )
}
