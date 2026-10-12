import { useState } from 'react'
import { Button } from '../ui/Button'
import { ArrowRight, MapPin } from '../ui/icons'
import { useContent } from '../../content/context'
import { configured, integration } from '../../lib/integrations'

/**
 * Location panel.
 *
 * The map is loaded only when the visitor asks for it, so no third-party
 * request is made on page load. Google's keyless embed endpoint refuses to be
 * framed (X-Frame-Options: SAMEORIGIN), so OpenStreetMap is the default; set
 * VITE_GOOGLE_MAPS_EMBED_KEY to use the Google Maps Embed API instead.
 */
export function MapPanel({ className = '' }: { className?: string }) {
  const { company } = useContent()
  const [showMap, setShowMap] = useState(false)

  const googleEmbed = configured.googleMaps
    ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(integration.googleMapsEmbedKey)}&q=${company.maps.lat},${company.maps.lng}&zoom=16`
    : ''

  const embedSrc = googleEmbed || company.maps.osmEmbedUrl
  const provider = googleEmbed ? 'Google Maps' : 'OpenStreetMap'

  return (
    <div className={`border border-charcoal/10 bg-white ${className}`}>
      <div className="grid gap-0 md:grid-cols-12">
        <div className="border-b border-charcoal/10 p-8 md:col-span-5 md:border-b-0 md:border-r lg:p-10">
          <p className="flex items-center gap-3 font-sans text-[0.625rem] font-semibold uppercase tracking-eyebrow text-bronze">
            <span aria-hidden="true" className="h-px w-6 bg-bronze" />
            Our office
          </p>
          <p className="mt-5 font-display text-[1.5rem] leading-snug text-charcoal">{company.legalName}</p>
          <address className="mt-3 font-sans text-[0.9375rem] not-italic leading-relaxed text-stone-600">
            {company.address.street}
            <br />
            {company.address.locality} {company.address.postalCode}
            <br />
            {company.address.region}, {company.address.country}
          </address>

          <dl className="mt-7 space-y-3 border-t border-charcoal/10 pt-6 font-sans text-[0.8125rem] text-stone-600">
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">Phone</dt>
              <dd>
                <a
                  href={`tel:${company.phone.tel}`}
                  className="underline-offset-4 hover:text-bronze hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2"
                >
                  {company.phone.display}
                </a>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">Coordinates</dt>
              <dd className="tabular-nums">
                {company.maps.lat}, {company.maps.lng}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">Opening hours</dt>
              <dd className="text-right text-stone-500">
                {company.hasOpeningHours ? company.openingHours : 'To be confirmed by TOC'}
              </dd>
            </div>
            {company.hasEmail ? (
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">Email</dt>
                <dd>
                  <a
                    href={`mailto:${company.email}`}
                    className="underline-offset-4 hover:text-bronze hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2"
                  >
                    {company.email}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-7 flex flex-col gap-3">
            <a
              href={company.maps.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-2.5 bg-charcoal px-6 py-3.5 font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-ivory transition-colors hover:bg-[#141613] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2"
            >
              Get directions
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            <a
              href={company.maps.listingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 border border-charcoal/25 px-6 py-3.5 font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-charcoal transition-colors hover:border-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2"
            >
              View Google Maps listing
            </a>
          </div>
        </div>

        <div className="relative min-h-[22rem] bg-stone-100 md:col-span-7">
          {showMap ? (
            <iframe
              title={`Map showing ${company.legalName}, ${company.address.locality}`}
              src={embedSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 h-full w-full border-0"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center">
              <MapPin className="h-7 w-7 text-bronze" />
              <p className="max-w-sm font-sans text-[0.875rem] leading-relaxed text-stone-600">
                The interactive map is provided by {provider} and loads only when you ask for it, so no third-party
                request is made while you browse.
              </p>
              <Button variant="outline" type="button" onClick={() => setShowMap(true)}>
                Load the map
              </Button>
              <p className="font-sans text-[0.6875rem] text-stone-500">
                You can also{' '}
                <a
                  href={company.maps.osmLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-charcoal"
                >
                  open the location in {provider}
                </a>
                .
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
