import { useEffect, useMemo, useState } from 'react'
import { useGetAllRoomsQuery, type Room } from '@/services/roomsApi'
import {
  useLazyGetTenantsQuery,
  type GetTenantsParams,
  type Tenant,
} from '@/services/tenantsApi'
import { useAppSelector } from '@/store/hooks'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BedDouble,
  CircleAlert,
  Filter,
  Search,
  Plus,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/form/page-header'
import { TenantFilterModal } from '@/components/tenants/TenantFilterModal'
import { usePermissions } from '@/hooks/usePermissions'
import { Permission } from '@/config/rbac.config'

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'CHECKED_OUT'

interface Pagination {
  total?: number
  page?: number
  limit?: number
  totalPages?: number
  hasMore?: boolean
}

const asArray = <T,>(value: unknown): T[] => {
  return Array.isArray(value) ? (value as T[]) : []
}

type ErrorLike = {
  data?: {
    message?: string
  }
  message?: string
}

const getInitial = (name?: string): string => {
  const n = String(name ?? '').trim()
  return n ? n.charAt(0).toUpperCase() : 'T'
}

const formatDate = (raw?: string): string => {
  if (!raw) return ''
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return String(raw).split('T')[0]
  try {
    return d.toLocaleDateString('en-IN')
  } catch {
    return String(raw).split('T')[0]
  }
}

const PaymentBadge = ({ color, text }: { color: string; text: string }) => (
  <span
    className='inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold text-white whitespace-nowrap'
    style={{ backgroundColor: color }}
  >
    {text}
  </span>
)

