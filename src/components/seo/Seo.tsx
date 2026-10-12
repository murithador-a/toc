import { Helmet } from 'react-helmet-async'
import { useContent } from '../../content/context'

type Props = {
  title: string
  description: string
  /** Route path beginning with "/" — used to build the canonical URL */
  path: string
  image?: string
  type?: string
  noindex?: boolean
  /** Additional structured data for this page only */
  structuredData?: Record<string, unknown> | Record<string, unknown>[]
}

export function Seo({ title, description, path, image, type = 'website', noindex = false, structuredData }: Props) {
  const { seo } = useContent()
  const base = seo.siteUrl.replace(/\/$/, '')
  const canonical = `${base}${path === '/' ? '/' : path}`
  const ogImage = image || seo.ogImage
  const imageUrl = ogImage.startsWith('http') ? ogImage : `${base}${ogImage}`

  return (
    <Helmet prioritizeSeoTags>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noindex ? (
        <meta name="robots" content="noindex, follow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large" />
      )}

      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:locale" content="en_NG" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {structuredData ? <script type="application/ld+json">{JSON.stringify(structuredData)}</script> : null}
    </Helmet>
  )
}
