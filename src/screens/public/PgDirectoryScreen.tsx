import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin,
  Navigation,
  Star,
  BedDouble,
  IndianRupee,
  ChevronRight,
  Loader2,
  X,
  Wifi,
  Utensils,
  Snowflake,
  Car,
  WashingMachine,
  Dumbbell,
  Tv,
  ShieldCheck,
  Building2,
} from 'lucide-react'
import { Seo, breadcrumbSchema } from '@/components/seo'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useLazyListPublicListingsQuery,
  useLazyListPublicCitiesQuery,
  useLazyListCitiesWithSlugsQuery,
} from '@/services/publicListingsApi'
import type { PublicListing, PublicCity } from '@/services/publicListingsApi'
import { Link } from 'react-router-dom'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'featured', label: 'Featured' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'nearest', label: 'Nearest to Me' },
]

const DISTANCE_OPTIONS = [
  { value: '1', label: 'Within 1 km' },
  { value: '3', label: 'Within 3 km' },
  { value: '5', label: 'Within 5 km' },
  { value: '10', label: 'Within 10 km' },
  { value: '25', label: 'Within 25 km' },
  { value: '50', label: 'Within 50 km' },
]

const AMENITY_ICONS: Record<string, typeof Wifi> = {
  WiFi: Wifi,
  Food: Utensils,
  AC: Snowflake,
  Parking: Car,
  Laundry: WashingMachine,
  Gym: Dumbbell,
  TV: Tv,
}

