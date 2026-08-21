import { useCallback, useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { Seo } from '@/components/seo'
import { showErrorToast, showSuccessToast } from '@/utils/toast'

import {
  useSendSignupOtpMutation,
  useVerifySignupOtpMutation,
  useSignupMutation,
} from '@/services/authApi'

import {
  type RequiredLegalDocument,
  type RequiredLegalDocumentsStatusResponse,
  useAcceptLegalDocumentMutation,
  useLazyGetRequiredLegalDocumentsStatusQuery,
} from '@/services/legalDocumentsApi'

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
}

function OtpInput({ value, onChange, length = 4 }: OtpInputProps) {
  const [localValue, setLocalValue] = useState(value.split('').concat(Array(length).fill('')).slice(0, length))
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = useCallback((index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return
    const newLocalValue = [...localValue]
    newLocalValue[index] = digit.slice(-1)
    setLocalValue(newLocalValue)
    onChange(newLocalValue.join(''))
    if (digit && index < length - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }, [localValue, length, onChange])

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !localValue[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }, [localValue])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    const newLocalValue = pasted.split('').concat(Array(length).fill('')).slice(0, length)
    setLocalValue(newLocalValue)
    onChange(newLocalValue.join(''))
    const focusIndex = Math.min(pasted.length, length - 1)
    inputsRef.current[focusIndex]?.focus()
  }, [length, onChange])

  return (
    <div className='flex justify-center gap-2' onPaste={handlePaste}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => { inputsRef.current[index] = el }}
          type='text'
          inputMode='numeric'
          pattern='[0-9]'
          maxLength={1}
          value={localValue[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className='h-14 w-14 rounded-xl border border-slate-200 bg-white text-center text-2xl font-semibold outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
        />
      ))}
    </div>
  )
}

const schema = z.object({
  organizationName: z.string().optional(),
  name: z.string().optional(),
  phone: z.string().min(10, 'Phone number is required'),
  pgName: z.string().optional(),
  rentCycleType: z.enum(['CALENDAR', 'MIDMONTH']).optional(),
  rentCycleStart: z.number().nullable().optional(),
  rentCycleEnd: z.number().nullable().optional(),
})

type FormValues = z.infer<typeof schema>

