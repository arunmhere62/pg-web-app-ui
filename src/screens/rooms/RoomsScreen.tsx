import { useEffect, useMemo, useState } from 'react'
import {
  useLazyGetAllRoomsQuery,
  useDeleteRoomMutation,
  type Room,
} from '@/services/roomsApi'
import { useAppSelector } from '@/store/hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { CircleAlert, Plus, Filter, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/form/page-header'
import { FilterModal } from '@/components/rooms/FilterModal'
import { RoomFormDialog } from './RoomFormDialog'
import { usePermissions } from '@/hooks/usePermissions'
import { Permission } from '@/config/rbac.config'

type ErrorLike = {
  data?: { message?: string }
  message?: string
}

const getSharingType = (room: Room) => {
  const total = room.total_beds ?? room.beds?.length ?? 0
  if (total === 1) return 'Single Sharing'
  if (total === 2) return 'Double Sharing'
  if (total === 3) return 'Triple Sharing'
  return `${total} Bed Sharing`
}

const getRoomPrice = (room: Room) => {
  const prices = (room.beds || [])
    .map((b) => Number(b.bed_price) || 0)
    .filter((p) => p > 0)
  if (prices.length === 0) return { min: 0, max: 0 }
  return { min: Math.min(...prices), max: Math.max(...prices) }
}

const getAvailability = (room: Room) => {
  const total = room.total_beds ?? room.beds?.length ?? 0
  const occupied =
    typeof room.occupied_beds === 'number'
      ? room.occupied_beds
      : (room.beds || []).filter((b) => Boolean(b.is_occupied)).length
  const available =
    typeof room.available_beds === 'number'
      ? room.available_beds
      : Math.max(total - occupied, 0)
  return { total, occupied, available }
}

const formatPrice = (price: number) =>
  price > 0 ? `₹${price.toLocaleString('en-IN')}` : '—'

const formatRoomNo = (roomNo: string) => {
  if (roomNo?.startsWith('RM-')) return roomNo
  if (roomNo?.startsWith('RM')) return `RM-${roomNo.slice(2)}`
  return `RM-${roomNo}`
}

