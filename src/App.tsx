import { useMemo, useState } from 'react'
import type { Mapping } from './anonymise/mapping'
import { mask, PROMPT_HINT } from './anonymise/mask'
import { detect } from './detectors'
import { DEFAULT_TERMS } from './detectors/defaultTerms'
import { extractPdfText } from './pdf/extract'
import { normalise, type CustomTerm, type EntityType, type Span } from './types'
import { CopyButton } from './ui/CopyButton'
import { RestorePanel } from './ui/RestorePanel'
import { ReviewView } from './ui/ReviewView'
import { TermsList } from './ui/TermsList'

type PdfState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'done'; name: string; pageCount: number; emptyPages: number[] }
  | { kind: 'error'; message: string }

export default function App() {
  const [input, setInput] = useState('')
  const [terms, setTerms] = useState<CustomTerm[]>(DEFAULT_TERMS)
  const [ignored, setIgnored] = useState<ReadonlySet<string>>(new Set())
  // Placeholders committed when text is copied, so older LLM replies can still be restored.
  const [session, setSession] = useState<Mapping>([])
  const [addHint, setAddHint] = useState(true)
  const [pdf, setPdf] = useState<PdfState>({ kind: 'idle' })

  const spans = useMemo(() => detect(input, terms, ignored), [input, terms, ignored])
  const { masked, mapping } = useMemo(() => mask(input, spans, session), [input, spans, session])

  function unmask(span: Span) {
    setIgnored((prev) => new Set(prev).add(normalise(span.text)))
  }

  function renameTerm(target: CustomTerm, label: string) {
    setTerms((prev) =>
      prev.map((t) => {
        if (t !== target) return t
        const { label: _old, ...rest } = t
        return label ? { ...rest, label } : rest
      }),
    )
  }

  function addTerm(term: string, type: EntityType, label?: string) {
    const key = normalise(term)
    setTerms((prev) => [
      ...prev.filter((t) => normalise(t.term) !== key),
      label ? { term, type, label } : { term, type },
    ])
    setIgnored((prev) => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })
  }

  async function loadPdf(file: File) {
    setPdf({ kind: 'loading' })
    try {
      const { text, pageCount, emptyPages } = await extractPdfText(file)
      setInput(text)
      setPdf({ kind: 'done', name: file.name, pageCount, emptyPages })
    } catch (err) {
      const name = (err as { name?: string })?.name
      setPdf({
        kind: 'error',
        message:
          name === 'PasswordException'
            ? `${file.name} is password-protected. Remove the password and try again.`
            : `Couldn't read ${file.name}. It may be damaged or not a real PDF.`,
      })
    }
  }

  function clearSession() {
    setPdf({ kind: 'idle' })
    setInput('')
    setTerms(DEFAULT_TERMS)
    setIgnored(new Set())
    setSession([])
  }

  return (
    <main>
      <header className="top">
        <div>
          <h1>Anonymiser</h1>
          <p className="muted">Runs entirely in this browser tab. Nothing is sent anywhere, and the mapping is cleared when you reload.</p>
        </div>
        <button className="danger" onClick={clearSession}>
          Clear session
        </button>
      </header>

      <section className="card">
        <div className="row heading-row">
          <h2>1. Paste sensitive text or upload a PDF</h2>
          <label className={`button-like${pdf.kind === 'loading' ? ' disabled' : ''}`}>
            {pdf.kind === 'loading' ? 'Reading PDF…' : 'Upload PDF'}
            <input
              type="file"
              accept="application/pdf,.pdf"
              hidden
              disabled={pdf.kind === 'loading'}
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = '' // allow re-picking the same file
                if (file) loadPdf(file)
              }}
            />
          </label>
        </div>
        {pdf.kind === 'done' && (
          <p className={pdf.emptyPages.length ? 'warn' : 'muted'}>
            Loaded <strong>{pdf.name}</strong> ({pdf.pageCount} page{pdf.pageCount === 1 ? '' : 's'}).
            {pdf.emptyPages.length > 0 &&
              ` No text found on page ${pdf.emptyPages.join(', ')}, so those pages are probably scanned images and weren't read.`}
          </p>
        )}
        {pdf.kind === 'error' && <p className="error">{pdf.message}</p>}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste text containing names, IDs, dates, course codes…"
          rows={8}
          spellCheck={false}
        />
      </section>

      <section className="card">
        <h2>2. Review &amp; copy</h2>
        <p className="muted">
          Click a highlight to leave it unmasked. Select any text to mask something that was missed.
        </p>
        <ReviewView text={input} spans={spans} mapping={mapping} onUnmask={unmask} onMask={addTerm} />

        {(terms.length > 0 || ignored.size > 0) && (
          <div className="lists">
            {terms.length > 0 && (
              <TermsList
                terms={terms}
                onRename={renameTerm}
                onRemove={(t) => setTerms((prev) => prev.filter((x) => x !== t))}
              />
            )}
            {ignored.size > 0 && (
              <div>
                <span className="muted">Left unmasked:</span>
                {[...ignored].map((v) => (
                  <button
                    key={v}
                    className="chip"
                    title="Mask again"
                    onClick={() =>
                      setIgnored((prev) => {
                        const next = new Set(prev)
                        next.delete(v)
                        return next
                      })
                    }
                  >
                    {v} ↺
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="row">
          <label>
            <input type="checkbox" checked={addHint} onChange={(e) => setAddHint(e.target.checked)} /> Tell the LLM to
            keep placeholders intact
          </label>
          <CopyButton
            text={masked ? (addHint ? PROMPT_HINT : '') + masked : ''}
            label="Copy masked text"
            onCopied={() => setSession(mapping)}
          />
        </div>
        <pre className="output">{masked || <span className="muted">Masked output appears here.</span>}</pre>

        {mapping.length > 0 && (
          <details>
            <summary>Mapping ({mapping.length})</summary>
            <table>
              <tbody>
                {mapping.map((e) => (
                  <tr key={e.placeholder}>
                    <td>
                      <code>{e.placeholder}</code>
                    </td>
                    <td>{e.original}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        )}
      </section>

      <RestorePanel mapping={mapping} />
    </main>
  )
}
