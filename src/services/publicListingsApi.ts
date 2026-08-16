import { baseApi } from './baseApi'

// ─── Types ───

export interface PublicListing {
  s_no: number
  location_name: string
  address: string
  pincode: string | null
  pg_type: string
  images: string[] | null
  city: { s_no: number; name: string } | null
  state: { s_no: number; name: string } | null
  slug: string | null
  listing_description: string | null
  listing_amenities: string[] | null
  listing_contact_phone: string | null
  listing_contact_email: string | null
  latitude: number | null
  longitude: number | null
  is_featured: boolean
  seo_title: string | null
  seo_description: string | null
  view_count: number
  published_at: string | null
  starting_price: number | null
  available_beds: number
  total_beds: number
  distance_km: number | null
}

export interface PublicListingDetails extends PublicListing {
  rooms?: {
    s_no: number
    room_no: string | null
    images: string[] | null
    available_beds: number
    total_beds: number
    beds: {
      s_no: number
      bed_no: string
      bed_price: number
      images: string[] | null
      is_occupied: boolean
    }[]
  }[]
}

export interface PublicCity {
  s_no: number
  name: string
  pg_count: number
}

export interface PublicCityWithSlug extends PublicCity {
  slug: string
}

export interface PublicArea {
  name: string
  slug: string
  pg_count: number
  pincode?: string
}

export interface PublicSearchResult {
  s_no: number
  name: string
  address: string
  city: string | null
  slug: string | null
}

interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasMore: boolean
  }
}

interface ListListingsParams {
  city?: string
  cityId?: number
  state?: string
  area?: string
  pincode?: string
  pgType?: string
  minPrice?: number
  maxPrice?: number
  lat?: number
  lng?: number
  radius?: number
  sort?: 'nearest' | 'price_low' | 'price_high' | 'newest' | 'featured'
  page?: number
  limit?: number
}

// ─── API ───

export const publicListingsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // List PGs with filters
    listPublicListings: build.query<PaginatedResponse<PublicListing>, ListListingsParams>({
      query: (params) => {
        const searchParams = new URLSearchParams()
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value))
          }
        })
        return `/public/pg-listings?${searchParams.toString()}`
      },
      providesTags: [{ type: 'PublicListings' as any, id: 'LIST' }],
      transformResponse: (res: any) => (res?.data ?? res) as PaginatedResponse<PublicListing>,
    }),

    // Get PG details by ID
    getPublicListingById: build.query<
      PublicListingDetails,
      { id: number; lat?: number; lng?: number }
    >({
      query: ({ id, lat, lng }) => {
        const params = new URLSearchParams()
        if (lat != null) params.set('lat', String(lat))
        if (lng != null) params.set('lng', String(lng))
        const qs = params.toString()
        return `/public/pg-listings/${id}${qs ? `?${qs}` : ''}`
      },
      providesTags: (_result, _error, { id }) => [{ type: 'PublicListing' as any, id }],
      transformResponse: (res: any) => (res?.data ?? res) as PublicListingDetails,
    }),

    // Get PG by slug (SEO-friendly)
    getPublicListingBySlug: build.query<PublicListingDetails, string>({
      query: (slug) => `/public/pg-listings/slug/${slug}`,
      providesTags: (_result, _error, slug) => [{ type: 'PublicListing' as any, id: slug }],
      transformResponse: (res: any) => (res?.data ?? res) as PublicListingDetails,
    }),

    // List cities with published PGs
    listPublicCities: build.query<PublicCity[], void>({
      query: () => '/public/cities',
      providesTags: [{ type: 'PublicCities' as any, id: 'LIST' }],
      transformResponse: (res: any) => (res?.data ?? res) as PublicCity[],
    }),

    // List cities with URL slugs for location pages
    listCitiesWithSlugs: build.query<PublicCityWithSlug[], void>({
      query: () => '/public/cities-with-slugs',
      providesTags: [{ type: 'PublicCities' as any, id: 'SLUGS' }],
      transformResponse: (res: any) => (res?.data ?? res) as PublicCityWithSlug[],
    }),

    // List areas within a city
    listAreasByCity: build.query<PublicArea[], number>({
      query: (cityId) => `/public/areas/${cityId}`,
      providesTags: (_result, _error, cityId) => [{ type: 'PublicAreas' as any, id: cityId }],
      transformResponse: (res: any) => (res?.data ?? res) as PublicArea[],
    }),

    // Search PGs (autocomplete)
    searchPublicListings: build.query<PublicSearchResult[], { q: string; limit?: number }>({
      query: ({ q, limit }) => `/public/pg-listings/search?q=${encodeURIComponent(q)}&limit=${limit ?? 10}`,
      transformResponse: (res: any) => (res?.data ?? res) as PublicSearchResult[],
    }),
  }),
})

export const {
  useLazyListPublicListingsQuery,
  useLazyGetPublicListingByIdQuery,
  useLazyGetPublicListingBySlugQuery,
  useLazyListPublicCitiesQuery,
  useLazySearchPublicListingsQuery,
  useLazyListCitiesWithSlugsQuery,
  useLazyListAreasByCityQuery,
} = publicListingsApi