export function SignupScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [otp, setOtp] = useState('')
  const [fullPhone, setFullPhone] = useState('')
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [hasAgreedToLegal, setHasAgreedToLegal] = useState(false)
  const [requiredLegalDocs, setRequiredLegalDocs] = useState<RequiredLegalDocument[]>([])

  const [sendSignupOtp, { isLoading: sending }] = useSendSignupOtpMutation()
  const [verifySignupOtp, { isLoading: verifying }] = useVerifySignupOtpMutation()
  const [signup, { isLoading: signingUp }] = useSignupMutation()
  const [getRequiredLegalStatus] = useLazyGetRequiredLegalDocumentsStatusQuery()
  const [acceptLegalDocument] = useAcceptLegalDocumentMutation()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      organizationName: '',
      name: '',
      phone: searchParams.get('phone') || localStorage.getItem('ipgm_lead_phone') || '',
      pgName: '',
      rentCycleType: 'CALENDAR',
      rentCycleStart: 1,
      rentCycleEnd: 30,
    },
  })

  const phoneValue = form.watch('phone')

  const loadLegalDocs = useCallback(async () => {
    try {
      const status =
        (await getRequiredLegalStatus({ context: 'SIGNUP' }).unwrap()) as RequiredLegalDocumentsStatusResponse

      const pending = status?.pending ?? []
      setRequiredLegalDocs(Array.isArray(pending) ? pending : [])
    } catch {
      setRequiredLegalDocs([])
    }
  }, [getRequiredLegalStatus])

  useEffect(() => {
    void loadLegalDocs()
  }, [loadLegalDocs])

  const findLegalDocUrl = (types: string | string[]) => {
    const candidates = (Array.isArray(types) ? types : [types])
      .map((t) => String(t || '').toUpperCase())
      .filter(Boolean)

    const doc = (requiredLegalDocs || []).find((d) => {
      const dt = String((d as RequiredLegalDocument & { type?: string })?.type || '').toUpperCase()
      return candidates.includes(dt)
    })

    return doc?.url || doc?.content_url
  }

  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/[^0-9]/g, '')
    if (!cleaned) {
      showErrorToast('Phone number is required')
      return null
    }
    if (cleaned.length !== 10) {
      showErrorToast('Please enter valid 10-digit phone number')
      return null
    }
    return cleaned
  }

  const onSendOtp = async () => {
    const rawPhone = String(form.getValues('phone') ?? '')
    const cleaned = validatePhone(rawPhone)
    if (!cleaned) return

    const normalized = `+91${cleaned}`

    try {
      await sendSignupOtp({ phone: normalized }).unwrap()
      setFullPhone(normalized)
      setOtpSent(true)
      showSuccessToast('OTP sent')
    } catch (e: unknown) {
      showErrorToast(e, 'Failed to send OTP')
    }
  }

  const onVerifyOtp = async () => {
    if (!otp.trim()) {
      showErrorToast('OTP is required')
      return
    }

    if (otp.trim().length !== 4) {
      showErrorToast('Please enter valid 4-digit OTP')
      return
    }

    try {
      await verifySignupOtp({ phone: fullPhone, otp: otp.trim() }).unwrap()
      setPhoneVerified(true)
      setOtp('')
      setOtpSent(false)
      showSuccessToast('Phone number verified')
    } catch (e: unknown) {
      showErrorToast(e, 'Failed to verify OTP')
    }
  }

  const onSignup = async () => {
    const values = form.getValues()

    if (!phoneVerified) {
      showErrorToast('Please verify your phone number first')
      return
    }

    const pgName = String(values.pgName ?? '').trim()
    const name = String(values.name ?? '').trim()
    const rentCycleType = values.rentCycleType || 'CALENDAR'
    const rentCycleStart = values.rentCycleStart ?? 1
    const rentCycleEnd = values.rentCycleEnd ?? 30

    if (!pgName) {
      form.setError('pgName', { type: 'manual', message: 'PG name is required' })
      showErrorToast('Please enter PG name')
      return
    }

    if (!name) {
      form.setError('name', { type: 'manual', message: 'Name is required' })
      showErrorToast('Please enter your name')
      return
    }

    if (rentCycleType === 'CALENDAR' && (!rentCycleEnd || !Number.isFinite(Number(rentCycleEnd)))) {
      form.setError('rentCycleEnd', { type: 'manual', message: 'Rent cycle end day is required' })
      showErrorToast('Please enter rent cycle end day')
      return
    }

    if (!hasAgreedToLegal) {
      showErrorToast('Please agree to the Terms & Conditions and Privacy Policy')
      return
    }

    try {
      const signupData = {
        organizationName: pgName,
        name,
        pgName,
        phone: fullPhone,
        rentCycleType,
        rentCycleStart,
        rentCycleEnd,
      }

      const status =
        (await getRequiredLegalStatus({ context: 'SIGNUP' }).unwrap()) as RequiredLegalDocumentsStatusResponse
      const docsToAccept = (status?.required ?? status?.pending ?? []) as RequiredLegalDocument[]

      const signupResult = (await signup(signupData).unwrap()) as unknown
      const signupObj = (signupResult && typeof signupResult === 'object') ? (signupResult as Record<string, unknown>) : {}
      const rawUserId = signupObj.userId ?? signupObj.user_id ?? signupObj.s_no
      const userId = Number(rawUserId)

      if (docsToAccept?.length) {
        if (!Number.isFinite(userId) || userId <= 0) {
          throw new Error('Signup succeeded but user id was not returned')
        }
        for (const doc of docsToAccept) {
          const s_no = Number(doc.s_no)
          if (!Number.isFinite(s_no) || s_no <= 0) continue
          await acceptLegalDocument({ s_no, acceptance_context: 'SIGNUP', user_id: userId }).unwrap()
        }
      }

      const maybeMessage = typeof signupObj.message === 'string' ? signupObj.message : undefined
      showSuccessToast(maybeMessage || 'Account created successfully! Please wait for admin approval.')
      navigate('/login', { replace: true })
    } catch (e: unknown) {
      showErrorToast(e, 'Signup failed')
    }
  }

  const resetPhoneFlow = () => {
    setPhoneVerified(false)
    setOtpSent(false)
    setOtp('')
    setFullPhone('')
  }

  return (
    <>
      <Seo title='Sign Up' description='Create an IPGM account to start managing your PG or co-living space.' canonical='/signup' noindex />
      <div className='flex h-full w-full flex-col overflow-hidden lg:flex-row'>
        {/* Form Section */}
        <div className='order-1 flex h-full w-full items-center justify-center overflow-y-auto bg-white lg:order-2 lg:w-1/2'>
          <div className='w-full max-w-[380px] px-6 py-8'>

            {/* Phase 1: Phone number entry */}
            {!phoneVerified && !otpSent && (
              <>
                <h1 className='mb-1 text-center text-2xl font-bold text-slate-900'>
                  Create Account
                </h1>
                <p className='mb-6 text-center text-sm text-slate-500'>
                  Verify your phone number to get started
                </p>

                <Form {...form}>
                  <form className='space-y-5'>
                    <FormField
                      control={form.control}
                      name='phone'
                      render={({ field }) => (
                        <FormItem className='flex flex-col'>
                          <FormLabel className='text-left text-sm font-medium text-slate-700'>
                            Phone Number
                          </FormLabel>
                          <FormControl>
                            <div className='flex items-center gap-2'>
                              <div className='flex h-10 items-center justify-center rounded-lg border border-r-0 border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-500'>
                                +91
                              </div>
                              <Input
                                placeholder='Enter 10 digit number'
                                {...field}
                                className='h-10 rounded-lg border-slate-200 focus:border-slate-400'
                                onChange={(e) => {
                                  field.onChange(e.target.value)
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage className='text-left' />
                        </FormItem>
                      )}
                    />

                    <Button
                      type='button'
                      disabled={sending || !String(phoneValue || '').trim()}
                      onClick={() => void onSendOtp()}
                      className='h-12 w-full rounded-full bg-blue-600 text-base font-medium hover:bg-blue-700'
                    >
                      {sending ? 'Sending...' : 'Send OTP'}
                    </Button>

                    <div className='flex items-center gap-4 py-2'>
                      <div className='h-px flex-1 bg-slate-200' />
                      <span className='text-xs text-slate-400'>or</span>
                      <div className='h-px flex-1 bg-slate-200' />
                    </div>

                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => navigate('/login')}
                      className='h-10 w-full rounded-lg border-slate-200 text-sm font-normal'
                    >
                      Already have an account? Login
                    </Button>
                  </form>
                </Form>
              </>
            )}

            {/* Phase 2: OTP verification */}
            {!phoneVerified && otpSent && (
              <>
                <h1 className='mb-1 text-center text-2xl font-bold text-slate-900'>
                  Verify OTP
                </h1>
                <p className='mb-6 text-center text-sm text-slate-500'>
                  Enter the code sent to {fullPhone}
                </p>

                <div className='space-y-5'>
                  <div className='flex flex-col items-center space-y-4'>
                    <label className='text-center text-sm font-medium text-slate-600'>
                      Enter 4-digit verification code
                    </label>
                    <OtpInput
                      value={otp}
                      onChange={(value) => setOtp(value)}
                      length={4}
                    />
                  </div>

                  <Button
                    type='button'
                    onClick={onVerifyOtp}
                    disabled={verifying || otp.length !== 4}
                    className='h-12 w-full rounded-full bg-blue-600 text-base font-medium hover:bg-blue-700'
                  >
                    {verifying ? 'Verifying...' : 'Verify'}
                  </Button>

                  <div className='flex items-center justify-center gap-2 pt-2'>
                    <span className='text-xs text-slate-500'>Didn&apos;t receive code?</span>
                    <button
                      type='button'
                      onClick={() => {
                        onSendOtp()
                      }}
                      disabled={sending}
                      className='text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      {sending ? 'Sending...' : 'Resend'}
                    </button>
                  </div>

                  <Button
                    type='button'
                    onClick={() => {
                      setOtpSent(false)
                      setOtp('')
                    }}
                    className='h-10 w-full gap-2 rounded-full border-2 border-blue-600 bg-white text-xs font-medium text-blue-600 shadow-none hover:bg-blue-50'
                  >
                    <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                    </svg>
                    Change phone number
                  </Button>
                </div>
              </>
            )}

            {/* Phase 3: Setup PG details after OTP verified */}
            {phoneVerified && (
              <>
                <h1 className='mb-1 text-center text-2xl font-bold text-slate-900'>
                  Setup your PG
                </h1>
                <p className='mb-6 text-center text-sm text-slate-500'>
                  Complete setup to get started
                </p>

                <div className='mb-5 flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3'>
                  <div className='text-sm font-medium text-emerald-700'>Phone Verified</div>
                  <Button type='button' variant='ghost' size='sm' className='h-8 px-2 text-emerald-700 hover:text-emerald-800' onClick={resetPhoneFlow}>
                    Change
                  </Button>
                </div>

                <Form {...form}>
                  <form className='space-y-4'>
                    <FormField
                      control={form.control}
                      name='pgName'
                      render={({ field }) => (
                        <FormItem className='flex flex-col'>
                          <FormLabel className='text-left text-sm font-medium text-slate-700'>PG Name</FormLabel>
                          <FormControl>
                            <Input placeholder='e.g., Green Valley PG' {...field} className='h-10 rounded-lg border-slate-200 focus:border-slate-400' />
                          </FormControl>
                          <FormMessage className='text-left' />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='name'
                      render={({ field }) => (
                        <FormItem className='flex flex-col'>
                          <FormLabel className='text-left text-sm font-medium text-slate-700'>Your Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder='e.g., John Doe' {...field} className='h-10 rounded-lg border-slate-200 focus:border-slate-400' />
                          </FormControl>
                          <FormMessage className='text-left' />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='rentCycleType'
                      render={({ field }) => (
                        <FormItem className='flex flex-col'>
                          <FormLabel className='text-left text-sm font-medium text-slate-700'>Rent Cycle Type</FormLabel>
                          <div className='mt-2 grid gap-3 sm:grid-cols-2'>
                            <button
                              type='button'
                              className={
                                'rounded-lg border px-4 py-3 text-left transition ' +
                                ((field.value || 'CALENDAR') === 'CALENDAR'
                                  ? 'border-blue-600 bg-blue-50'
                                  : 'border-slate-200 bg-white hover:bg-slate-50')
                              }
                              onClick={() => {
                                field.onChange('CALENDAR')
                                form.setValue('rentCycleStart', 1)
                                form.setValue('rentCycleEnd', 30)
                              }}
                            >
                              <div className='text-sm font-semibold'>Calendar Month</div>
                              <div className='mt-1 text-xs text-slate-500'>1st to 30th/31st</div>
                            </button>
                            <button
                              type='button'
                              className={
                                'rounded-lg border px-4 py-3 text-left transition ' +
                                ((field.value || 'CALENDAR') === 'MIDMONTH'
                                  ? 'border-blue-600 bg-blue-50'
                                  : 'border-slate-200 bg-white hover:bg-slate-50')
                              }
                              onClick={() => {
                                field.onChange('MIDMONTH')
                                form.setValue('rentCycleStart', 1)
                                form.setValue('rentCycleEnd', 30)
                              }}
                            >
                              <div className='text-sm font-semibold'>Check-in Based</div>
                              <div className='mt-1 text-xs text-slate-500'>From tenant start date</div>
                            </button>
                          </div>
                        </FormItem>
                      )}
                    />

                    {(form.getValues('rentCycleType') || 'CALENDAR') === 'CALENDAR' ? (
                      <FormField
                        control={form.control}
                        name='rentCycleEnd'
                        render={({ field }) => (
                          <FormItem className='flex flex-col'>
                            <FormLabel className='text-left text-sm font-medium text-slate-700'>Rent Cycle End Day</FormLabel>
                            <FormControl>
                              <Input
                                placeholder='30'
                                value={field.value == null ? '' : String(field.value)}
                                onChange={(e) => {
                                  const v = e.target.value
                                  const n = v ? Number(v) : NaN
                                  field.onChange(Number.isFinite(n) ? n : null)
                                }}
                                className='h-10 rounded-lg border-slate-200 focus:border-slate-400'
                              />
                            </FormControl>
                            <FormMessage className='text-left' />
                          </FormItem>
                        )}
                      />
                    ) : null}

                    <div className='flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4'>
                      <Checkbox
                        checked={hasAgreedToLegal}
                        onCheckedChange={(v) => setHasAgreedToLegal(Boolean(v))}
                        id='legal'
                        className='mt-0.5'
                      />
                      <label htmlFor='legal' className='text-sm text-slate-600'>
                        I agree to{' '}
                        {findLegalDocUrl(['TERMS', 'TERMS_AND_CONDITIONS', 'TNC', 'T_AND_C']) ? (
                          <a
                            className='text-blue-600 hover:text-blue-700'
                            href={findLegalDocUrl(['TERMS', 'TERMS_AND_CONDITIONS', 'TNC', 'T_AND_C'])}
                            target='_blank'
                            rel='noreferrer'
                            onClick={(e) => e.stopPropagation()}
                          >
                            Terms & Conditions
                          </a>
                        ) : (
                          <span>Terms & Conditions</span>
                        )}{' '}
                        and{' '}
                        {findLegalDocUrl(['PRIVACY', 'PRIVACY_POLICY']) ? (
                          <a
                            className='text-blue-600 hover:text-blue-700'
                            href={findLegalDocUrl(['PRIVACY', 'PRIVACY_POLICY'])}
                            target='_blank'
                            rel='noreferrer'
                            onClick={(e) => e.stopPropagation()}
                          >
                            Privacy Policy
                          </a>
                        ) : (
                          <span>Privacy Policy</span>
                        )}
                      </label>
                    </div>

                    <Button
                      type='button'
                      onClick={onSignup}
                      disabled={!phoneVerified || signingUp}
                      className='h-12 w-full rounded-full bg-blue-600 text-base font-medium hover:bg-blue-700'
                    >
                      {signingUp ? 'Creating...' : 'Create Account'}
                    </Button>
                  </form>
                </Form>
              </>
            )}
          </div>
        </div>

        {/* Branding Section */}
        <div className='order-2 hidden h-full w-full flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-slate-900 text-white lg:order-1 lg:flex lg:w-1/2'>
          <div className='flex flex-col items-center justify-center p-12'>
            <div className='mb-6 text-5xl'>🏠</div>
            <h1 className='mb-3 text-3xl font-bold'>IPGM</h1>
            <p className='text-center text-base text-white/80'>
              Indian PG Management System
            </p>
            <div className='mt-8 text-xs text-white/60'>
              Start managing your PG properties efficiently
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