export function TenantsScreen() {
  const navigate = useNavigate()
  const { can } = usePermissions()
  const canCreate = can(Permission.CREATE_TENANT)

  const selectedPGLocationId = useAppSelector(
    (s) => s.pgLocations.selectedPGLocationId
  )

  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const limit: number = 20
  const [allTenants, setAllTenants] = useState<Tenant[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  const [filtersOpen, setFiltersOpen] = useState(false)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)
  const [pendingRent, setPendingRent] = useState(false)
  const [pendingAdvance, setPendingAdvance] = useState(false)
  const [partialRent, setPartialRent] = useState(false)

  const { data: roomsResponse } = useGetAllRoomsQuery(
    selectedPGLocationId ? { limit: 200 } : undefined,
    { skip: !selectedPGLocationId }
  )

  const rooms: Room[] = asArray<Room>(roomsResponse?.data)

  const roomOptions: Array<{ label: string; value: string }> = useMemo(
    () =>
      rooms.map((r) => ({
        label: String(r.room_no),
        value: String(r.s_no),
      })),
    [rooms]
  )

  const queryOptions: GetTenantsParams = useMemo(
    () => ({
      page,
      limit,
      search: query.trim() ? query.trim() : undefined,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      room_id: selectedRoomId ?? undefined,
      pending_rent: pendingRent ? true : undefined,
      pending_advance: pendingAdvance ? true : undefined,
      partial_rent: partialRent ? true : undefined,
    }),
    [
      page,
      limit,
      query,
      statusFilter,
      selectedRoomId,
      pendingRent,
      pendingAdvance,
      partialRent,
    ]
  )

  const [trigger, { data: tenantsResponse, isFetching, error }] =
    useLazyGetTenantsQuery()

  useEffect(() => {
    if (selectedPGLocationId && queryOptions) {
      void trigger(queryOptions)
    }
  }, [trigger, queryOptions, selectedPGLocationId])

  const { isFetching: isInfiniteFetching, checkScroll } = useInfiniteScroll({
    hasMore,
    isLoading: isFetching,
  })

  useEffect(() => {
    if (tenantsResponse?.data) {
      setTimeout(() => {
        if (page === 1) {
          setAllTenants(tenantsResponse.data)
        } else {
          setAllTenants((prev) => {
            const existingIds = new Set(prev.map((tenant) => tenant.s_no))
            const newTenants = tenantsResponse.data.filter(
              (tenant) => !existingIds.has(tenant.s_no)
            )
            return [...prev, ...newTenants]
          })
        }
        setHasMore(tenantsResponse.pagination?.hasMore ?? false)
        setHasLoadedOnce(true)
      }, 0)

      setTimeout(() => {
        checkScroll()
      }, 100)
    }
  }, [tenantsResponse, page, checkScroll])

  useEffect(() => {
    if (isInfiniteFetching && hasMore && !isFetching && selectedPGLocationId) {
      const nextPage = page + 1
      setTimeout(() => setPage(nextPage), 0)
      void trigger({
        ...queryOptions,
        page: nextPage,
      })
    }
  }, [
    isInfiniteFetching,
    hasMore,
    isFetching,
    page,
    trigger,
    queryOptions,
    selectedPGLocationId,
  ])

  const tenants: Tenant[] = allTenants
  const isLoading: boolean = isFetching && !hasLoadedOnce

  const pagination = tenantsResponse?.pagination as Pagination | undefined

  const total: number = Number(pagination?.total ?? tenants.length)

  const fetchErrorMessage: string | undefined =
    error && typeof error === 'object' && 'data' in error
      ? (error as ErrorLike).data?.message || (error as ErrorLike).message
      : error && typeof error === 'object' && 'message' in error
        ? (error as ErrorLike).message
        : undefined

  const filterCount: number =
    Number(statusFilter !== 'ALL') +
    Number(Boolean(selectedRoomId)) +
    Number(pendingRent) +
    Number(pendingAdvance) +
    Number(partialRent)

  const activeRoomLabel: string = useMemo(() => {
    if (!selectedRoomId) return 'All Rooms'
    const room = rooms.find((r) => Number(r.s_no) === Number(selectedRoomId))
    return room?.room_no ? String(room.room_no) : `Room #${selectedRoomId}`
  }, [rooms, selectedRoomId])

  const statusLabel: string =
    statusFilter === 'ALL'
      ? 'All'
      : statusFilter === 'ACTIVE'
        ? 'Occupied'
        : statusFilter

  const renderTenantCard = (t: Tenant, index: number) => {
    const tenantImage: string =
      Array.isArray(t.images) && t.images.length > 0 ? t.images[0] : ''

    const roomNo: string | undefined = t.rooms?.room_no
    const bedNo: string | undefined = t.beds?.bed_no
    const rentPrice: number | undefined = t.rooms?.rent_price

    const isRentPaid: boolean = Boolean(t.is_rent_paid)
    const isRentPartial: boolean = Boolean(t.is_rent_partial)
    const rentDueAmount: number = Number(t.rent_due_amount ?? 0)
    const isAdvancePaid: boolean = Boolean(t.is_advance_paid)
    const hasOutstandingAmount: boolean = rentDueAmount > 0

    const unpaidMonths = (t as unknown as Record<string, unknown>)['unpaid_months'] as Array<{ month_name?: string }> | undefined
    const hasPendingRent: boolean =
      Number((t as unknown as Record<string, unknown>)['pending_due_amount'] ?? 0) > 0 ||
      (Array.isArray(unpaidMonths) && unpaidMonths.length > 0)

    const statusColor =
      t.status === 'ACTIVE'
        ? '#10B981'
        : t.status === 'CHECKED_OUT'
          ? '#F59E0B'
          : '#EF4444'

    const leftBorderClass: string = hasOutstandingAmount
      ? isRentPartial
        ? 'border-l-[3px] border-l-orange-500'
        : 'border-l-[3px] border-l-amber-500'
      : 'border-l-0'

    return (
      <motion.div
        key={`tenant-${t.s_no}`}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{
          duration: 0.25,
          delay: Math.min(index * 0.04, 0.3),
          ease: 'easeOut',
        }}
        className={`cursor-pointer rounded-xl border bg-white p-3 transition-all hover:shadow-md ${leftBorderClass}`}
        onClick={() => navigate(`/tenants/${t.s_no}`)}
      >
        {/* Row 1: Avatar + Name/Room/Bed/Rent + Status */}
        <div className='flex items-center gap-3'>
          {/* Avatar */}
          <div className='h-11 w-11 shrink-0 overflow-hidden rounded-full bg-blue-600'>
            {tenantImage ? (
              <img
                src={tenantImage}
                alt=''
                className='h-full w-full object-cover'
              />
            ) : (
              <div className='grid h-full w-full place-items-center text-base font-bold text-white'>
                {getInitial(t.name)}
              </div>
            )}
          </div>

          {/* Name + Room/Bed/Rent */}
          <div className='min-w-0 flex-1'>
            <div className='truncate text-[15px] font-bold text-slate-800'>
              {t.name || 'Tenant'}
            </div>
            <div className='mt-0.5 flex flex-wrap items-center gap-2.5 text-xs text-slate-500'>
              {roomNo && <span className='font-medium'>🏠 {roomNo}</span>}
              {bedNo && <span className='font-medium'>🛏️ {bedNo}</span>}
              {typeof rentPrice === 'number' && (
                <span className='font-semibold text-blue-600'>
                  ₹{rentPrice}/mo
                </span>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div
            className='shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold'
            style={{
              backgroundColor: `${statusColor}20`,
              color: statusColor,
            }}
          >
            {t.status}
          </div>
        </div>

        {/* Row 2: Payment Badges */}
        <div className='mt-3 flex flex-wrap gap-1.5'>
          {isRentPaid && (
            <PaymentBadge color='#10B981' text='✅ Rent Paid' />
          )}
          {isAdvancePaid && (
            <PaymentBadge color='#10B981' text='✅ Advance Paid' />
          )}
          {isRentPartial && (
            <PaymentBadge color='#F97316' text='⏳ Partial Payment' />
          )}
          {hasPendingRent && (
            <PaymentBadge color='#F59E0B' text='📅 Pending Rent' />
          )}
          {hasOutstandingAmount && (
            <PaymentBadge color='#EF4444' text={`₹${rentDueAmount} Due`} />
          )}
          {!isAdvancePaid && (
            <PaymentBadge color='#F59E0B' text='💰 No Advance' />
          )}
        </div>

        {/* Row 3: Check-in Date */}
        <div className='mt-2.5 text-xs text-slate-400'>
          📅 Check-in: {formatDate(t.check_in_date)}
        </div>
      </motion.div>
    )
  }

  return (
    <div className='container mx-auto max-w-6xl px-4 py-4'>
      <PageHeader
        title='Tenants'
        subtitle={`Showing ${tenants.length} of ${total} tenants`}
        showBack={true}
        right={
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => navigate('/tenants/upcoming-vacancies')}
            >
              <BedDouble className='mr-1 size-3.5' />
              Upcoming Vacancies
            </Button>
            <Button
              size='sm'
              disabled={!selectedPGLocationId || !canCreate}
              onClick={() => navigate('/tenants/new')}
              className='bg-black text-white hover:bg-black/90'
            >
              <Plus className='mr-1 size-3.5' />
              Add Tenant
            </Button>
          </div>
        }
      />

      {fetchErrorMessage ? (
        <div className='mt-4'>
          <Alert variant='destructive'>
            <CircleAlert />
            <AlertTitle>Failed to load tenants</AlertTitle>
            <AlertDescription>{fetchErrorMessage}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {!selectedPGLocationId ? (
        <div className='mt-4'>
          <EmptyState
            emoji='📍'
            title='Select a PG Location'
            description='Choose a PG from the top bar to manage tenants.'
          />
        </div>
      ) : (
        <>
          {/* Search & Filter Bar */}
          <div className='mt-4 flex items-center gap-2'>
            <div className='relative flex-1'>
              <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
              <input
                type='text'
                placeholder='Search by name...'
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(1)
                }}
                onKeyDown={(e) => e.key === 'Enter' && void trigger(queryOptions)}
                className='h-10 w-full rounded-lg border border-border bg-muted pl-10 pr-4 text-sm outline-none focus:border-primary'
              />
            </div>
            <Button
              variant={filterCount > 0 ? 'default' : 'outline'}
              size='sm'
              onClick={() => setFiltersOpen(true)}
              className='h-10 px-4'
            >
              <Filter className='mr-2 size-4' />
              Filter
              {filterCount > 0 && (
                <span className='ml-1.5 flex size-5 items-center justify-center rounded-full bg-white text-xs font-bold text-primary'>
                  {filterCount}
                </span>
              )}
            </Button>
          </div>

          {/* Active filter badges */}
          {(filterCount > 0 || selectedRoomId !== null) && (
            <div className='mt-3 flex flex-wrap items-center gap-2'>
              <Badge variant='outline' className='h-7 px-2.5 text-xs font-medium'>
                {activeRoomLabel} · {statusLabel}
              </Badge>
              {selectedRoomId !== null && (
                <div className='flex items-center gap-2 rounded-lg border-l-4 border-l-blue-600 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600'>
                  🏠 Showing all tenants from selected room ({tenants.length} total)
                </div>
              )}
            </div>
          )}

          <div className='mt-4 pb-16'>
            {isLoading ? (
              <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3'>
                {Array.from({ length: 9 }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className='flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3'
                  >
                    <div className='h-11 w-11 animate-pulse rounded-full bg-slate-200' />
                    <div className='flex-1'>
                      <div className='mb-1.5 h-3.5 w-1/3 animate-pulse rounded bg-slate-300' />
                      <div className='h-2.5 w-1/2 animate-pulse rounded bg-slate-200' />
                    </div>
                    <div className='h-5 w-16 animate-pulse rounded-lg bg-slate-200' />
                  </div>
                ))}
              </div>
            ) : tenants.length === 0 ? (
              <EmptyState
                emoji='👥'
                title='No Tenants Found'
                description={
                  query.trim()
                    ? `No tenants matching "${query.trim()}"`
                    : 'Add your first tenant to get started'
                }
              />
            ) : (
              <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3'>
                <AnimatePresence>
                  {tenants.map((t, index) => renderTenantCard(t, index))}
                </AnimatePresence>
              </div>
            )}

            {allTenants.length > 0 && (
              <>
                {/* Skeleton loading at the bottom */}
                <AnimatePresence>
                  {(isFetching || (isInfiniteFetching && hasMore)) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className='mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3'
                    >
                      {Array.from({ length: 6 }).map((_, index) => (
                        <div
                          key={`load-skeleton-${index}`}
                          className='flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3'
                        >
                          <div className='h-11 w-11 animate-pulse rounded-full bg-slate-200' />
                          <div className='flex-1'>
                            <div className='mb-1.5 h-3.5 w-1/3 animate-pulse rounded bg-slate-300' />
                            <div className='h-2.5 w-1/2 animate-pulse rounded bg-slate-200' />
                          </div>
                          <div className='h-5 w-16 animate-pulse rounded-lg bg-slate-200' />
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* End of data indicator */}
                <AnimatePresence>
                  {!hasMore && allTenants.length > 0 && !isFetching && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className='mt-8 mb-12 border-t py-4 text-center'
                    >
                      <div className='flex items-center justify-center gap-2 text-sm text-muted-foreground'>
                        <span>
                          Showing all {allTenants.length} tenants
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </>
      )}

      <TenantFilterModal
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        statusFilter={statusFilter}
        selectedRoomId={selectedRoomId}
        pendingRent={pendingRent}
        pendingAdvance={pendingAdvance}
        partialRent={partialRent}
        roomOptions={roomOptions}
        onStatusFilterChange={setStatusFilter}
        onRoomChange={setSelectedRoomId}
        onPendingRentChange={setPendingRent}
        onPendingAdvanceChange={setPendingAdvance}
        onPartialRentChange={setPartialRent}
        onClear={() => {
          setStatusFilter('ALL')
          setSelectedRoomId(null)
          setPendingRent(false)
          setPendingAdvance(false)
          setPartialRent(false)
          setPage(1)
          setAllTenants([])
          void trigger(queryOptions)
        }}
        onApply={() => {
          setPage(1)
          setAllTenants([])
          void trigger(queryOptions)
        }}
      />
    </div>
  )
}
