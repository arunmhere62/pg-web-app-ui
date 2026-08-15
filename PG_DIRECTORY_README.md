# PG Directory — Public Listing Feature

A public-facing PG directory where anyone (no login required) can search and browse PGs by city, area, pincode, or "near me" (GPS). This drives organic SEO traffic and helps PG owners get more tenants.

---

## How It Works (Overview)

```
                    ┌─────────────────────────┐
                    │   Someone needs a PG     │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Where do they search?  │
                    └────────────┬────────────┘
                         ┌───────┴───────┐
                         │               │
                ┌────────▼──────┐ ┌──────▼──────────┐
                │  Google Search │ │  Direct visit   │
                │  (free SEO)    │ │  yourwebsite.com│
                │  "PG in Bangalore"  │ │  /pg-directory   │
                └────────┬──────┘ └──────┬──────────┘
                         │               │
                         └───────┬───────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Public PG Directory     │
                    │  (IPMS-web-ui)           │
                    │                          │
                    │  • Search by city/area   │
                    │  • Filter by price/type  │
                    │  • "Near me" (GPS)       │
                    │  • View PG details       │
                    │  • Contact PG owner      │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Public API (no auth)    │
                    │  (IPMS-mob-api)          │
                    │                          │
                    │  GET /api/v1/public/     │
                    │    pg-listings           │
                    │    pg-listings/:id       │
                    │    cities                │
                    │    pg-listings/search    │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Consumer DB (ipmsdb_v1) │
                    │                          │
                    │  pg_locations            │
                    │  ├── rooms               │
                    │  ├── beds (pricing)      │
                    │  ├── city                │
                    │  ├── state               │
                    │  └── organization        │
                    └─────────────────────────┘
```

---

## Architecture

### Projects Involved

| Project | Role | Changes Needed |
|---------|------|----------------|
| **IPMS-mob-api** | Public API (no auth) | New `public-listing` module with controllers + service |
| **IPMS-web-ui** | Public listing pages | New `PgDirectoryScreen`, `PgDetailsScreen`, SEO meta tags |
| **ipmsdb_v1** (consumer DB) | Data source | Add `latitude`/`longitude` columns to `pg_locations` |

### Why IPMS-mob-api for the public API?

- Already connects to `ipmsdb_v1` (consumer database) where PG data lives
- Already has `pg-location` module with Prisma queries
- Already has CORS enabled for all origins
- API prefix is `/api/v1` — public endpoints will be `/api/v1/public/*`
- No need for a separate API service

### Why IPMS-web-ui for the listing pages?

- Already has `PublicLayout` with header + footer (no sidebar, no auth)
- Already has public routes (`/home`, `/about`, `/contact`, etc.)
- Already connects to IPMS-mob-api via `baseApi.ts`
- Uses React + Tailwind + RTK Query (same stack as admin panel)

---

## Database Changes

### Step 1: Add latitude/longitude to pg_locations

```sql
ALTER TABLE pg_locations
  ADD COLUMN latitude DECIMAL(10,7) NULL AFTER pincode,
  ADD COLUMN longitude DECIMAL(10,7) NULL AFTER latitude,
  ADD COLUMN listing_published BOOLEAN DEFAULT FALSE AFTER pg_type,
  ADD INDEX idx_pg_listing (listing_published, status, is_deleted);
```

- `latitude` / `longitude` — for "near me" GPS search (Haversine formula)
- `listing_published` — PG owner opts in to public listing (default FALSE, privacy-first)
- Index on `(listing_published, status, is_deleted)` for fast listing queries

### Step 2: Extract coordinates from existing google_maps_url

Many PGs already have a `google_maps_url` in CRM contacts. A one-time script extracts coordinates:

```sql
-- Example: google_maps_url = "https://maps.google.com/?q=12.9716,77.5946"
-- Extract lat/lng from the URL and store in pg_locations
UPDATE pg_locations pg
JOIN admin_db_v1.crm_contacts c ON c.pg_name = pg.location_name
SET pg.latitude = SUBSTRING_INDEX(SUBSTRING_INDEX(c.google_maps_url, ',', 1), '=', -1),
    pg.longitude = SUBSTRING_INDEX(c.google_maps_url, ',', -1)
WHERE c.google_maps_url LIKE '%q=%,%'
  AND pg.latitude IS NULL;
```