export function PgDirectoryScreen() {
  const navigate = useNavigate()

  const [cityId, setCityId] = useState<string>('ALL')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [distanceRadius, setDistanceRadius] = useState('10')

  const [triggerListings, { data: listingsData, isFetching }] = useLazyListPublicListingsQuery()
  const [triggerCities, { data: cities }] = useLazyListPublicCitiesQuery()
  const [triggerCitiesWithSlugs, { data: citiesWithSlugs }] = useLazyListCitiesWithSlugsQuery()

  useEffect(() => {
    triggerCities()
    triggerCitiesWithSlugs()
  }, [triggerCities, triggerCitiesWithSlugs])

  const fetchListings = useCallback(() => {
    const params: any = { page, limit: 12, sort }
    if (cityId !== 'ALL') params.cityId = Number(cityId)
    if (userCoords) {
      params.lat = userCoords.lat
      params.lng = userCoords.lng
      params.radius = Number(distanceRadius)
      params.sort = 'nearest'
    }
    triggerListings(params)
  }, [cityId, sort, page, userCoords, distanceRadius, triggerListings])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  useEffect(() => {
    setPage(1)
  }, [cityId, sort, userCoords, distanceRadius])

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserCoords(coords)
        sessionStorage.setItem('pg_user_coords', JSON.stringify(coords))
        setLocating(false)
      },
      () => {
        alert('Could not get your location. Please allow location access.')
        setLocating(false)
      },
    )
  }

  const handleClearFilters = () => {
    setCityId('ALL')
    setSort('newest')
    setUserCoords(null)
    setDistanceRadius('10')
    setPage(1)
    sessionStorage.removeItem('pg_user_coords')
  }

  const listings: PublicListing[] = listingsData?.data ?? []
  const total = listingsData?.pagination?.total ?? 0
  const totalPages = listingsData?.pagination?.totalPages ?? 0
  const cityList: PublicCity[] = cities ?? []

  const hasActiveFilters = cityId !== 'ALL' || userCoords

  return (
    <>
    <Seo
      title='Find PG & Co-living Spaces in India'
      description='Search verified PG accommodations and co-living spaces across India. Filter by city, area, price, and amenities. AC, WiFi, food, parking and more. Find your perfect PG on IPGM.'
      keywords={['PG in India', 'co-living spaces', 'PG directory', 'find PG', 'paying guest accommodation', 'hostel booking', 'PG with food', 'PG with AC', 'PG near me']}
      canonical='/pg-directory'
      schema={[
        breadcrumbSchema([
          { name: 'Home', url: '/home' },
          { name: 'PG Directory', url: '/pg-directory' },
        ]),
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'PG Directory — Find PG & Co-living Spaces in India',
          url: 'https://www.indianpgmanagement.com/pg-directory',
          description: 'Search verified PG accommodations and co-living spaces across India.',
          isPartOf: {
            '@type': 'WebSite',
            name: 'IPGM — Indian PG Management System',
            url: 'https://www.indianpgmanagement.com',
          },
        },
      ]}
    />
    <div className='min-h-screen pb-20'>
      {/* ─── Compact Filter Bar (mobile-first) ─── */}
      <div className='border-b bg-white/90 backdrop-blur-sm sticky top-16 z-30'>
        <div className='mx-auto max-w-7xl px-3 py-2 sm:px-4 sm:py-3'>
          {/* Filter chips — scrollable on mobile */}
          <div className='flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'>
            {/* City */}
            <Select value={cityId} onValueChange={setCityId}>
              <SelectTrigger className='h-8 w-auto shrink-0 gap-1 rounded-full px-3 text-xs font-medium'>
                <MapPin className='size-3.5 text-muted-foreground' />
                <SelectValue placeholder='City' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL'>All Cities</SelectItem>
                {cityList.map((c) => (
                  <SelectItem key={c.s_no} value={String(c.s_no)}>
                    {c.name} ({c.pg_count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className='h-8 w-auto shrink-0 gap-1 rounded-full px-3 text-xs font-medium'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Near me */}
            <Button
              variant={userCoords ? 'default' : 'outline'}
              size='sm'
              className='h-8 shrink-0 rounded-full px-3 text-xs font-medium'
              onClick={handleUseMyLocation}
              disabled={locating}
            >
              {locating ? (
                <Loader2 className='size-3.5 animate-spin' />
              ) : (
                <Navigation className='size-3.5' />
              )}
              <span className='ml-1'>{userCoords ? 'Near Me' : 'Use Location'}</span>
            </Button>

            {/* Distance — only when location is on */}
            {userCoords && (
              <Select value={distanceRadius} onValueChange={setDistanceRadius}>
                <SelectTrigger className='h-8 w-auto shrink-0 gap-1 rounded-full px-3 text-xs font-medium'>
                  <Navigation className='size-3.5 text-muted-foreground' />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISTANCE_OPTIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Clear */}
            {hasActiveFilters && (
              <Button
                variant='ghost'
                size='sm'
                className='h-8 shrink-0 rounded-full px-3 text-xs font-medium text-muted-foreground'
                onClick={handleClearFilters}
              >
                <X className='size-3.5' />
                Clear
              </Button>
            )}

            {/* Result count — pushed right on desktop */}
            <span className='ml-auto hidden shrink-0 text-xs text-muted-foreground sm:inline'>
              {isFetching ? 'Searching...' : total > 0 && `${total} PG${total !== 1 ? 's' : ''}`}
            </span>
          </div>

          {/* Mobile result count */}
          <div className='mt-1.5 text-xs text-muted-foreground sm:hidden'>
            {isFetching ? 'Searching...' : total > 0 && `${total} PG${total !== 1 ? 's' : ''} found`}
          </div>
        </div>
      </div>

      {/* ─── Listings ─── */}
      <div className='mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6'>
        {isFetching ? (
          /* Skeleton loading */
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className='animate-pulse overflow-hidden rounded-xl border bg-white'>
                <div className='h-40 bg-slate-200 sm:h-48' />
                <div className='space-y-2 p-3 sm:p-4'>
                  <div className='h-4 w-3/4 rounded bg-slate-200' />
                  <div className='h-3 w-1/2 rounded bg-slate-200' />
                  <div className='flex gap-2'>
                    <div className='h-5 w-14 rounded-full bg-slate-200' />
                    <div className='h-5 w-14 rounded-full bg-slate-200' />
                  </div>
                  <div className='flex justify-between border-t pt-2'>
                    <div className='h-5 w-18 rounded bg-slate-200' />
                    <div className='h-5 w-14 rounded bg-slate-200' />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          /* Empty state */
          <div className='flex flex-col items-center justify-center py-16 text-center sm:py-24'>
            <div className='flex size-16 items-center justify-center rounded-full bg-slate-100 sm:size-20'>
              <Building2 className='size-8 text-slate-400 sm:size-10' />
            </div>
            <h3 className='mt-4 text-lg font-semibold sm:mt-6 sm:text-xl'>No PGs found</h3>
            <p className='mt-1.5 max-w-sm text-sm text-muted-foreground sm:mt-2'>
              Try adjusting your search filters, changing the city, or searching for a different area.
            </p>
            {hasActiveFilters && (
              <Button variant='outline' className='mt-4 sm:mt-6' onClick={handleClearFilters}>
                <X className='size-4' />
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Results grid */}
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5'>
              {listings.map((pg) => (
                <PgCard key={pg.s_no} pg={pg} onClick={() => navigate(`/pg-directory/${pg.s_no}`)} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='mt-6 flex items-center justify-center gap-1.5 sm:mt-10 sm:gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p} className='flex items-center gap-2'>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className='px-1 text-muted-foreground'>…</span>
                      )}
                      <Button
                        variant={p === page ? 'default' : 'outline'}
                        size='sm'
                        className='h-9 w-9 p-0'
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </Button>
                    </span>
                  ))}
                <Button
                  variant='outline'
                  size='sm'
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        {/* Browse by City — SEO internal links */}
        {citiesWithSlugs && citiesWithSlugs.length > 0 && (
          <div className='mt-8 rounded-2xl border bg-white p-4 sm:mt-12 sm:p-6'>
            <h2 className='text-base font-semibold sm:text-lg'>Browse PGs by City</h2>
            <p className='mt-1 text-xs text-muted-foreground sm:text-sm'>
              Find verified PG and co-living spaces in major cities across India
            </p>
            <div className='mt-3 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-2'>
              {citiesWithSlugs.map((c) => (
                <Link
                  key={c.s_no}
                  to={`/pg-in-${c.slug}`}
                  className='flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors hover:border-blue-300 hover:bg-blue-50 sm:px-3 sm:py-1.5 sm:text-sm'
                >
                  <MapPin className='size-3 text-muted-foreground sm:size-3.5' />
                  PG in {c.name}
                  <span className='text-[10px] text-muted-foreground sm:text-xs'>({c.pg_count})</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}

// ─── PG Card ───

function PgCard({ pg, onClick }: { pg: PublicListing; onClick: () => void }) {
  const images: string[] = (() => {
    if (!pg.images) return []
    if (Array.isArray(pg.images)) return pg.images
    try { return JSON.parse(pg.images as any) } catch { return [] }
  })()

  const amenities: string[] = (() => {
    if (!pg.listing_amenities) return []
    if (Array.isArray(pg.listing_amenities)) return pg.listing_amenities
    try { return JSON.parse(pg.listing_amenities as any) } catch { return [] }
  })()

  return (
    <Card
      className='group cursor-pointer overflow-hidden p-0 border-slate-200 transition-all duration-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100'
      onClick={onClick}
    >
      {/* Image */}
      <div className='relative h-40 overflow-hidden bg-slate-100 sm:h-48 lg:h-52'>
        {images.length > 0 ? (
          <img
            src={images[0]}
            alt={pg.location_name}
            className='size-full object-cover transition-transform duration-300 group-hover:scale-105'
            loading='lazy'
          />
        ) : (
          <div className='flex size-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200'>
            <Building2 className='size-12 text-slate-300 sm:size-14' />
          </div>
        )}

        {/* Gradient overlay */}
        <div className='absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent' />

        {/* Top badges */}
        <div className='absolute left-2 top-2 flex gap-1.5 sm:left-3 sm:top-3'>
          {pg.is_featured && (
            <span className='flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm sm:px-2.5 sm:py-1 sm:text-xs'>
              <Star className='size-2.5 fill-white sm:size-3' />
              Featured
            </span>
          )}
          <span className='rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-slate-700 shadow-sm backdrop-blur sm:px-2.5 sm:py-1 sm:text-xs'>
            {pg.pg_type === 'COLIVING' ? 'Co-living' : 'PG'}
          </span>
        </div>

        {/* Distance badge */}
        {pg.distance_km != null && Number(pg.distance_km) > 0 && (
          <div className='absolute right-2 top-2 sm:right-3 sm:top-3'>
            <span className='flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm sm:px-2.5 sm:py-1 sm:text-xs'>
              <Navigation className='size-2.5 sm:size-3' />
              {pg.distance_km} km
            </span>
          </div>
        )}

        {/* Bottom: available beds overlay */}
        {pg.available_beds > 0 && (
          <div className='absolute bottom-2 left-2 sm:bottom-3 sm:left-3'>
            <span className='flex items-center gap-1 rounded-full bg-emerald-500/95 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm backdrop-blur sm:px-2.5 sm:py-1 sm:text-xs'>
              <BedDouble className='size-2.5 sm:size-3' />
              {pg.available_beds} bed{pg.available_beds !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className='p-3 sm:p-4'>
        {/* Name + price */}
        <div className='flex items-start justify-between gap-2'>
          <h3 className='font-semibold text-sm leading-tight line-clamp-1 group-hover:text-blue-600 transition-colors sm:text-base'>
            {pg.location_name}
          </h3>
          {pg.starting_price !== null && (
            <div className='shrink-0 text-right'>
              <div className='flex items-center text-base font-bold text-slate-900 sm:text-lg'>
                <IndianRupee className='size-3.5 sm:size-4' />
                {pg.starting_price.toLocaleString('en-IN')}
              </div>
              <p className='-mt-0.5 text-[9px] text-muted-foreground sm:text-[10px]'>/month</p>
            </div>
          )}
        </div>

        {/* Address */}
        <p className='mt-1 flex items-start gap-1 text-xs text-muted-foreground line-clamp-1 sm:mt-1.5 sm:text-sm'>
          <MapPin className='mt-0.5 size-3 shrink-0 sm:size-3.5' />
          {pg.address || pg.city?.name || 'Address not available'}
          {pg.pincode && `, ${pg.pincode}`}
        </p>

        {/* Amenities */}
        {amenities.length > 0 && (
          <div className='mt-2 flex flex-wrap gap-1 sm:mt-3 sm:gap-1.5'>
            {amenities.slice(0, 3).map((a, i) => {
              const Icon = AMENITY_ICONS[a]
              return (
                <span key={i} className='flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 sm:px-2 sm:py-1 sm:text-xs'>
                  {Icon ? <Icon className='size-2.5 sm:size-3' /> : <ShieldCheck className='size-2.5 sm:size-3' />}
                  {a}
                </span>
              )
            })}
            {amenities.length > 3 && (
              <span className='rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 sm:px-2 sm:py-1 sm:text-xs'>
                +{amenities.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className='mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 sm:mt-3.5 sm:pt-3'>
          <span className='text-[10px] text-muted-foreground sm:text-xs'>
            {pg.available_beds > 0 ? (
              <span className='text-emerald-600 font-medium'>{pg.available_beds} of {pg.total_beds} beds</span>
            ) : pg.total_beds > 0 ? (
              <span className='text-slate-500'>Full</span>
            ) : (
              <span className='text-slate-500'>Contact</span>
            )}
          </span>
          <span className='flex items-center gap-0.5 text-xs font-medium text-blue-600 transition-colors group-hover:gap-1.5 sm:text-sm'>
            Details
            <ChevronRight className='size-3.5 sm:size-4' />
          </span>
        </div>
      </div>
    </Card>
  )
}
