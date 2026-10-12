import { useCallback, useEffect, useRef, useState } from 'react'
import { listUploads, uploadImage, type MediaFile } from '../lib/api'
import { Button, InlineNotice, formatBytes } from './ui'

/**
 * Image picker.
 * ---------------------------------------------------------------------------
 * One modal for every image on the site: upload a new file, pick something
 * already uploaded, choose one of the built-in photographs, or paste a link.
 * Returns `{ src, width, height }` so the caller can fill in the intrinsic size.
 */

export type PickedImage = { src: string; width?: number; height?: number }

/** The photographs that ship with the site. */
const SITE_IMAGES: { src: string; label: string }[] = [
  { src: '/images/hero-residence-1920.webp', label: 'Hero — residence, dusk' },
  { src: '/images/about-planning-1200.webp', label: 'Planning and drawings' },
  { src: '/images/about-finishing-1200.webp', label: 'Finishing detail' },
  { src: '/images/p1-a-1400.webp', label: 'Residential — exterior' },
  { src: '/images/p1-b-1400.webp', label: 'Residential — interior' },
  { src: '/images/p1-c-1400.webp', label: 'Residential — detail' },
  { src: '/images/p2-a-1400.webp', label: 'Structural — frame' },
  { src: '/images/p2-b-1400.webp', label: 'Structural — concrete' },
  { src: '/images/p2-c-1400.webp', label: 'Structural — detail' },
  { src: '/images/p3-a-1400.webp', label: 'Finishing — surfaces' },
  { src: '/images/p3-b-1400.webp', label: 'Finishing — joinery' },
  { src: '/images/og-toc.jpg', label: 'Sharing image (social media)' },
]

type Tab = 'upload' | 'library' | 'site' | 'link'