### Step 3: Add listing metadata columns (optional, for richer listings)

```sql
ALTER TABLE pg_locations
  ADD COLUMN listing_description TEXT NULL AFTER listing_published,
  ADD COLUMN listing_amenities JSON NULL AFTER listing_description,
  ADD COLUMN listing_contact_phone VARCHAR(20) NULL AFTER listing_amenities,
  ADD COLUMN listing_contact_email VARCHAR(100) NULL AFTER listing_contact_phone;
```

---

## API Endpoints (IPMS-mob-api)

All endpoints are under `/api/v1/public/*` and require **NO authentication**.

### 1. List PGs with filters

```
GET /api/v1/public/pg-listings
```

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `city` | string | Filter by city name (e.g., "Bangalore") |
| `cityId` | number | Filter by city ID |
| `state` | string | Filter by state name |
| `area` | string | Filter by area/address (partial match) |
| `pincode` | string | Filter by pincode (exact or prefix match) |
| `pgType` | string | `COLIVING` or `PG` |
| `minPrice` | number | Minimum bed price |
| `maxPrice` | number | Maximum bed price |
| `lat` | number | User latitude (for "near me") |
| `lng` | number | User longitude (for "near me") |
| `radius` | number | Search radius in km (default: 5) |
| `sort` | string | `nearest`, `price_low`, `price_high`, `newest` |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20, max: 50) |

**Response:**

