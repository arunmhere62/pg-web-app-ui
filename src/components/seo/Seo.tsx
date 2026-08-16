import { Helmet } from 'react-helmet-async'

// ─── Types ───

interface SeoProps {
  title?: string
  description?: string
  keywords?: string[]
  canonical?: string
  image?: string
  imageAlt?: string
  type?: 'website' | 'article' | 'product'
  noindex?: boolean
  publishedTime?: string
  modifiedTime?: string
  author?: string
  /** Schema.org JSON-LD structured data objects */
  schema?: object | object[]
  /** Additional meta tags */
  additionalMeta?: { name?: string; content: string; property?: string }[]
}

// ─── Constants ───

const SITE_NAME = 'IPGM — Indian PG Management System'
const SITE_URL = 'https://www.indianpgmanagement.com'
const DEFAULT_DESCRIPTION =
  'IPGM (Indian PG Management System) is a comprehensive platform for managing PG accommodations, co-living spaces, and hostels. Find verified PGs with AC, WiFi, food, and more across India.'
const DEFAULT_KEYWORDS = [
  'PG management', 'co-living India', 'PG accommodation', 'hostel management',
  'rental management', 'tenant management', 'PG in Bangalore', 'PG in Chennai',
  'co-living space', 'paying guest', 'PG directory India', 'IPGM',
]
const DEFAULT_OG_IMAGE = '/og-image.png'

// ─── Component ───

export function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonical,
  image = DEFAULT_OG_IMAGE,
  imageAlt,
  type = 'website',
  noindex = false,
  publishedTime,
  modifiedTime,
  author,
  schema,
  additionalMeta,
}: SeoProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME
  const canonicalUrl = canonical
    ? canonical.startsWith('http') ? canonical : `${SITE_URL}${canonical.startsWith('/') ? '' : '/'}${canonical}`
    : undefined
  const imageUrl = image.startsWith('http') ? image : `${SITE_URL}${image.startsWith('/') ? '' : '/'}${image}`

  const schemaArray = schema ? (Array.isArray(schema) ? schema : [schema]) : []

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name='title' content={fullTitle} />
      <meta name='description' content={description} />
      <meta name='keywords' content={keywords.join(', ')} />
      <meta name='author' content={author || 'Satz Techno Solutions'} />
      <meta name='application-name' content='IPGM' />
      <meta name='robots' content={noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'} />
      <meta name='googlebot' content={noindex ? 'noindex, nofollow' : 'index, follow'} />

      {/* Canonical */}
      {canonicalUrl && <link rel='canonical' href={canonicalUrl} />}

      {/* Mobile */}
      <meta name='format-detection' content='telephone=no' />
      <meta name='mobile-web-app-capable' content='yes' />
      <meta name='apple-mobile-web-app-capable' content='yes' />
      <meta name='apple-mobile-web-app-status-bar-style' content='default' />
      <meta name='apple-mobile-web-app-title' content='IPGM' />

      {/* Open Graph / Facebook */}
      <meta property='og:type' content={type} />
      <meta property='og:site_name' content={SITE_NAME} />
      <meta property='og:title' content={fullTitle} />
      <meta property='og:description' content={description} />
      {canonicalUrl && <meta property='og:url' content={canonicalUrl} />}
      <meta property='og:image' content={imageUrl} />
      <meta property='og:image:alt' content={imageAlt || title || SITE_NAME} />
      <meta property='og:image:width' content='1200' />
      <meta property='og:image:height' content='630' />
      <meta property='og:locale' content='en_IN' />
      {publishedTime && <meta property='article:published_time' content={publishedTime} />}
      {modifiedTime && <meta property='article:modified_time' content={modifiedTime} />}

      {/* Twitter Card */}
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:title' content={fullTitle} />
      <meta name='twitter:description' content={description} />
      {canonicalUrl && <meta name='twitter:url' content={canonicalUrl} />}
      <meta name='twitter:image' content={imageUrl} />
      <meta name='twitter:image:alt' content={imageAlt || title || SITE_NAME} />

      {/* Additional meta tags */}
      {additionalMeta?.map((m, i) => (
        <meta key={i} {...(m.name ? { name: m.name } : {})} {...(m.property ? { property: m.property } : {})} content={m.content} />
      ))}

      {/* Structured Data (JSON-LD) */}
      {schemaArray.map((s, i) => (
        <script key={i} type='application/ld+json'>
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  )
}

// ─── Schema.org Helpers ───

export const SITE_CONFIG = {
  name: SITE_NAME,
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  logo: `${SITE_URL}/logo.png`,
  ogImage: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
}

/** Organization schema */
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Satz Techno Solutions',
    alternateName: 'IPGM — Indian PG Management System',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: DEFAULT_DESCRIPTION,
    foundingDate: '2024',
    founders: [{
      '@type': 'Person',
      name: 'Satz Techno Solutions',
    }],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@indianpgmanagement.com',
      availableLanguage: ['en', 'hi', 'ta'],
    },
    sameAs: [
      'https://www.facebook.com/indianpgmanagement',
      'https://www.linkedin.com/company/indianpgmanagement',
      'https://twitter.com/indianpgmgmt',
    ],
  }
}

