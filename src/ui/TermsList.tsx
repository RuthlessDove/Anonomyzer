import { useState } from 'react'
import { sanitiseLabel, type CustomTerm } from '../types'

interface Props {
  terms: CustomTerm[]
  onRename: (term: CustomTerm, label: string) => void
  onRemove: (term: CustomTerm) => void
}

/** The "Always masked" words, each with an editable tag name. */
export function TermsList({ terms, onRename, onRemove }: Props) {
  return (
    <table className="terms">
      <thead>
        <tr>
          <th>Always masked</th>
          <th>Tag name</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {terms.map((t) => (
          <TermRow key={t.term} term={t} onRename={onRename} onRemove={onRemove} />
        ))}
      </tbody>
    </table>
  )
}

function TermRow({ term, onRename, onRemove }: { term: CustomTerm } & Omit<Props, 'terms'>) {
  const current = term.label ?? term.type
  const [draft, setDraft] = useState(current)

  function commit() {
    const clean = sanitiseLabel(draft)
    // Empty input resets the tag to the type's default name.
    onRename(term, clean === term.type ? '' : clean)
    setDraft(clean || term.type)
  }

  return (
    <tr>
      <td>
        <span className={`chip ent-${term.type}`}>{term.term}</span>
      </td>
      <td>
        <input
          className="tag-input"
          value={draft}
          aria-label={`Tag name for ${term.term}`}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
      </td>
      <td>
        <button className="ghost" title="Remove" onClick={() => onRemove(term)}>
          ✕
        </button>
      </td>
    </tr>
  )
}
