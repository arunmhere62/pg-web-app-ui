import { useEffect, useState, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { X, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react'
import { getCookie } from '@/lib/cookies'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useSubmitLeadMutation } from '@/services/leadCaptureApi'

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
  const location = useLocation()
  const [visible, setVisible] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const triggeredRef = useRef(false)
  const secondShowTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [submitLead] = useSubmitLeadMutation()

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
    if (!name.trim()) {
      toast.error('Please enter your name')
      return
    }
    const cleanedPhone = phone.replace(/[^0-9]/g, '')
    if (cleanedPhone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number')
      return
    }

    setSubmitting(true)
    try {
      await submitLead({
        name: name.trim(),
        phone: cleanedPhone,
      }).unwrap()

      localStorage.setItem(STORAGE_KEY, Date.now().toString())
      localStorage.setItem(SHOW_COUNT_KEY, String(MAX_SHOWS))
      setSubmitted(true)
      toast.success('Thank you! We will contact you soon.')
    } catch {
      toast.error('Something went wrong. Please try again.')
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

        {submitted ? (
          <div className='mt-6 flex flex-col items-center text-center'>
            <div className='mb-4 flex size-14 items-center justify-center rounded-full bg-green-100'>
              <CheckCircle2 className='size-8 text-green-600' />
            </div>
            <h3 className='text-lg font-semibold text-foreground'>We'll be in touch!</h3>
            <p className='mt-2 text-sm text-muted-foreground'>
              Thank you for your interest in IPGM. Our team will reach out to you at <strong>+91{phone}</strong> shortly.
            </p>
            <Button
              onClick={dismiss}
              className='mt-6 w-full'
              size='lg'
            >
              Close
            </Button>
          </div>
        ) : (
          <>
            {/* Name input */}
            <div className='mt-6 space-y-3'>
              <Input
                type='text'
                placeholder='Your name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                autoFocus
              />

              {/* Phone input */}
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
                />
              </div>
            </div>

            {/* CTA */}
            <Button
              onClick={handleSubmit}
              disabled={submitting || !name.trim() || phone.length !== 10}
              className='mt-4 w-full'
              size='lg'
            >
              {submitting ? 'Submitting...' : 'Get Started Free'}
              {!submitting && <ArrowRight className='ml-2 size-4' />}
            </Button>

            {/* Trust signals */}
            <div className='mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground'>
              <span>✓ Free 30-day trial</span>
              <span>✓ No credit card</span>
              <span>✓ Setup in 5 minutes</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
