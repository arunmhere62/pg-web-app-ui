import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Search,
  MapPin,
  Star,
  BedDouble,
  IndianRupee,
  ChevronRight,
  Loader2,
  Building2,
  Navigation,
  Wifi,
  Utensils,
  Snowflake,
  Car,
  WashingMachine,
  ShieldCheck,
} from 'lucide-react'
import { Seo, breadcrumbSchema } from '@/components/seo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  useLazyListCitiesWithSlugsQuery,
  useLazyListAreasByCityQuery,
} from '@/services/publicListingsApi'
import type { PublicListing, PublicCityWithSlug, PublicArea } from '@/services/publicListingsApi'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'featured', label: 'Featured' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
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
}

export function PgLocationScreen({
  citySlug,
  areaSlug,
}: {
  citySlug: string
  areaSlug?: string
}) {
  const navigate = useNavigate()

  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [distanceRadius, setDistanceRadius] = useState('10')

  const [triggerListings, { data: listingsData, isFetching }] = useLazyListPublicListingsQuery()
  const [triggerCities, { data: cities }] = useLazyListCitiesWithSlugsQuery()
  const [triggerAreas, { data: areas }] = useLazyListAreasByCityQuery()

  // Fetch cities on mount
  useEffect(() => {
    triggerCities()
  }, [triggerCities])

  // Find the current city from slug
  const currentCity: PublicCityWithSlug | undefined = cities?.find((c) => c.slug === citySlug)

  // Fetch areas when city is found
  useEffect(() => {
    if (currentCity) {
      triggerAreas(currentCity.s_no)
    }
  }, [currentCity, triggerAreas])

  // Find current area
  const currentArea: PublicArea | undefined = areas?.find((a) => a.slug === areaSlug)

  // Fetch listings filtered by city + area
  const fetchListings = useCallback(() => {
    if (!currentCity) return
    // If an area slug is present but areas haven't loaded yet, wait
    if (areaSlug && !areas) return
    const params: any = { page, limit: 12 }
    params.cityId = currentCity.s_no
    if (currentArea) {
      params.area = currentArea.name
      params.sort = sort === 'newest' ? 'nearest' : sort
    } else {
      params.sort = sort
    }
    // If user has shared their location, send it so backend can compute distance
    if (userCoords) {
      params.lat = userCoords.lat
      params.lng = userCoords.lng
      if (!currentArea) {
        // City page: use the user-selected distance radius
        params.radius = Number(distanceRadius)
        params.sort = 'nearest'
      }
    }
    triggerListings(params)
  }, [currentCity, currentArea, areas, areaSlug, sort, page, searchQuery, userCoords, distanceRadius, triggerListings])

  // Restore saved user location from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('pg_user_coords')
    if (saved) {
      try { setUserCoords(JSON.parse(saved)) } catch { /* ignore */ }
    }
  }, [])

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

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  useEffect(() => {
    setPage(1)
  }, [citySlug, areaSlug, sort, userCoords, distanceRadius])

  const listings: PublicListing[] = listingsData?.data ?? []
  const total = listingsData?.pagination?.total ?? 0
  const totalPages = listingsData?.pagination?.totalPages ?? 0

  if (!cities) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Loader2 className='size-8 animate-spin text-muted-foreground' />
      </div>
    )
  }

  if (cities.length > 0 && !currentCity) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center px-4 text-center'>
        <Building2 className='size-16 text-muted-foreground/40' />
        <h1 className='mt-6 text-2xl font-bold'>City not found</h1>
        <p className='mt-2 text-muted-foreground'>
          We couldn't find PGs in this city. Explore our directory instead.
        </p>
        <Button asChild className='mt-6'>
          <Link to='/pg-directory'>Browse All PGs</Link>
        </Button>
      </div>
    )
  }

  const cityName = currentCity?.name || ''
  const areaName = currentArea?.name || ''
  const locationLabel = areaName ? `${areaName}, ${cityName}` : cityName

  // SEO content
  const seoTitle = areaName
    ? `PG in ${areaName}, ${cityName} — Best Co-living & PG Spaces | IPGM`
    : `PG in ${cityName} — Verified PG & Co-living Spaces | IPGM`

  const seoDescription = areaName
    ? `Find verified PG accommodations and co-living spaces in ${areaName}, ${cityName}. AC rooms, WiFi, food, parking available. Starting from affordable prices. Book your PG in ${areaName} on IPGM.`
    : `Search ${total}+ verified PG and co-living spaces in ${cityName}. AC rooms, WiFi, food, parking and more. Find your perfect PG in ${cityName} on IPGM — Indian PG Management.`

  const seoKeywords = areaName
    ? [`PG in ${areaName}`, `PG in ${areaName} ${cityName}`, `co-living ${areaName}`, `${areaName} PG`, `paying guest ${areaName}`, `hostel in ${areaName}`, `PG near ${areaName}`, `rooms for rent ${areaName}`]
    : [`PG in ${cityName}`, `co-living ${cityName}`, `${cityName} PG`, `paying guest ${cityName}`, `hostel in ${cityName}`, `PG near me ${cityName}`, `rooms for rent ${cityName}`, `best PG ${cityName}`]

  const canonicalPath = areaName ? `/pg-in-${citySlug}/${areaSlug}` : `/pg-in-${citySlug}`

  return (
    <>
      <Seo
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonical={canonicalPath}
        schema={[
          breadcrumbSchema([
            { name: 'Home', url: '/home' },
            { name: 'PG Directory', url: '/pg-directory' },
            { name: `PG in ${cityName}`, url: `/pg-in-${citySlug}` },
            ...(areaName ? [{ name: `PG in ${areaName}`, url: `/pg-in-${citySlug}/${areaSlug}` }] : []),
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: seoTitle,
            url: `https://www.indianpgmanagement.com${canonicalPath}`,
            description: seoDescription,
            isPartOf: {
              '@type': 'WebSite',
              name: 'IPGM — Indian PG Management System',
              url: 'https://www.indianpgmanagement.com',
            },
            about: {
              '@type': 'Place',
              name: areaName ? `${areaName}, ${cityName}` : cityName,
              address: {
                '@type': 'PostalAddress',
                addressLocality: areaName || cityName,
                addressRegion: cityName,
              },
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: `How to find a PG in ${locationLabel}?`,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: `Browse verified PG listings in ${locationLabel} on IPGM. Filter by price, amenities, and availability. Contact the PG owner directly or book online through our platform.`,
                },
              },
              {
                '@type': 'Question',
                name: `What is the average cost of a PG in ${locationLabel}?`,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: `PG prices in ${locationLabel} vary based on room type (shared/single), amenities (AC, WiFi, food), and location. Use our price filter to find PGs within your budget.`,
                },
              },
              {
                '@type': 'Question',
                name: `Do PGs in ${locationLabel} provide food and WiFi?`,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: `Many PGs in ${locationLabel} offer complimentary WiFi and food. Check the amenities listed on each PG detail page to confirm what's included.`,
                },
              },
            ],
          },
        ]}
      />

      <div className='min-h-screen'>
        {/* ─── Location Header ─── */}
        <div className='border-b bg-gradient-to-br from-blue-50 to-indigo-50'>
          <div className='mx-auto max-w-7xl px-4 py-8'>
            {/* Breadcrumbs */}
            <nav className='mb-4 flex items-center gap-1.5 text-sm text-muted-foreground'>
              <Link to='/home' className='hover:text-foreground'>Home</Link>
              <ChevronRight className='size-3' />
              <Link to='/pg-directory' className='hover:text-foreground'>PG Directory</Link>
              <ChevronRight className='size-3' />
              <Link to={`/pg-in-${citySlug}`} className='hover:text-foreground'>{cityName}</Link>
              {areaName && (
                <>
                  <ChevronRight className='size-3' />
                  <span className='text-foreground'>{areaName}</span>
                </>
              )}
            </nav>

            <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>
              {areaName ? `PG in ${areaName}, ${cityName}` : `PG in ${cityName}`}
            </h1>
            <p className='mt-2 max-w-2xl text-muted-foreground'>
              {total > 0
                ? `${total} verified ${total === 1 ? 'PG is' : 'PGs are'} available in ${locationLabel}. Find AC rooms, WiFi, food, parking and more.`
                : `Find verified PG accommodations and co-living spaces in ${locationLabel}. Browse listings with photos, prices, and amenities.`}
            </p>

            {/* Search + sort bar */}
            <div className='mt-6 flex flex-col gap-2 sm:flex-row sm:items-center'>
              <div className='relative flex-1'>
                <Search className='pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground' />
                <Input
                  placeholder={`Search by area or PG name in ${cityName}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchListings()}
                  className='h-10 pl-9 bg-white'
                />
              </div>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className='h-10 w-full sm:w-48 bg-white'>
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
              <Button onClick={fetchListings} className='h-10 shrink-0'>
                <Search className='size-4' />
                Search
              </Button>
              <Button
                onClick={handleUseMyLocation}
                variant={userCoords ? 'default' : 'outline'}
                className='h-10 shrink-0'
                disabled={locating}
              >
                {locating ? (
                  <Loader2 className='size-4 animate-spin' />
                ) : (
                  <Navigation className='size-4' />
                )}
                {userCoords ? 'Location on' : 'Near me'}
              </Button>
              {userCoords && !areaSlug && (
                <Select value={distanceRadius} onValueChange={setDistanceRadius}>
                  <SelectTrigger className='h-10 w-[140px] shrink-0 bg-white'>
                    <Navigation className='mr-1.5 size-4 text-muted-foreground' />
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
            </div>
          </div>
        </div>

        <div className='mx-auto max-w-7xl px-4 py-6'>
          {/* Popular areas in this city */}
          {areas && areas.length > 0 && !areaName && (
            <div className='mb-6'>
              <h2 className='mb-3 text-lg font-semibold'>Popular Areas in {cityName}</h2>
              <div className='flex flex-wrap gap-2'>
                {areas.slice(0, 15).map((a) => (
                  <Link
                    key={a.slug}
                    to={`/pg-in-${citySlug}/${a.slug}`}
                    className='flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-sm transition-colors hover:border-blue-300 hover:bg-blue-50'
                  >
                    <MapPin className='size-3.5 text-muted-foreground' />
                    {a.name}
                    <span className='text-xs text-muted-foreground'>({a.pg_count})</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Other cities */}
          {cities && cities.length > 1 && (
            <div className='mb-6'>
              <h2 className='mb-3 text-lg font-semibold'>PGs in Other Cities</h2>
              <div className='flex flex-wrap gap-2'>
                {cities.filter((c) => c.slug !== citySlug).map((c) => (
                  <Link
                    key={c.s_no}
                    to={`/pg-in-${c.slug}`}
                    className='flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-sm transition-colors hover:border-blue-300 hover:bg-blue-50'
                  >
                    <MapPin className='size-3.5 text-muted-foreground' />
                    {c.name}
                    <span className='text-xs text-muted-foreground'>({c.pg_count})</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Listings */}
          {isFetching ? (
            <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className='animate-pulse overflow-hidden rounded-xl border bg-white'>
                  <div className='h-52 bg-slate-200' />
                  <div className='space-y-3 p-4'>
                    <div className='h-5 w-3/4 rounded bg-slate-200' />
                    <div className='h-4 w-1/2 rounded bg-slate-200' />
                    <div className='h-6 w-20 rounded bg-slate-200' />
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-24 text-center'>
              <div className='flex size-20 items-center justify-center rounded-full bg-slate-100'>
                <Building2 className='size-10 text-slate-400' />
              </div>
              <h3 className='mt-6 text-xl font-semibold'>No PGs found in {locationLabel}</h3>
              <p className='mt-2 max-w-sm text-sm text-muted-foreground'>
                Try a different search or browse PGs in other areas of {cityName}.
              </p>
              <Button asChild variant='outline' className='mt-6'>
                <Link to={`/pg-in-${citySlug}`}>View all PGs in {cityName}</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
                {listings.map((pg) => (
                  <PgCard key={pg.s_no} pg={pg} onClick={() => navigate(`/pg-directory/${pg.s_no}`)} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className='mt-10 flex items-center justify-center gap-2'>
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

          {/* SEO Content Section */}
          <div className='mt-12 rounded-2xl border bg-white p-6 sm:p-8'>
            <h2 className='text-xl font-bold'>
              {areaName ? `About PGs in ${areaName}, ${cityName}` : `About PGs in ${cityName}`}
            </h2>
            <div className='mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground'>
              <p>
                {areaName
                  ? `${areaName} is one of the popular residential areas in ${cityName}, well-connected to IT hubs, educational institutions, and commercial centers. If you're looking for a PG in ${areaName}, ${cityName}, IPGM offers ${total}+ verified PG accommodations with modern amenities.`
                  : `${cityName} is a major city with a growing demand for quality PG accommodations. IPGM lists ${total}+ verified PGs and co-living spaces across ${cityName}, making it easy to find the right place to stay.`}
              </p>
              <p>
                Our PGs in {locationLabel} come with a range of amenities including:
              </p>
              <ul className='ml-4 list-disc space-y-1'>
                <li><strong>AC and Non-AC rooms</strong> — choose based on your budget and comfort</li>
                <li><strong>High-speed WiFi</strong> — ideal for remote workers and students</li>
                <li><strong>Food included</strong> — home-style meals available at many PGs</li>
                <li><strong>Parking</strong> — two-wheeler and four-wheeler parking facilities</li>
                <li><strong>24/7 security</strong> — CCTV monitoring and secure access</li>
                <li><strong>Housekeeping & laundry</strong> — regular cleaning and laundry services</li>
              </ul>
              <p>
                Use our filters to find PGs by price range, amenities, and availability. Each listing includes real photos, room details, bed availability, and direct contact information. Book your PG in {locationLabel} with confidence through IPGM.
              </p>
            </div>

            {/* FAQ Section */}
            <div className='mt-8'>
              <h3 className='text-lg font-semibold'>Frequently Asked Questions</h3>
              <div className='mt-4 space-y-4'>
                <FaqItem
                  question={`How to find the best PG in ${locationLabel}?`}
                  answer={`Browse verified PG listings on IPGM, filter by your budget and preferred amenities, check real photos and reviews, and contact the PG owner directly. You can also compare prices and availability across multiple PGs in ${locationLabel}.`}
                />
                <FaqItem
                  question={`What is the rent for a PG in ${locationLabel}?`}
                  answer={`PG rent in ${locationLabel} depends on room type (shared/single/deluxe), amenities (AC, food, WiFi), and location. Use our price filter to find PGs within your budget. Prices typically include rent, but some amenities may have additional charges.`}
                />
                <FaqItem
                  question={`Do PGs in ${locationLabel} provide food?`}
                  answer={`Many PGs in ${locationLabel} offer complimentary meals (breakfast, lunch, dinner) or have food options available. Check the amenities section of each listing to see if food is included.`}
                />
                <FaqItem
                  question={`Is it safe to stay in a PG in ${locationLabel}?`}
                  answer={`All PGs listed on IPGM are verified with active status. Look for PGs with 24/7 security, CCTV cameras, and secure access. You can also check the availability of female-only PGs if that's a requirement.`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── FAQ Item ───
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className='border-b'>
      <button
        className='flex w-full items-center justify-between py-3 text-left text-sm font-medium'
        onClick={() => setOpen(!open)}
      >
        {question}
        <ChevronRight className={`size-4 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && <p className='pb-3 text-sm text-muted-foreground'>{answer}</p>}
    </div>
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
      <div className='relative h-52 overflow-hidden bg-slate-100'>
        {images.length > 0 ? (
          <img
            src={images[0]}
            alt={pg.location_name}
            className='size-full object-cover transition-transform duration-300 group-hover:scale-105'
            loading='lazy'
          />
        ) : (
          <div className='flex size-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200'>
            <Building2 className='size-14 text-slate-300' />
          </div>
        )}
        <div className='absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent' />
        <div className='absolute left-3 top-3 flex gap-1.5'>
          {pg.is_featured && (
            <span className='flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm'>
              <Star className='size-3 fill-white' />
              Featured
            </span>
          )}
          <span className='rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm backdrop-blur'>
            {pg.pg_type === 'COLIVING' ? 'Co-living' : 'PG'}
          </span>
        </div>
        {pg.available_beds > 0 && (
          <div className='absolute bottom-3 left-3'>
            <span className='flex items-center gap-1 rounded-full bg-emerald-500/95 px-2.5 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur'>
              <BedDouble className='size-3' />
              {pg.available_beds} bed{pg.available_beds !== 1 ? 's' : ''} available
            </span>
          </div>
        )}
      </div>

      <div className='p-4'>
        <div className='flex items-start justify-between gap-2'>
          <h3 className='font-semibold text-base leading-tight line-clamp-1 group-hover:text-blue-600 transition-colors'>
            {pg.location_name}
          </h3>
          {pg.starting_price !== null && (
            <div className='shrink-0 text-right'>
              <div className='flex items-center text-lg font-bold text-slate-900'>
                <IndianRupee className='size-4' />
                {pg.starting_price.toLocaleString('en-IN')}
              </div>
              <p className='-mt-0.5 text-[10px] text-muted-foreground'>/month</p>
            </div>
          )}
        </div>

        <p className='mt-1.5 flex items-start gap-1 text-sm text-muted-foreground line-clamp-1'>
          <MapPin className='mt-0.5 size-3.5 shrink-0' />
          {pg.address || pg.city?.name || 'Address not available'}
        </p>

        {pg.distance_km != null && (
          <div className='mt-2'>
            <span className='inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700'>
              <Navigation className='size-3' />
              {pg.distance_km} km away
            </span>
          </div>
        )}

        {amenities.length > 0 && (
          <div className='mt-3 flex flex-wrap gap-1.5'>
            {amenities.slice(0, 4).map((a, i) => {
              const Icon = AMENITY_ICONS[a]
              return (
                <span key={i} className='flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600'>
                  {Icon ? <Icon className='size-3' /> : <ShieldCheck className='size-3' />}
                  {a}
                </span>
              )
            })}
            {amenities.length > 4 && (
              <span className='rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500'>
                +{amenities.length - 4} more
              </span>
            )}
          </div>
        )}

        <div className='mt-3.5 flex items-center justify-between border-t border-slate-100 pt-3'>
          <span className='text-xs text-muted-foreground'>
            {pg.available_beds > 0 ? (
              <span className='font-medium text-emerald-600'>{pg.available_beds} of {pg.total_beds} beds available</span>
            ) : pg.total_beds > 0 ? (
              <span className='text-slate-500'>Fully occupied</span>
            ) : (
              <span className='text-slate-500'>Contact for availability</span>
            )}
          </span>
          <span className='flex items-center gap-0.5 text-sm font-medium text-blue-600 transition-colors group-hover:gap-1.5'>
            View Details
            <ChevronRight className='size-4' />
          </span>
        </div>
      </div>
    </Card>
  )
}
