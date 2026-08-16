import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Star,
  BedDouble,
  IndianRupee,
  Phone,
  Mail,
  MessageCircle,
  Home,
  Loader2,
  CheckCircle2,
  XCircle,
  Share2,
  Users,
  Eye,
  CalendarDays,
  Wifi,
  Car,
  Wind,
  Zap,
  Droplets,
  ShieldCheck,
  Sofa,
  DoorOpen,
  ImageOff,
} from 'lucide-react'
import { Seo, breadcrumbSchema, lodgingBusinessSchema } from '@/components/seo'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useLazyGetPublicListingByIdQuery } from '@/services/publicListingsApi'
import type { PublicListingDetails } from '@/services/publicListingsApi'

// ─── Helpers ───

function parseImages(val: unknown): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val as string[]
  if (typeof val === 'string') {
    try { return JSON.parse(val) } catch { return [] }
  }
  return []
}

function parseAmenities(val: unknown): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val as string[]
  if (typeof val === 'string') {
    try { return JSON.parse(val) } catch { return [] }
  }
  return []
}

const AMENITY_ICONS: Record<string, typeof Wifi> = {
  wifi: Wifi,
  'wi-fi': Wifi,
  ac: Wind,
  'air conditioning': Wind,
  parking: Car,
  power: Zap,
  'power backup': Zap,
  water: Droplets,
  'hot water': Droplets,
  security: ShieldCheck,
  cctv: ShieldCheck,
  sofa: Sofa,
  tv: Sofa,
}

function getAmenityIcon(amenity: string) {
  const key = amenity.toLowerCase().trim()
  for (const [match, Icon] of Object.entries(AMENITY_ICONS)) {
    if (key.includes(match)) return Icon
  }
  return CheckCircle2
}

const ROOM_PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#e2e8f0"/><stop offset="100%" stop-color="#cbd5e1"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><rect x="80" y="120" width="240" height="120" rx="8" fill="#94a3b8" opacity="0.4"/><rect x="100" y="140" width="80" height="80" rx="4" fill="#64748b" opacity="0.3"/><rect x="220" y="140" width="80" height="80" rx="4" fill="#64748b" opacity="0.3"/><circle cx="200" cy="100" r="20" fill="#94a3b8" opacity="0.3"/><text x="200" y="280" font-family="sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">Room photo coming soon</text></svg>`
  )

const BED_PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f1f5f9"/><stop offset="100%" stop-color="#e2e8f0"/></linearGradient></defs><rect width="200" height="150" fill="url(#g)"/><rect x="40" y="60" width="120" height="50" rx="6" fill="#94a3b8" opacity="0.35"/><rect x="50" y="50" width="30" height="20" rx="3" fill="#64748b" opacity="0.25"/><text x="100" y="135" font-family="sans-serif" font-size="10" fill="#94a3b8" text-anchor="middle">Bed photo</text></svg>`
  )

// ─── Room Card ───