export function MediaPicker({
  open,
  onClose,
  onPick,
  title = 'Choose an image',
}: {
  open: boolean
  onClose: () => void
  onPick: (image: PickedImage) => void
  title?: string
}) {
  const [tab, setTab] = useState<Tab>('upload')
  const [files, setFiles] = useState<MediaFile[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const [link, setLink] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const loadLibrary = useCallback(async () => {
    try {
      const result = await listUploads()
      setFiles(result.files ?? [])
    } catch {
      setFiles([])
      setProblem('The image library could not be loaded.')
    }
  }, [])

  useEffect(() => {
    if (!open) return
    setProblem(null)
    setTab('upload')
    setLink('')
    void loadLibrary()
  }, [open, loadLibrary])

  const upload = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setProblem(null)
    try {
      const result = await uploadImage(file)
      void loadLibrary()
      onPick({ src: result.url, width: result.width, height: result.height })
      onClose()
    } catch (cause) {
      setProblem(cause instanceof Error ? cause.message : 'That file could not be uploaded.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  if (!open) return null

  const tabs: { key: Tab; label: string }[] = [
    { key: 'upload', label: 'Upload new' },
    { key: 'library', label: 'Your uploads' },
    { key: 'site', label: 'Built-in photos' },
    { key: 'link', label: 'Web address' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-charcoal/40 px-4 py-[6vh]">
      <button type="button" aria-label="Close" className="absolute inset-0 cursor-default" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title} className="relative w-full max-w-4xl border border-charcoal/20 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-charcoal/10 px-5 py-4">
          <h2 className="font-display text-[1.375rem] text-charcoal">{title}</h2>
          <Button tone="quiet" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="flex flex-wrap gap-1 border-b border-charcoal/10 px-4 py-2">
          {tabs.map((entry) => (
            <button
              key={entry.key}
              type="button"
              onClick={() => setTab(entry.key)}
              className={
                'px-3 py-2 font-sans text-[0.75rem] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze ' +
                (tab === entry.key ? 'bg-charcoal text-ivory' : 'text-stone-600 hover:bg-ivory')
              }
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div className="max-h-[64vh] overflow-y-auto p-5">
          {problem ? (
            <div className="mb-4">
              <InlineNotice tone="error">{problem}</InlineNotice>
            </div>
          ) : null}

          {tab === 'upload' ? (
            <div
              onDragOver={(event) => {
                event.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault()
                setDragging(false)
                void upload(event.dataTransfer.files?.[0])
              }}
              className={
                'flex flex-col items-center justify-center gap-4 border border-dashed px-6 py-14 text-center ' +
                (dragging ? 'border-bronze bg-bronze/5' : 'border-charcoal/25')
              }
            >
              <p className="font-sans text-[0.9375rem] text-charcoal">Drop a photograph here</p>
              <p className="max-w-md font-sans text-[0.8125rem] leading-relaxed text-stone-500">
                JPEG, PNG, WebP or AVIF, up to 8 MB. Wide landscape photographs work best — the site crops
                them to fit each layout.
              </p>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                onChange={(event) => void upload(event.target.files?.[0])}
              />
              <Button tone="primary" onClick={() => inputRef.current?.click()} disabled={busy}>
                {busy ? 'Uploading…' : 'Choose a file'}
              </Button>
            </div>
          ) : null}

          {tab === 'library' ? (
            files === null ? (
              <p className="font-sans text-[0.8125rem] text-stone-500">Loading…</p>
            ) : files.length === 0 ? (
              <p className="font-sans text-[0.8125rem] text-stone-500">
                Nothing uploaded yet. Use <strong className="font-semibold">Upload new</strong> to add the first
                photograph.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {files.map((file) => (
                  <button
                    key={file.name}
                    type="button"
                    onClick={() => {
                      onPick({ src: file.url, width: file.width, height: file.height })
                      onClose()
                    }}
                    className="group border border-charcoal/12 bg-white text-left transition-colors hover:border-bronze focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze"
                  >
                    <span className="block h-28 overflow-hidden bg-stone-100">
                      <img src={file.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                    </span>
                    <span className="block px-2.5 py-2">
                      <span className="block truncate font-sans text-[0.6875rem] text-charcoal">{file.name}</span>
                      <span className="mt-0.5 block font-sans text-[0.625rem] text-stone-500">
                        {formatBytes(file.bytes)}
                        {file.width && file.height ? ' · ' + file.width + '×' + file.height : ''}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )
          ) : null}

          {tab === 'site' ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {SITE_IMAGES.map((entry) => (
                <button
                  key={entry.src}
                  type="button"
                  onClick={() => {
                    onPick({ src: entry.src })
                    onClose()
                  }}
                  className="border border-charcoal/12 bg-white text-left transition-colors hover:border-bronze focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze"
                >
                  <span className="block h-28 overflow-hidden bg-stone-100">
                    <img src={entry.src} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </span>
                  <span className="block px-2.5 py-2 font-sans text-[0.6875rem] text-charcoal">{entry.label}</span>
                </button>
              ))}
            </div>
          ) : null}

          {tab === 'link' ? (
            <div className="max-w-xl space-y-4">
              <p className="font-sans text-[0.8125rem] leading-relaxed text-stone-600">
                Paste the address of an image that already exists online, or a path on this site such as
                <code className="mx-1 bg-ivory px-1.5 py-0.5 font-mono text-[0.75rem]">/images/hero-residence-1920.webp</code>.
              </p>
              <input
                value={link}
                onChange={(event) => setLink(event.target.value)}
                placeholder="https://… or /images/…"
                className="w-full border border-charcoal/20 bg-white px-3 py-2.5 font-sans text-[0.875rem] text-charcoal outline-none focus:border-charcoal"
              />
              {link ? (
                <span className="block h-40 w-full max-w-sm overflow-hidden border border-charcoal/12 bg-stone-100">
                  <img src={link} alt="" className="h-full w-full object-cover" />
                </span>
              ) : null}
              <Button
                tone="primary"
                disabled={link.trim().length < 2}
                onClick={() => {
                  onPick({ src: link.trim() })
                  onClose()
                }}
              >
                Use this address
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