export function RoomsScreen() {
  const navigate = useNavigate()
  const selectedPGLocationId =
    useAppSelector((s) => s.pgLocations.selectedPGLocationId) ?? null

  const [page, setPage] = useState(1)
  const limit = 100
  const [filter, setFilter] = useState<'all' | 'occupied' | 'available'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [paginationState, setPaginationState] = useState({
    allRooms: [] as Room[],
    hasMore: true,
    hasLoadedOnce: false,
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Room | null>(null)
  const [filterModalOpen, setFilterModalOpen] = useState(false)

  const { can } = usePermissions()
  const canCreate = can(Permission.CREATE_ROOM)

  const queryOptions = useMemo(() => {
    if (!selectedPGLocationId) return undefined

    return {
      page,
      limit,
      occupancy: filter === 'all' ? undefined : filter,
      search: appliedSearch || undefined,
    }
  }, [page, limit, selectedPGLocationId, filter, appliedSearch])

  const [trigger, { data: roomsResponse, isLoading, isFetching, error }] =
    useLazyGetAllRoomsQuery()
  const [deleteRoom, { isLoading: deleting }] = useDeleteRoomMutation()

  useEffect(() => {
    setTimeout(() => {
      setPage(1)
      setPaginationState({
        allRooms: [],
        hasMore: true,
        hasLoadedOnce: false,
      })
    }, 0)
  }, [selectedPGLocationId, filter, appliedSearch])

  useEffect(() => {
    if (selectedPGLocationId && queryOptions) {
      void trigger(queryOptions)
    }
  }, [trigger, queryOptions, selectedPGLocationId])

  const { isFetching: isInfiniteFetching, checkScroll } = useInfiniteScroll({
    hasMore: paginationState.hasMore,
    isLoading: isFetching,
  })

  useEffect(() => {
    if (roomsResponse?.data) {
      setTimeout(() => {
        if (page === 1) {
          setPaginationState((prev) => ({
            ...prev,
            allRooms: roomsResponse.data,
            hasMore: roomsResponse.pagination?.hasMore ?? false,
            hasLoadedOnce: true,
          }))
        } else {
          setPaginationState((prev) => {
            const existingIds = new Set(prev.allRooms.map((room) => room.s_no))
            const newRooms = roomsResponse.data.filter(
              (room) => !existingIds.has(room.s_no)
            )
            return {
              ...prev,
              allRooms: [...prev.allRooms, ...newRooms],
              hasMore: roomsResponse.pagination?.hasMore ?? false,
              hasLoadedOnce: true,
            }
          })
        }
      }, 0)

      setTimeout(() => {
        checkScroll()
      }, 100)
    }
  }, [roomsResponse, page, checkScroll])

  useEffect(() => {
    if (
      isInfiniteFetching &&
      paginationState.hasMore &&
      !isFetching &&
      selectedPGLocationId
    ) {
      const nextPage = page + 1
      setTimeout(() => {
        setPage(nextPage)
      }, 0)
      void trigger({
        ...queryOptions!,
        page: nextPage,
      })
    }
  }, [
    isInfiniteFetching,
    paginationState.hasMore,
    isFetching,
    page,
    trigger,
    queryOptions,
    selectedPGLocationId,
  ])

  const rooms = paginationState.allRooms

  const fetchErrorMessage =
    (error as ErrorLike | undefined)?.data?.message ||
    (error as ErrorLike | undefined)?.message

  const openCreate = () => {
    setEditTarget(null)
    setDialogOpen(true)
  }

  const handleSearch = () => {
    if (!selectedPGLocationId) return
    setAppliedSearch(searchQuery)
  }

  const totalCount =
    roomsResponse?.pagination?.total ?? paginationState.allRooms.length

  // Group rooms by sharing type — matching mobile UI
  const groupedRooms = useMemo(() => {
    let list = rooms.filter((r) => {
      if (!appliedSearch) return true
      const q = appliedSearch.toLowerCase()
      return r.room_no?.toLowerCase().includes(q)
    })

    const groups: Record<string, Room[]> = {}
    list.forEach((room) => {
      const key = getSharingType(room)
      if (!groups[key]) groups[key] = []
      groups[key].push(room)
    })

    const order = ['Single Sharing', 'Double Sharing', 'Triple Sharing']
    const entries = Object.entries(groups).sort(([a], [b]) => {
      const idxA = order.indexOf(a)
      const idxB = order.indexOf(b)
      if (idxA !== -1 && idxB !== -1) return idxA - idxB
      if (idxA !== -1) return -1
      if (idxB !== -1) return 1
      return a.localeCompare(b)
    })

    return entries.map(([title, data]) => ({
      title,
      data: [...data].sort((a, b) => {
        const numA = parseInt(a.room_no?.replace(/\D/g, '') || '0', 10)
        const numB = parseInt(b.room_no?.replace(/\D/g, '') || '0', 10)
        return numA - numB
      }),
    }))
  }, [rooms, appliedSearch])

  const renderRoomChip = (room: Room, index: number) => {
    const { total, available } = getAvailability(room)
    const { min, max } = getRoomPrice(room)
    const isFull = available === 0
    const isAvailable = available === total
    const roomNo = formatRoomNo(room.room_no || '')
    const cardBg = isAvailable ? 'bg-emerald-50' : isFull ? 'bg-red-50' : 'bg-amber-50'
    const borderColor = isAvailable ? 'border-emerald-200' : isFull ? 'border-red-200' : 'border-amber-200'
    const badgeBg = isAvailable ? 'bg-emerald-500' : isFull ? 'bg-red-500' : 'bg-amber-500'
    const badgeText = isAvailable ? 'AVAILABLE' : isFull ? 'NOT AVAILABLE' : `${available} LEFT`

    return (
      <motion.div
        key={`room-${room.s_no}-${room.room_no}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{
          duration: 0.2,
          delay: Math.min(index * 0.03, 0.2),
          ease: 'easeOut',
        }}
        className={`cursor-pointer rounded-xl border ${borderColor} ${cardBg} p-2.5 transition-all hover:shadow-md`}
        onClick={() => navigate(`/rooms/${room.s_no}`)}
      >
        {/* Room number */}
        <h3 className='text-[13px] font-extrabold leading-tight text-slate-800 truncate'>
          {roomNo}
        </h3>

        {/* Bed count */}
        <p className='text-[10px] text-slate-500 mb-1.5'>
          {total} beds
        </p>

        {/* Availability badge */}
        <div className={`inline-block rounded-md ${badgeBg} px-1.5 py-0.5 mb-1.5`}>
          <span className='text-[9px] font-extrabold tracking-wide text-white'>
            {badgeText}
          </span>
        </div>

        {/* Price */}
        <p className='text-xs font-bold text-blue-600'>
          {min === max ? formatPrice(min) : `${formatPrice(min)} - ${formatPrice(max)}`}
        </p>
      </motion.div>
    )
  }

  return (
    <div className='container mx-auto max-w-6xl px-4 py-4'>
      <PageHeader
        title='Rooms'
        subtitle={`${totalCount} total`}
        showBack={true}
        right={
          <Button
            size='sm'
            onClick={openCreate}
            disabled={!selectedPGLocationId || !canCreate}
            className='bg-black text-white hover:bg-black/90'
          >
            <Plus className='mr-1 size-3.5' />
            Add Room
          </Button>
        }
      />

      {fetchErrorMessage ? (
        <div className='mt-4 mb-3'>
          <Alert variant='destructive'>
            <CircleAlert />
            <AlertTitle>Failed to load rooms</AlertTitle>
            <AlertDescription>{fetchErrorMessage}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {!selectedPGLocationId ? (
        <EmptyState
          emoji='📍'
          title='Select a PG Location'
          description='Choose a PG from the top bar.'
        />
      ) : (
        <>
          {/* Search bar + filter */}
          <div className='mt-3 flex items-center gap-2'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
              <input
                type='text'
                placeholder='Search by room number...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className='h-10 w-full rounded-lg border border-border bg-muted pl-10 pr-4 text-sm outline-none focus:border-primary'
              />
            </div>
            <Button
              variant={filter !== 'all' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setFilterModalOpen(true)}
              className='h-10 px-4'
            >
              <Filter className='mr-2 size-4' />
              Filter
            </Button>
          </div>

          {filter !== 'all' && (
            <div className='mt-3 mb-2 flex items-center gap-2'>
              <span className='rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground'>
                {filter === 'occupied' ? 'Occupied' : 'Available'}
              </span>
              {appliedSearch && (
                <span className='rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium'>
                  "{appliedSearch}"
                </span>
              )}
            </div>
          )}

          <div className='pb-16'>
            {isLoading ? (
              <div className='grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6'>
                {Array.from({ length: 18 }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className='h-[110px] animate-pulse rounded-xl border border-slate-200 bg-slate-100 p-2.5'
                  >
                    <div className='mb-2 h-3 w-3/4 rounded bg-slate-300' />
                    <div className='mb-2 h-2 w-1/2 rounded bg-slate-200' />
                    <div className='mb-2 h-4 w-16 rounded bg-slate-300' />
                    <div className='h-3 w-20 rounded bg-slate-200' />
                  </div>
                ))}
              </div>
            ) : rooms.length === 0 && paginationState.hasLoadedOnce ? (
              <EmptyState
                emoji='🏠'
                title='No Rooms Found'
                description={
                  appliedSearch
                    ? 'Try a different search term'
                    : 'Add your first room to get started'
                }
              />
            ) : (
              <div className='space-y-4'>
                <AnimatePresence>
                  {groupedRooms.map((section) => (
                    <div key={section.title}>
                      {/* Section header */}
                      <div className='mb-2.5 flex items-center justify-between px-1'>
                        <h2 className='text-sm font-extrabold text-slate-800'>
                          {section.title}
                        </h2>
                        <span className='text-xs font-semibold text-slate-500'>
                          {section.data.length} rooms
                        </span>
                      </div>

                      {/* Chips grid */}
                      <div className='grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7'>
                        {section.data.map((room, idx) => renderRoomChip(room, idx))}
                      </div>
                    </div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {paginationState.allRooms.length > 0 && (
              <>
                <AnimatePresence>
                  {(isFetching ||
                    (isInfiniteFetching && paginationState.hasMore)) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className='mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7'
                    >
                      {Array.from({ length: 14 }).map((_, index) => (
                        <div
                          key={`load-skeleton-${index}`}
                          className='h-[110px] animate-pulse rounded-xl border border-slate-200 bg-slate-100 p-2.5'
                        >
                          <div className='mb-2 h-3 w-3/4 rounded bg-slate-300' />
                          <div className='mb-2 h-2 w-1/2 rounded bg-slate-200' />
                          <div className='mb-2 h-4 w-16 rounded bg-slate-300' />
                          <div className='h-3 w-20 rounded bg-slate-200' />
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {!paginationState.hasMore &&
                    paginationState.allRooms.length > 0 &&
                    !isFetching && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className='mt-8 mb-12 border-t py-4 text-center'
                      >
                        <div className='flex items-center justify-center gap-2 text-sm text-muted-foreground'>
                          <span>
                            Showing all {paginationState.allRooms.length} rooms
                          </span>
                        </div>
                      </motion.div>
                    )}
                </AnimatePresence>
              </>
            )}
          </div>

          <RoomFormDialog
            open={dialogOpen}
            onOpenChange={(open: boolean) => {
              setDialogOpen(open)
              if (!open) setEditTarget(null)
            }}
            editTarget={editTarget}
            pgId={selectedPGLocationId}
            onSaved={() => {
              setDialogOpen(false)
              setEditTarget(null)
              setPage(1)
              setPaginationState({
                allRooms: [],
                hasMore: true,
                hasLoadedOnce: false,
              })
              if (selectedPGLocationId && queryOptions) {
                void trigger(queryOptions)
              }
            }}
          />

          <FilterModal
            open={filterModalOpen}
            onOpenChange={setFilterModalOpen}
            filter={filter}
            onFilterChange={setFilter}
          />

        </>
      )}
    </div>
  )
}