function RoomCard({ room }: { room: NonNullable<PublicListingDetails['rooms']>[number] }) {
  const roomImages = parseImages(room.images)
  const [activeRoomImage, setActiveRoomImage] = useState(0)
  const [showAllBeds, setShowAllBeds] = useState(false)

  const isAvailable = room.available_beds > 0
  const visibleBeds = showAllBeds ? room.beds : room.beds.slice(0, 4)
  const hasRoomImages = roomImages.length > 0
  const currentRoomImage = hasRoomImages ? roomImages[activeRoomImage] : ROOM_PLACEHOLDER

  return (
    <Card className='@container group overflow-hidden p-0 transition-all duration-300 hover:shadow-lg'>
      {/* Room image gallery */}
      <div className='relative h-44 overflow-hidden sm:h-52'>
        <img
          src={currentRoomImage}
          alt={`Room ${room.room_no || room.s_no}`}
          className={`size-full object-cover transition-transform duration-500 group-hover:scale-105 ${!hasRoomImages ? 'object-center' : ''}`}
          loading='lazy'
        />
        {/* Gradient overlay for badges */}
        <div className='absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent' />

        {/* Availability badge */}
        <div className='absolute right-3 top-3 flex items-center gap-2'>
          {isAvailable ? (
            <Badge className='bg-emerald-500/90 text-white shadow-md backdrop-blur hover:bg-emerald-500'>
              <CheckCircle2 className='mr-1 size-3' />
              {room.available_beds} Available
            </Badge>
          ) : (
            <Badge className='bg-red-500/90 text-white shadow-md backdrop-blur hover:bg-red-500'>
              <XCircle className='mr-1 size-3' />
              Full
            </Badge>
          )}
        </div>

        {/* Room number overlay */}
        <div className='absolute bottom-2.5 left-2.5 flex items-center gap-1.5 @sm:gap-2'>
          <div className='flex size-7 items-center justify-center rounded-lg bg-white/90 shadow-sm backdrop-blur @sm:size-8'>
            <DoorOpen className='size-3.5 text-slate-700 @sm:size-4' />
          </div>
          <span className='text-xs font-semibold text-white drop-shadow @sm:text-sm'>
            Room {room.room_no || room.s_no}
          </span>
        </div>

        {/* Image thumbnails */}
        {hasRoomImages && roomImages.length > 1 && (
          <div className='absolute bottom-2.5 right-2.5 hidden gap-1 @sm:flex @sm:gap-1.5'>
            {roomImages.slice(0, 3).map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveRoomImage(idx)}
                className={`size-7 overflow-hidden rounded-md border-2 transition-all @sm:size-9 ${
                  activeRoomImage === idx ? 'border-white scale-110' : 'border-white/40 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img} alt='' className='size-full object-cover' />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Room info */}
      <CardContent className='p-3 @sm:p-4'>
        <div className='flex items-center justify-between gap-2'>
          <div className='flex items-center gap-1.5 text-xs text-muted-foreground @sm:gap-3 @sm:text-sm'>
            <BedDouble className='size-3.5 shrink-0 @sm:size-4' />
            <span className='font-medium text-foreground'>{room.available_beds}</span>
            <span>/ {room.total_beds} beds</span>
          </div>
          <div className='flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground @sm:text-xs'>
            <Users className='size-3 @sm:size-3.5' />
            {room.total_beds} total
          </div>
        </div>

        <Separator className='my-3' />

        {/* Beds grid */}
        {room.beds && room.beds.length > 0 && (
          <>
            <div className='grid grid-cols-2 gap-2 @sm:gap-3 @lg:grid-cols-3'>
              {visibleBeds.map((bed) => {
                const bedImages = parseImages(bed.images)
                const hasBedImage = bedImages.length > 0 && !bed.is_occupied
                return (
                  <div
                    key={bed.s_no}
                    className={`group/bed overflow-hidden rounded-xl border transition-all hover:shadow-sm ${
                      bed.is_occupied
                        ? 'border-red-200/60 bg-red-50/30 hover:border-red-300'
                        : 'border-emerald-200/60 bg-emerald-50/30 hover:border-emerald-300'
                    }`}
                  >
                    {/* Bed image — always show, placeholder if none */}
                    <div className='relative h-20 overflow-hidden'>
                      <img
                        src={hasBedImage ? bedImages[0] : BED_PLACEHOLDER}
                        alt={`Bed ${bed.bed_no}`}
                        className={`size-full object-cover transition-transform duration-300 group-hover/bed:scale-105 ${
                          bed.is_occupied ? 'opacity-80' : ''
                        }`}
                        loading='lazy'
                      />
                      {/* Status icon overlay */}
                      <div className='absolute right-1.5 top-1.5'>
                        {bed.is_occupied ? (
                          <div className='flex size-5 items-center justify-center rounded-full bg-red-500 shadow-sm'>
                            <XCircle className='size-3.5 text-white' />
                          </div>
                        ) : (
                          <div className='flex size-5 items-center justify-center rounded-full bg-emerald-500 shadow-sm'>
                            <CheckCircle2 className='size-3.5 text-white' />
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Bed info */}
                    <div className='p-2 @sm:p-2.5'>
                      <div className='flex items-center justify-between gap-1'>
                        <span className='truncate text-xs font-semibold text-foreground'>
                          {bed.bed_no}
                        </span>
                        {bed.is_occupied ? (
                          <span className='text-[10px] font-medium text-red-600'>Occupied</span>
                        ) : (
                          <span className='text-[10px] font-medium text-emerald-600'>Available</span>
                        )}
                      </div>
                      <div className='mt-1 flex items-center gap-0.5 text-sm font-bold text-foreground'>
                        <IndianRupee className='size-3 text-muted-foreground' />
                        {Number(bed.bed_price).toLocaleString('en-IN')}
                        <span className='text-[10px] font-normal text-muted-foreground'>/mo</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Show more beds */}
            {room.beds.length > 4 && (
              <button
                onClick={() => setShowAllBeds((v) => !v)}
                className='mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground'
              >
                {showAllBeds ? (
                  <>Show less</>
                ) : (
                  <>Show all {room.beds.length} beds <BedDouble className='size-3' /></>
                )}
              </button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Main Screen ───

export function PgDetailsScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [trigger, { data: pg, isFetching }] = useLazyGetPublicListingByIdQuery()
  const [activeImage, setActiveImage] = useState(0)
  const [roomFilter, setRoomFilter] = useState<'all' | 'available' | 'full'>('all')

  useEffect(() => {
    if (!id) return
    let userCoords: { lat: number; lng: number } | null = null
    try {
      const stored = sessionStorage.getItem('pg_user_coords')
      if (stored) userCoords = JSON.parse(stored)
    } catch { /* ignore */ }
    trigger({ id: Number(id), lat: userCoords?.lat, lng: userCoords?.lng })
  }, [id, trigger])

  const rooms = pg?.rooms ?? []
  const availableRooms = rooms.filter((r) => r.available_beds > 0)
  const fullRooms = rooms.filter((r) => r.available_beds === 0)

  const filteredRooms = useMemo(() => {
    if (roomFilter === 'available') return availableRooms
    if (roomFilter === 'full') return fullRooms
    return rooms
  }, [rooms, availableRooms, fullRooms, roomFilter])

  if (isFetching) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center bg-slate-50'>
        <Loader2 className='size-10 animate-spin text-primary' />
        <p className='mt-4 text-sm text-muted-foreground'>Loading details...</p>
      </div>
    )
  }

  if (!pg) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center bg-slate-50'>
        <div className='flex size-20 items-center justify-center rounded-full bg-slate-100'>
          <Home className='size-10 text-muted-foreground/40' />
        </div>
        <h3 className='mt-6 text-xl font-semibold text-slate-700'>Listing not found</h3>
        <p className='mt-2 text-sm text-muted-foreground'>This listing may have been removed or is no longer available.</p>
        <Button variant='outline' className='mt-6' onClick={() => navigate('/pg-directory')}>
          <ArrowLeft className='size-4' />
          Back to Directory
        </Button>
      </div>
    )
  }

  const images = parseImages(pg.images)
  const amenities = parseAmenities(pg.listing_amenities)

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: pg.location_name,
        text: `Check out ${pg.location_name} - ${pg.address}`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  const handleWhatsApp = () => {
    if (pg.listing_contact_phone) {
      const phone = pg.listing_contact_phone.replace(/\D/g, '')
      const msg = `Hi, I'm interested in ${pg.location_name} (${pg.address}). Is it available?`
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
    }
  }

  const pageTitle = `${pg.location_name}${pg.city?.name ? `, ${pg.city.name}` : ''} — PG & Co-living`
  const pageDescription = pg.listing_description
    ? `${pg.listing_description}${pg.starting_price ? ` Starting from ₹${pg.starting_price}/month.` : ''}`
    : `Verified ${pg.pg_type === 'COLIVING' ? 'co-living space' : 'PG'} in ${pg.city?.name || 'India'}${pg.starting_price ? ` starting from ₹${pg.starting_price}/month.` : ''}. ${pg.available_beds} beds available. Book now on IPGM.`
  const canonicalPath = pg.slug ? `/pg-directory/${pg.slug}` : `/pg-directory/${pg.s_no}`

  return (
    <>
    <Seo
      title={pageTitle}
      description={pageDescription}
      keywords={[
        pg.location_name,
        `PG in ${pg.city?.name || 'India'}`,
        pg.pg_type === 'COLIVING' ? 'co-living' : 'PG',
        `${pg.city?.name} PG`,
        'paying guest',
        pg.listing_amenities?.[0] || 'AC PG',
      ].filter(Boolean)}
      canonical={canonicalPath}
      type='product'
      image={images[0]}
      imageAlt={pg.location_name}
      schema={[
        breadcrumbSchema([
          { name: 'Home', url: '/home' },
          { name: 'PG Directory', url: '/pg-directory' },
          { name: pg.location_name, url: canonicalPath },
        ]),
        lodgingBusinessSchema({
          name: pg.location_name,
          description: pg.listing_description || undefined,
          address: pg.address,
          city: pg.city?.name,
          state: pg.state?.name,
          pincode: pg.pincode ?? undefined,
          latitude: pg.latitude,
          longitude: pg.longitude,
          phone: pg.listing_contact_phone || undefined,
          email: pg.listing_contact_email || undefined,
          image: images[0],
          startingPrice: pg.starting_price,
          amenities: pg.listing_amenities || [],
          slug: pg.slug || undefined,
        }),
      ]}
    />
    <div className='min-h-screen bg-slate-50'>
      {/* Top bar */}

      <main className='mx-auto max-w-7xl px-4 py-6'>
        {/* Hero Gallery */}
        <div className='mb-6 overflow-hidden rounded-2xl bg-white shadow-sm'>
          {images.length > 0 ? (
            <>
              <div className='relative h-72 sm:h-[420px]'>
                <img
                  src={images[activeImage]}
                  alt={pg.location_name}
                  className='size-full object-cover'
                  loading='eager'
                  fetchPriority='high'
                />
                {/* Gradient overlay */}
                <div className='absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent' />

                {/* Featured badge */}
                {pg.is_featured && (
                  <Badge className='absolute left-4 top-4 bg-amber-500 text-white shadow-lg hover:bg-amber-500'>
                    <Star className='mr-1 size-3 fill-white' />
                    Featured
                  </Badge>
                )}

                {/* Image counter */}
                {images.length > 1 && (
                  <div className='absolute right-4 top-4 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur'>
                    {activeImage + 1} / {images.length}
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className='flex gap-2 overflow-x-auto p-3'>
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      aria-label={`View image ${idx + 1}`}
                      className={`size-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all sm:size-16 ${
                        activeImage === idx ? 'border-primary scale-105' : 'border-transparent opacity-50 hover:opacity-80'
                      }`}
                    >
                      <img src={img} alt='' className='size-full object-cover' loading='lazy' />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className='flex h-72 flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 sm:h-[420px]'>
              <ImageOff className='size-16 text-slate-300' />
              <p className='mt-3 text-sm text-slate-400'>No photos available</p>
            </div>
          )}
        </div>

        {/* Header Card */}
        <Card className='mb-6 gap-0'>
          <CardContent className='p-6'>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
              <div className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <h1 className='text-2xl font-bold tracking-tight sm:text-3xl'>{pg.location_name}</h1>
                  <Badge variant='secondary' className='shrink-0'>
                    {pg.pg_type === 'COLIVING' ? 'Co-living' : 'PG'}
                  </Badge>
                </div>
                <p className='flex items-start gap-1.5 text-sm text-muted-foreground'>
                  <MapPin className='mt-0.5 size-4 shrink-0' />
                  <span>
                    {pg.address}
                    {pg.city?.name && `, ${pg.city.name}`}
                    {pg.state?.name && `, ${pg.state.name}`}
                    {pg.pincode && ` - ${pg.pincode}`}
                  </span>
                </p>
                {pg.distance_km != null && Number(pg.distance_km) > 0 && (
                  <Badge variant='outline' className='text-blue-600'>
                    <MapPin className='mr-1 size-3' />
                    {pg.distance_km} km from you
                  </Badge>
                )}
              </div>

              {/* Price */}
              <div className='flex shrink-0 items-center justify-between rounded-xl bg-slate-50 px-5 py-3 sm:justify-end sm:text-right'>
                {pg.starting_price !== null ? (
                  <>
                    <div className='flex items-center justify-end text-2xl font-bold text-slate-900'>
                      <IndianRupee className='size-5' />
                      {pg.starting_price.toLocaleString('en-IN')}
                    </div>
                    <p className='text-xs text-muted-foreground'>starting / month</p>
                  </>
                ) : (
                  <span className='text-sm text-muted-foreground'>Price on request</span>
                )}
              </div>
            </div>

            <Separator className='my-5' />

            {/* Quick stats */}
            <div className='grid grid-cols-3 gap-2 sm:gap-4'>
              <div className='flex flex-col items-center rounded-xl bg-emerald-50/50 py-3'>
                <div className='flex items-center gap-1'>
                  <BedDouble className='size-4 text-emerald-600' />
                  <span className='text-xl font-bold text-emerald-600 sm:text-2xl'>{pg.available_beds}</span>
                </div>
                <div className='mt-0.5 text-[10px] text-muted-foreground sm:text-xs'>Available</div>
              </div>
              <div className='flex flex-col items-center rounded-xl bg-slate-50 py-3'>
                <div className='flex items-center gap-1'>
                  <Users className='size-4 text-slate-600' />
                  <span className='text-xl font-bold text-slate-700 sm:text-2xl'>{pg.total_beds}</span>
                </div>
                <div className='mt-0.5 text-[10px] text-muted-foreground sm:text-xs'>Total Beds</div>
              </div>
              <div className='flex flex-col items-center rounded-xl bg-blue-50/50 py-3'>
                <div className='flex items-center gap-1'>
                  <DoorOpen className='size-4 text-blue-600' />
                  <span className='text-xl font-bold text-blue-600 sm:text-2xl'>{availableRooms.length}</span>
                </div>
                <div className='mt-0.5 text-[10px] text-muted-foreground sm:text-xs'>Rooms</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className='space-y-6'>
          {/* Contact card — full width on top */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Contact this PG</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                {/* Availability status */}
                <div className='sm:col-span-2 lg:col-span-1'>
                  {pg.available_beds > 0 ? (
                    <div className='flex h-full items-center gap-2.5 rounded-xl bg-emerald-50 p-3.5'>
                      <CheckCircle2 className='size-5 shrink-0 text-emerald-600' />
                      <div>
                        <p className='text-sm font-medium text-emerald-700'>{pg.available_beds} beds available</p>
                        <p className='text-xs text-emerald-600/70'>Ready for immediate move-in</p>
                      </div>
                    </div>
                  ) : (
                    <div className='flex h-full items-center gap-2.5 rounded-xl bg-red-50 p-3.5'>
                      <XCircle className='size-5 shrink-0 text-red-600' />
                      <div>
                        <p className='text-sm font-medium text-red-700'>Fully occupied</p>
                        <p className='text-xs text-red-600/70'>Contact for waitlist</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact buttons */}
                <div className='flex flex-col gap-2.5 sm:col-span-2 lg:col-span-3 lg:flex-row'>
                  {pg.listing_contact_phone && (
                    <>
                      <a href={`tel:${pg.listing_contact_phone}`} className='block lg:flex-1'>
                        <Button className='w-full' variant='outline' size='lg'>
                          <Phone className='size-4' />
                          Call {pg.listing_contact_phone}
                        </Button>
                      </a>
                      <Button className='w-full lg:flex-1' size='lg' onClick={handleWhatsApp}>
                        <MessageCircle className='size-4' />
                        WhatsApp
                      </Button>
                    </>
                  )}

                  {pg.listing_contact_email && (
                    <a href={`mailto:${pg.listing_contact_email}`} className='block lg:flex-1'>
                      <Button className='w-full' variant='ghost' size='lg'>
                        <Mail className='size-4' />
                        Email
                      </Button>
                    </a>
                  )}

                  {!pg.listing_contact_phone && !pg.listing_contact_email && (
                    <p className='py-4 text-center text-sm text-muted-foreground'>
                      Contact information not available for this listing.
                    </p>
                  )}
                </div>
              </div>

              <Separator className='my-4' />

              {/* Meta info */}
              <div className='flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground'>
                <div className='flex items-center gap-2'>
                  <CalendarDays className='size-3.5' />
                  <span>Listing ID: #{pg.s_no}</span>
                </div>
                {pg.published_at && (
                  <div className='flex items-center gap-2'>
                    <CalendarDays className='size-3.5' />
                    <span>Listed: {new Date(pg.published_at).toLocaleDateString('en-IN')}</span>
                  </div>
                )}
                <div className='flex items-center gap-2'>
                  <Eye className='size-3.5' />
                  <span>{pg.view_count} views</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {pg.listing_description && (
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>About this PG</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-sm leading-relaxed text-muted-foreground whitespace-pre-line'>
                  {pg.listing_description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Amenities */}
          {amenities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4'>
                  {amenities.map((a, i) => {
                    const Icon = getAmenityIcon(a)
                    return (
                      <div key={i} className='flex items-center gap-2.5 rounded-lg bg-slate-50/60 px-3 py-2.5'>
                        <div className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10'>
                          <Icon className='size-4 text-primary' />
                        </div>
                        <span className='text-sm font-medium text-foreground'>{a}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rooms & Beds */}
          {rooms.length > 0 && (
            <Card>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-lg'>Rooms & Beds</CardTitle>
                  <span className='text-sm text-muted-foreground'>
                    {availableRooms.length} of {rooms.length} available
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filter tabs */}
                <Tabs value={roomFilter} onValueChange={(v) => setRoomFilter(v as 'all' | 'available' | 'full')}>
                  <TabsList className='mb-4 w-full justify-start overflow-x-auto'>
                    <TabsTrigger value='all'>All ({rooms.length})</TabsTrigger>
                    <TabsTrigger value='available'>Available ({availableRooms.length})</TabsTrigger>
                    <TabsTrigger value='full'>Full ({fullRooms.length})</TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Room cards */}
                {filteredRooms.length > 0 ? (
                  <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'>
                    {filteredRooms.map((room) => (
                      <RoomCard key={room.s_no} room={room} />
                    ))}
                  </div>
                ) : (
                  <div className='flex flex-col items-center justify-center py-16 text-center'>
                    <div className='flex size-16 items-center justify-center rounded-full bg-slate-100'>
                      <BedDouble className='size-8 text-muted-foreground/30' />
                    </div>
                    <p className='mt-4 text-sm text-muted-foreground'>
                      {roomFilter === 'available'
                        ? 'No rooms currently available'
                        : roomFilter === 'full'
                          ? 'No fully occupied rooms'
                          : 'No rooms listed'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Floating action buttons */}
      <div className='fixed bottom-6 right-4 z-50 flex flex-col gap-3 sm:right-6'>
        <button
          onClick={handleShare}
          className='group flex size-12 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg ring-1 ring-slate-200 transition-all hover:scale-110 hover:bg-slate-50 hover:shadow-xl sm:size-14'
          aria-label='Share'
        >
          <Share2 className='size-5 sm:size-6' />
          <span className='pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 sm:block'>
            Share
          </span>
        </button>

        {pg.listing_contact_phone && (
          <>
            <a
              href={`tel:${pg.listing_contact_phone}`}
              className='group flex size-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all hover:scale-110 hover:bg-blue-700 hover:shadow-xl sm:size-14'
              aria-label='Call'
            >
              <Phone className='size-5 sm:size-6' />
              <span className='pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 sm:block'>
                Call {pg.listing_contact_phone}
              </span>
            </a>

            <button
              onClick={handleWhatsApp}
              className='group flex size-12 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-all hover:scale-110 hover:bg-green-600 hover:shadow-xl sm:size-14'
              aria-label='WhatsApp'
            >
              <MessageCircle className='size-5 sm:size-6' />
              <span className='pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 sm:block'>
                WhatsApp
              </span>
            </button>
          </>
        )}
      </div>
    </div>
    </>
  )
}