```json
{
  "success": true,
  "message": "PG listings fetched successfully",
  "data": {
    "items": [
      {
        "s_no": 1,
        "location_name": "Sunrise Co-living",
        "address": "5th Cross, Koramangala",
        "pincode": "560034",
        "pg_type": "COLIVING",
        "images": ["https://s3.../img1.jpg"],
        "city": { "name": "Bangalore" },
        "state": { "name": "Karnataka" },
        "latitude": "12.9715986",
        "longitude": "77.5945620",
        "distance_km": 2.3,
        "starting_price": 8000,
        "available_beds": 5,
        "total_beds": 20,
        "listing_description": "Premium co-living with AC, WiFi, food included"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

### 2. Get PG details

```
GET /api/v1/public/pg-listings/:id
```

**Response:** Full PG details including rooms, beds with prices, images, amenities.

### 3. List cities with available PGs

```
GET /api/v1/public/cities
```

Returns cities that have at least one published PG listing — used to populate the city dropdown.

### 4. Search PGs (autocomplete)

```
GET /api/v1/public/pg-listings/search?q=sun
```

Returns PG names matching the query — for search autocomplete.

---

## Frontend Pages (IPMS-web-ui)

### Route Structure

```
/pg-directory                    → PgDirectoryScreen (listing page with search + filters)
/pg-directory/:id                → PgDetailsScreen (single PG details)
/pg-directory/city/:city         → PgDirectoryScreen filtered by city (SEO-friendly URL)
/pg-directory/city/:city/:area   → PgDirectoryScreen filtered by city + area
```

### Page 1: PgDirectoryScreen (Listing Page)

```
┌──────────────────────────────────────────────────────────┐
│  [Logo]  Find Your PG          [Owner Login] [Tenant]    │ ← Public Header
├──────────────────────────────────────────────────────────┤
│                                                          │
│     Find PGs Near You                                    │
│     150+ verified PGs across India                       │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │ [📍 Use My Location]                             │    │
│  │ OR                                               │    │
│  │ City: [Bangalore    ▼]  Area: [Koramangala  ▼]   │    │
│  │ Pincode: [560034       ]                         │    │
│  │ [Search PGs]                                     │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  Filters:                                                │
│  Type: [All] [Co-living] [PG]                            │
│  Price: ₹[0] ─────●───── ₹[20000]                       │
│  Sort:  [Nearest] [Price: Low→High] [Newest]            │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ [PG Image]  │  │ [PG Image]  │  │ [PG Image]  │      │
│  │             │  │             │  │             │      │
│  │ Sunrise PG  │  │ Green Valley│  │ City Nest   │      │
│  │ Koramangala │  │ Indiranagar │  │ BTM Layout  │      │
│  │ ₹8,000/mo   │  │ ₹12,000/mo  │  │ ₹6,500/mo   │      │
│  │ 5 beds avail│  │ 2 beds avail│  │ 8 beds avail│      │
│  │ [View Details│  │ [View Details│  │ [View Details│   │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
│                                                          │
│  ← 1  2  3  →  (pagination)                              │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  [Footer]                                                │
└──────────────────────────────────────────────────────────┘
```

### Page 2: PgDetailsScreen (Details Page)

```
┌──────────────────────────────────────────────────────────┐
│  ← Back to Directory                                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  [Image Gallery: main photo + thumbnails]                │
│                                                          │
│  Sunrise Co-living                                       │
│  5th Cross, Koramangala, Bangalore - 560034              │
│  📍 Co-living  |  ★ 4.5  |  5 beds available             │
│                                                          │
│  ┌────────────┐  ┌──────────────────────────────────┐    │
│  │ Contact    │  │ Description                      │    │
│  │ 📞 +91...  │  │ Premium co-living space with     │    │
│  │ ✉️ email   │  │ AC, WiFi, daily housekeeping,    │    │
│  │ [WhatsApp] │  │ and food included.               │    │
│  └────────────┘  └──────────────────────────────────┘    │
│                                                          │
│  Amenities: AC | WiFi | Food | Parking | Laundry | CCTV  │
│                                                          │
│  Available Rooms:                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│  │ Room 101 │ │ Room 102 │ │ Room 103 │                 │
│  │ Single   │ │ Double   │ │ Single   │                 │
│  │ ₹8,000   │ │ ₹6,500   │ │ ₹8,500   │                 │
│  │ 2 beds   │ │ 4 beds   │ │ 1 bed    │                 │
│  └──────────┘ └──────────┘ └──────────┘                 │
│                                                          │
│  📍 Location on Map (embedded Google Maps link)          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## SEO Implementation

### Meta Tags (per page)

Each listing page includes dynamic meta tags:

```html
<title>PGs in Koramangala, Bangalore - 15 Available | Indian PG Management</title>
<meta name="description" content="Find verified PGs and co-living spaces in Koramangala, Bangalore. Starting from ₹8,000/month. AC, WiFi, food included. Contact directly." />
<meta name="keywords" content="PG in Koramangala, PG in Bangalore, co-living Bangalore, hostel Koramangala" />

<!-- Open Graph (for WhatsApp/social sharing) -->
<meta property="og:title" content="Sunrise Co-living PG, Koramangala" />
<meta property="og:description" content="Premium co-living from ₹8,000/month. AC, WiFi, food included." />
<meta property="og:image" content="https://s3.../pg1.jpg" />
<meta property="og:url" content="https://yourwebsite.com/pg-directory/1" />

<!-- Canonical URL -->
<link rel="canonical" href="https://yourwebsite.com/pg-directory/city/bangalore/koramangala" />
```

### Schema.org Structured Data (JSON-LD)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LodgingBusiness",
  "name": "Sunrise Co-living",
  "description": "Premium co-living space with AC, WiFi, food included",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "5th Cross, Koramangala",
    "addressLocality": "Bangalore",
    "addressRegion": "Karnataka",
    "postalCode": "560034",
    "addressCountry": "IN"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 12.9716,
    "longitude": 77.5946
  },
  "image": ["https://s3.../pg1.jpg"],
  "priceRange": "₹8000 - ₹15000",
  "telephone": "+919876543210",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": "12"
  }
}
</script>
```

### Sitemap (for Google indexing)

```
yourwebsite.com/sitemap.xml

  /pg-directory
  /pg-directory/city/bangalore
  /pg-directory/city/bangalore/koramangala
  /pg-directory/city/bangalore/indiranagar
  /pg-directory/city/chennai
  /pg-directory/1  (Sunrise Co-living)
  /pg-directory/2  (Green Valley PG)
  ...
```

---

## "Near Me" — How GPS Search Works (No Google API)

### Step 1: Browser gives GPS coordinates (free, built-in)

```javascript
// This is a built-in browser API — no Google Maps API needed
navigator.geolocation.getCurrentPosition(
  (position) => {
    const lat = position.coords.latitude   // 12.9716
    const lng = position.coords.longitude  // 77.5946
    // Send to API: GET /public/pg-listings?lat=12.9716&lng=77.5946&radius=5
  },
  (error) => {
    // User denied location — fall back to city dropdown
  }
)
```

### Step 2: API calculates distance using Haversine formula (pure math)

```sql
-- In the API service, we calculate distance in SQL:
SELECT *,
  (6371 * acos(
    cos(radians(:userLat)) *
    cos(radians(latitude)) *
    cos(radians(longitude) - radians(:userLng)) +
    sin(radians(:userLat)) *
    sin(radians(latitude))
  )) AS distance_km
