import { useCallback, useEffect, useRef, useState } from 'react'
import { deleteUpload, listUploads, uploadImage, type MediaFile } from '../../lib/api'
import { Button, Card, InlineNotice, formatBytes } from '../ui'

/** Uploaded images, with the URL to copy into any image field. */
export function MediaLibrary() {
  const [files, setFiles] = useState<MediaFile[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const load = useCallback(async () => {
    try {
      const result = await listUploads()
      setFiles(result.files)
      setProblem(null)
    } catch (cause) {
      setProblem(cause instanceof Error ? cause.message : 'The image library could not be loaded.')
      setFiles([])
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const upload = async (list: FileList | null) => {
    if (!list || list.length === 0) return
    setBusy(true)
    setProblem(null)
    try {
      for (const file of Array.from(list)) await uploadImage(file)
      await load()
    } catch (cause) {
      setProblem(cause instanceof Error ? cause.message : 'The upload failed.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const copy = async (file: MediaFile) => {
    const absolute = `${window.location.origin}${file.url}`
    try {
      await navigator.clipboard.writeText(absolute)
      setCopied(file.name)
      window.setTimeout(() => setCopied(null), 2500)
    } catch {
      setProblem('This browser would not allow the address to be copied. Select it and copy manually.')
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[2.25rem] leading-tight text-charcoal">Images</h1>
          <p className="mt-2 max-w-2xl font-sans text-[0.9375rem] leading-relaxed text-stone-600">
            JPEG, PNG, WebP or AVIF up to 8&nbsp;MB. Uploads are stored in <code className="font-mono text-[0.8125rem]">server/data/uploads</code>{' '}
            and served from <code className="font-mono text-[0.8125rem]">/uploads/…</code>.
          </p>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            onChange={(event) => void upload(event.target.files)}
          />
          <Button tone="primary" onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? 'Uploading…' : 'Upload images'}
          </Button>
        </div>
      </header>

      {problem ? <InlineNotice tone="error">{problem}</InlineNotice> : null}

      {copied ? <InlineNotice>Address copied: <span className="font-mono">{copied}</span></InlineNotice> : null}

      {files === null ? (
        <p className="font-sans text-[0.875rem] text-stone-500">Loading the library…</p>
      ) : files.length === 0 ? (
        <Card title="No uploads yet">
          <p className="font-sans text-[0.875rem] leading-relaxed text-stone-600">
            Photographs you upload here become available in every image field on the site. The built-in photography that
            shipped with the site lives in <code className="font-mono text-[0.8125rem]">public/images</code> and is used
            until you replace it.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {files.map((file) => (
            <figure key={file.name} className="border border-charcoal/12 bg-white">
              <div className="h-40 overflow-hidden bg-stone-100">
                <img src={file.url} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
              <figcaption className="space-y-2 p-3">
                <p className="truncate font-mono text-[0.6875rem] text-stone-600" title={file.name}>
                  {file.name}
                </p>
                <p className="font-sans text-[0.75rem] text-stone-500">
                  {formatBytes(file.bytes)}
                  {file.width && file.height ? ` · ${file.width} × ${file.height}` : ''}
                  {file.uploadedAt ? ` · ${new Date(file.uploadedAt).toLocaleDateString()}` : ''}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => void copy(file)}>Copy address</Button>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center border border-charcoal/25 px-4 py-2.5 font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-charcoal transition-colors hover:border-charcoal"
                  >
                    Open
                  </a>
                  <Button
                    tone="danger"
                    onClick={async () => {
                      if (!window.confirm(`Delete ${file.name}? Any page using it will show a broken image.`)) return
                      try {
                        await deleteUpload(file.name)
                        await load()
                      } catch (cause) {
                        setProblem(cause instanceof Error ? cause.message : 'The image could not be deleted.')
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  )
}