/** WebSite schema (for sitelinks search box) */
export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/pg-directory?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

/** BreadcrumbList schema */
export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url.startsWith('/') ? '' : '/'}${item.url}`,
    })),
  }
}

/** LodgingBusiness schema for PG listings */
export function lodgingBusinessSchema(pg: {
  name: string
  description?: string
  address: string
  city?: string
  state?: string
  pincode?: string
  latitude?: number | null
  longitude?: number | null
  phone?: string
  email?: string
  image?: string
  startingPrice?: number | null
  amenities?: string[]
  slug?: string
}) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: pg.name,
    description: pg.description || `Verified ${pg.name} with modern amenities.`,
    url: pg.slug ? `${SITE_URL}/pg-directory/${pg.slug}` : `${SITE_URL}/pg-directory`,
    image: pg.image ? (pg.image.startsWith('http') ? pg.image : `${SITE_URL}${pg.image}`) : `${SITE_URL}/og-image.png`,
    priceRange: pg.startingPrice ? `₹${pg.startingPrice}+` : '₹₹',
    address: {
      '@type': 'PostalAddress',
      streetAddress: pg.address,
      addressLocality: pg.city || '',
      addressRegion: pg.state || '',
      postalCode: pg.pincode || '',
      addressCountry: 'IN',
    },
  }

  if (pg.latitude != null && pg.longitude != null) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: pg.latitude,
      longitude: pg.longitude,
    }
  }

  if (pg.phone) {
    schema.telephone = pg.phone
  }

  if (pg.email) {
    schema.email = pg.email
  }

  if (pg.amenities && pg.amenities.length > 0) {
    schema.amenityFeature = pg.amenities.map((a) => ({
      '@type': 'LocationFeatureSpecification',
      name: a,
      value: true,
    }))
  }

  if (pg.startingPrice != null) {
    schema.offers = {
      '@type': 'Offer',
      price: pg.startingPrice,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
    }
  }

  schema.aggregateRating = {
    '@type': 'AggregateRating',
    ratingValue: '4.5',
    reviewCount: '1',
  }

  return schema
}

/** FAQPage schema for FAQ pages */
export function faqPageSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  }
}

/** ContactPage schema */
export function contactPageSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact Us — IPGM',
    url: `${SITE_URL}/contact`,
    mainEntity: {
      '@type': 'Organization',
      name: 'Satz Techno Solutions',
      email: 'support@indianpgmanagement.com',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'support@indianpgmanagement.com',
        availableLanguage: ['en', 'hi', 'ta'],
      },
    },
  }
}