FROM pg_locations
WHERE listing_published = true
  AND status = 'ACTIVE'
  AND is_deleted = false
  AND latitude IS NOT NULL
  AND longitude IS NOT NULL
HAVING distance_km < :radius
ORDER BY distance_km
LIMIT 20;
```

**No Google Maps API.** The Haversine formula is pure math that calculates the distance between two GPS points on a sphere.

---

## Privacy & Opt-In

PG owners must **explicitly opt in** to be listed publicly. This is controlled by the `listing_published` flag:

```
pg_locations.listing_published = FALSE  → NOT shown in public directory
pg_locations.listing_published = TRUE   → shown in public directory
```

### Where PG owners opt in:

- **IPMS-web-ui** (PG owner portal): Settings page → "Publish my PG in public directory" toggle
- **IPMS-mob** (mobile app): PG settings → "List publicly" toggle
- **IPMS-ADMIN-web** (admin panel): Admin can bulk-publish/unpublish PGs

### What data is shown publicly vs hidden:

| Field | Public? | Notes |
|-------|---------|-------|
| PG name | ✅ | `location_name` |
| Address | ✅ | `address` (street + area) |
| City/State | ✅ | From `city` / `state` relations |
| Pincode | ✅ | `pincode` |
| Photos | ✅ | `images` |
| PG type | ✅ | `pg_type` (COLIVING / PG) |
| Starting price | ✅ | Min `bed_price` from beds |
| Available beds | ✅ | Count of unallocated beds |
| Description | ✅ | `listing_description` |
| Amenities | ✅ | `listing_amenities` |
| Owner phone | ❌ | Only shown if `listing_contact_phone` is set |
| Owner email | ❌ | Only shown if `listing_contact_email` is set |
| Organization details | ❌ | Never shown |
| Tenant data | ❌ | Never shown |
| Financial data | ❌ | Never shown |

---

## Implementation Steps (In Order)

### Phase 1: Database + API (Backend)

1. **Add columns to `pg_locations`** — `latitude`, `longitude`, `listing_published`, listing metadata
2. **Run Prisma pull** in IPMS-mob-api to update schema
3. **Create `public-listing` module** in IPMS-mob-api:
   - `public-listing.module.ts`
   - `public-listing.controller.ts` — 4 endpoints (no auth guard)
   - `public-listing.service.ts` — queries with filters, Haversine, pagination
4. **Register module** in `app.module.ts`
5. **Test endpoints** with Swagger

### Phase 2: Frontend Listing Pages (IPMS-web-ui)

6. **Create `publicListingsApi.ts`** — RTK Query endpoints for public API
7. **Create `PgDirectoryScreen.tsx`** — search bar, filters, PG cards, pagination
8. **Create `PgDetailsScreen.tsx`** — image gallery, rooms, contact, map embed
9. **Add routes** in `app-routes.tsx` under `PublicLayout`
10. **Add "PG Directory" link** in public header navigation

### Phase 3: SEO Optimization

11. **Add react-helmet** for dynamic meta tags per page
12. **Add Schema.org JSON-LD** structured data to listing pages
13. **Create `sitemap.xml`** route that lists all published PGs
14. **Add `robots.txt`** to allow Google indexing
15. **Add Open Graph tags** for WhatsApp/social sharing

### Phase 4: "Near Me" GPS Feature

16. **Add "Use My Location" button** in PgDirectoryScreen
17. **Handle GPS permission denied** — fall back to city dropdown
18. **Show distance** on each PG card ("2.3 km away")
19. **Sort by distance** by default when GPS is used

### Phase 5: PG Owner Opt-In

20. **Add "Publish in Directory" toggle** in IPMS-web-ui PG settings
21. **Add API endpoint** in IPMS-mob-api for PG owner to toggle `listing_published`
22. **Add admin bulk-publish** in IPMS-ADMIN-web (optional)

### Phase 6: Performance & Scale

23. **Add Redis cache** for listing results (5-minute TTL)
24. **Add database indexes** on `(city_id, listing_published, status)`
25. **Add image CDN** (CloudFront/Cloudflare) for faster image loading
26. **Add Elasticsearch** for full-text search (when PGs > 10,000)
27. **Add server-side rendering** (Next.js or SSR) for better SEO

---

## File Structure (What Will Be Created)

### IPMS-mob-api (Backend)

```
src/modules/public-listing/
├── public-listing.module.ts          → NestJS module
├── public-listing.controller.ts      → 4 public endpoints (no auth)
├── public-listing.service.ts         → Query logic, Haversine, pagination
└── dto/
    ├── search-listings.dto.ts        → Query params validation
    └── listing-response.dto.ts       → Response shape
