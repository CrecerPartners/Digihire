import { Helmet } from 'react-helmet-async'

interface SEOMetaProps {
  title: string
  description: string
  canonical: string
  ogImage?: string
  ogType?: string
  noIndex?: boolean
}

const DEFAULT_OG_IMAGE = 'https://voltsquad.digihire.io/images/og-default.png'

export function SEOMeta({
  title,
  description,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noIndex = false,
}: SEOMetaProps) {
  return (
    <Helmet>
      <title>{title}</title>
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="VoltSquad" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  )
}
