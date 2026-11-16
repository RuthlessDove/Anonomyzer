import { useMemo, useState } from 'react'
import type { Mapping } from '../anonymise/mapping'
import { restore } from '../anonymise/restore'
import { CopyButton } from './CopyButton'

export function RestorePanel({ mapping }: { mapping: Mapping }) {
  const [reply, setReply] = useState('')
  const result = useMemo(() => restore(reply, mapping), [reply, mapping])

  return (
    <section className="card">
      <h2>3. Restore the LLM's reply</h2>
      <p className="muted">Paste the response here and the placeholders will be swapped back to the real values.</p>
      <textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="Paste the LLM reply…"
        rows={8}
        spellCheck={false}
      />
      {reply && (
        <>
          <div className="row">
            <span className="muted">{result.replaced} placeholder(s) restored</span>
            <CopyButton text={result.text} label="Copy restored text" />
          </div>
          {result.fuzzy.length > 0 && (
            <p className="warn">
              The LLM changed some placeholders; matched anyway:{' '}
              {result.fuzzy.map((f) => `${f.found} → ${f.placeholder}`).join(', ')}
            </p>
          )}
          {result.unknown.length > 0 && (
            <p className="error">Unknown placeholders left as-is: {result.unknown.join(', ')}</p>
          )}
          <pre className="output">{result.text}</pre>
        </>
      )}
    </section>
  )
}