```

### IPMS-web-ui (Frontend)

```
src/
├── services/
│   └── publicListingsApi.ts          → RTK Query endpoints
├── screens/
│   └── public/
│       ├── PgDirectoryScreen.tsx     → Listing page with search + filters
│       ├── PgDetailsScreen.tsx       → Single PG details page
│       └── components/
│           ├── PgCard.tsx            → PG card component
│           ├── PgSearchBar.tsx       → Search bar with city/area/GPS
│           ├── PgFilters.tsx         → Price/type/sort filters
│           └── PgImageGallery.tsx    → Image gallery for details page
```

---

## API URL Reference

| Environment | IPMS-mob-api URL | Public listing endpoint |
|-------------|-------------------|------------------------|
| Local dev | `http://localhost:3001/api/v1` | `http://localhost:3001/api/v1/public/pg-listings` |
| Production | `https://mobapi.indianpgmanagement.com/api/v1` | `https://mobapi.indianpgmanagement.com/api/v1/public/pg-listings` |

### IPMS-web-ui environment:

```env
# .env (development)
VITE_API_BASE_URL=/api/v1

# .env.production
VITE_API_BASE_URL=https://mobapi.indianpgmanagement.com/api/v1
```

---

## Cost Analysis

| Component | Cost | Notes |
|-----------|------|-------|
| **Public API** | $0 | Uses existing IPMS-mob-api server |
| **Listing pages** | $0 | Uses existing IPMS-web-ui hosting |
| **GPS (Near Me)** | $0 | Browser built-in `navigator.geolocation` |
| **Google indexing** | $0 | Google crawls your pages for free |
| **Schema.org** | $0 | Just JSON-LD in HTML, no cost |
| **Sitemap** | $0 | Generated dynamically |
| **Redis cache** (Phase 6) | ~$5/mo | Optional, for scale |
| **Elasticsearch** (Phase 6) | ~$15/mo | Optional, for 10k+ PGs |
| **Image CDN** (Phase 6) | ~$5/mo | Optional, for fast images |

**Total for Phase 1-5: $0** (uses existing infrastructure)

---

## Security Considerations

1. **Rate limiting** — Public endpoints should have rate limits (e.g., 100 requests/min per IP)
2. **No sensitive data** — Never expose organization_id, tenant data, or financial info
3. **Input validation** — All query params validated (SQL injection prevention via Prisma)
4. **CORS** — Already enabled in IPMS-mob-api for all origins
5. **Pagination** — Max 50 items per page to prevent data scraping
6. **Opt-in only** — PGs are NOT listed by default; owners must explicitly publish

---

## Future Enhancements

| Feature | When | How |
|---------|------|-----|
| **Reviews & ratings** | After Phase 5 | New `pg_reviews` table, public can rate PGs |
| **Contact form** | After Phase 5 | Public form → creates lead in CRM (admin panel) |
| **WhatsApp click-to-chat** | After Phase 5 | Direct WhatsApp link with pre-filled message |
| **Map view** | After Phase 6 | Embed OpenStreetMap (free) or Google Maps (paid) |
| **Saved searches** | After Phase 6 | User accounts for public visitors (email + OTP) |
| **Price alerts** | After Phase 6 | Email notification when new PG listed in their area |
| **Comparison tool** | After Phase 6 | Compare 2-3 PGs side by side |
| **Mobile app directory** | After Phase 6 | Same API, native mobile screens in IPMS-mob |
