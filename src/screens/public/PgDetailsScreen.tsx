import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { Seo, breadcrumbSchema, lodgingBusinessSchema } from '@/components/seo'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLazyGetPublicListingByIdQuery } from '@/services/publicListingsApi'

export function PgDetailsScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [trigger, { data: pg, isFetching }] = useLazyGetPublicListingByIdQuery()
  const [activeImage, setActiveImage] = useState(0)

  // Fetch on mount — pass user coordinates if available (for distance calculation)
  useEffect(() => {
    if (!id) return
    let userCoords: { lat: number; lng: number } | null = null
    try {
      const stored = sessionStorage.getItem('pg_user_coords')
      if (stored) userCoords = JSON.parse(stored)
    } catch { /* ignore */ }
    trigger({ id: Number(id), lat: userCoords?.lat, lng: userCoords?.lng })
  }, [id, trigger])

  if (isFetching) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-slate-50'>
        <Loader2 className='size-8 animate-spin text-muted-foreground' />
      </div>
    )
  }

  if (!pg) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center bg-slate-50'>
        <Home className='size-12 text-muted-foreground/50' />
        <h3 className='mt-4 text-lg font-medium'>Listing not found</h3>
        <Button variant='outline' className='mt-4' onClick={() => navigate('/pg-directory')}>
          Back to Directory
        </Button>
      </div>
    )
  }

  const images: string[] = (() => {
    if (!pg.images) return []
    if (Array.isArray(pg.images)) return pg.images
    try {
      return JSON.parse(pg.images as any)
    } catch {
      return []
    }
  })()

  const amenities: string[] = (() => {
    if (!pg.listing_amenities) return []
    if (Array.isArray(pg.listing_amenities)) return pg.listing_amenities
    try {
      return JSON.parse(pg.listing_amenities as any)
    } catch {
      return []
    }
  })()

  const rooms = pg.rooms ?? []
  const availableRooms = rooms.filter((r) => r.available_beds > 0)

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
      {/* Back bar */}
      <div className='sticky top-0 z-10 border-b bg-white/95 backdrop-blur'>
        <div className='mx-auto flex max-w-5xl items-center justify-between px-4 py-3'>
          <Button variant='ghost' size='sm' onClick={() => navigate('/pg-directory')}>
            <ArrowLeft className='size-4' />
            Back to Directory
          </Button>
          <Button variant='outline' size='sm' onClick={handleShare}>
            <Share2 className='size-4' />
            Share
          </Button>
        </div>
      </div>

      <div className='mx-auto max-w-5xl px-4 py-6'>
        {/* Image Gallery */}
        <div className='mb-6 overflow-hidden rounded-2xl bg-white shadow-sm'>
          {images.length > 0 ? (
            <>
              <div className='relative h-64 sm:h-96'>
                <img
                  src={images[activeImage]}
                  alt={pg.location_name}
                  className='size-full object-cover'
                />
                {pg.is_featured && (
                  <Badge className='absolute left-4 top-4 bg-amber-500 text-white hover:bg-amber-500'>
                    <Star className='mr-1 size-3' />
                    Featured
                  </Badge>
                )}
              </div>
              {images.length > 1 && (
                <div className='flex gap-2 overflow-x-auto p-3'>
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`size-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                        activeImage === idx ? 'border-blue-600' : 'border-transparent opacity-60'
                      }`}
                    >
                      <img src={img} alt='' className='size-full object-cover' />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className='flex h-64 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 sm:h-96'>
              <Home className='size-16 text-slate-300' />
            </div>
          )}
        </div>

        {/* Header */}
        <div className='mb-6 rounded-2xl bg-white p-6 shadow-sm'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div>
              <div className='flex items-center gap-2'>
                <h1 className='text-2xl font-bold'>{pg.location_name}</h1>
                <Badge variant='secondary'>{pg.pg_type === 'COLIVING' ? 'Co-living' : 'PG'}</Badge>
              </div>
              <p className='mt-1 flex items-center gap-1 text-sm text-muted-foreground'>
                <MapPin className='size-4' />
                {pg.address}
                {pg.city?.name && `, ${pg.city.name}`}
                {pg.state?.name && `, ${pg.state.name}`}
                {pg.pincode && ` - ${pg.pincode}`}
              </p>
              {pg.distance_km != null && Number(pg.distance_km) > 0 && (
                <p className='mt-1 text-sm text-blue-600'>
                  <MapPin className='inline size-4' />
                  {pg.distance_km} km from your location
                </p>
              )}
            </div>

            {/* Price */}
            <div className='text-right'>
              {pg.starting_price !== null ? (
                <>
                  <div className='flex items-center text-2xl font-bold text-slate-900'>
                    <IndianRupee className='size-5' />
                    {pg.starting_price.toLocaleString('en-IN')}
                    <span className='text-sm font-normal text-muted-foreground'>/month</span>
                  </div>
                  <p className='text-xs text-muted-foreground'>Starting price</p>
                </>
              ) : (
                <span className='text-sm text-muted-foreground'>Price on request</span>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className='mt-4 grid grid-cols-3 gap-4 border-t pt-4'>
            <div className='text-center'>
              <div className='text-xl font-bold text-emerald-600'>{pg.available_beds}</div>
              <div className='text-xs text-muted-foreground'>Available</div>
            </div>
            <div className='text-center'>
              <div className='text-xl font-bold'>{pg.total_beds}</div>
              <div className='text-xs text-muted-foreground'>Total Beds</div>
            </div>
            <div className='text-center'>
              <div className='text-xl font-bold'>{availableRooms.length}</div>
              <div className='text-xs text-muted-foreground'>Rooms</div>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          {/* Left column: Description + Rooms */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Description */}
            {pg.listing_description && (
              <div className='rounded-2xl bg-white p-6 shadow-sm'>
                <h2 className='mb-3 text-lg font-semibold'>About this PG</h2>
                <p className='text-sm text-muted-foreground whitespace-pre-line'>
                  {pg.listing_description}
                </p>
              </div>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <div className='rounded-2xl bg-white p-6 shadow-sm'>
                <h2 className='mb-3 text-lg font-semibold'>Amenities</h2>
                <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
                  {amenities.map((a, i) => (
                    <div key={i} className='flex items-center gap-2 text-sm'>
                      <CheckCircle2 className='size-4 text-emerald-600' />
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rooms & Beds */}
            {rooms.length > 0 && (
              <div className='rounded-2xl bg-white p-6 shadow-sm'>
                <h2 className='mb-4 text-lg font-semibold'>Available Rooms</h2>
                <div className='space-y-3'>
                  {rooms.map((room) => (
                    <div
                      key={room.s_no}
                      className='rounded-xl border p-4 transition-colors hover:bg-slate-50'
                    >
                      <div className='flex items-center justify-between'>
                        <div>
                          <h3 className='font-medium'>
                            Room {room.room_no || room.s_no}
                          </h3>
                          <p className='text-sm text-muted-foreground'>
                            {room.available_beds} of {room.total_beds} beds available
                          </p>
                        </div>
                        <Badge variant={room.available_beds > 0 ? 'default' : 'secondary'}>
                          {room.available_beds > 0 ? 'Available' : 'Full'}
                        </Badge>
                      </div>

                      {/* Beds */}
                      {room.beds && room.beds.length > 0 && (
                        <div className='mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3'>
                          {room.beds.map((bed) => (
                            <div
                              key={bed.s_no}
                              className={`flex items-center justify-between rounded-lg border p-2 text-sm ${
                                bed.is_occupied ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'
                              }`}
                            >
                              <div className='flex items-center gap-1.5'>
                                <BedDouble className='size-4' />
                                <span>Bed {bed.bed_no}</span>
                              </div>
                              <div className='flex items-center gap-1'>
                                <IndianRupee className='size-3' />
                                <span className='font-medium'>
                                  {Number(bed.bed_price).toLocaleString('en-IN')}
                                </span>
                              </div>
                              {bed.is_occupied ? (
                                <XCircle className='size-4 text-red-500' />
                              ) : (
                                <CheckCircle2 className='size-4 text-emerald-600' />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column: Contact card */}
          <div className='space-y-4'>
            <div className='sticky top-20 rounded-2xl bg-white p-6 shadow-sm'>
              <h2 className='mb-4 text-lg font-semibold'>Contact this PG</h2>

              {pg.available_beds > 0 ? (
                <div className='mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700'>
                  <CheckCircle2 className='inline size-4' />
                  {' '}{pg.available_beds} beds available for rent
                </div>
              ) : (
                <div className='mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700'>
                  Currently fully occupied — contact for waitlist
                </div>
              )}

              <div className='space-y-3'>
                {pg.listing_contact_phone && (
                  <>
                    <a href={`tel:${pg.listing_contact_phone}`} className='block'>
                      <Button className='w-full' variant='outline'>
                        <Phone className='size-4' />
                        Call {pg.listing_contact_phone}
                      </Button>
                    </a>
                    <Button className='w-full' variant='default' onClick={handleWhatsApp}>
                      <MessageCircle className='size-4' />
                      WhatsApp
                    </Button>
                  </>
                )}

                {pg.listing_contact_email && (
                  <a href={`mailto:${pg.listing_contact_email}`} className='block'>
                    <Button className='w-full' variant='ghost'>
                      <Mail className='size-4' />
                      Email
                    </Button>
                  </a>
                )}

                {!pg.listing_contact_phone && !pg.listing_contact_email && (
                  <p className='text-center text-sm text-muted-foreground py-4'>
                    Contact information not available for this listing.
                  </p>
                )}
              </div>

              <div className='mt-4 border-t pt-4 text-xs text-muted-foreground'>
                <p>Listing ID: #{pg.s_no}</p>
                {pg.published_at && (
                  <p>Listed since: {new Date(pg.published_at).toLocaleDateString('en-IN')}</p>
                )}
                <p>{pg.view_count} views</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
