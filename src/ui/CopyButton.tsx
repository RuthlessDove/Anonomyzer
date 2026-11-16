import { useState } from 'react'

export function CopyButton({ text, label, onCopied }: { text: string; label: string; onCopied?: () => void }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      disabled={!text}
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        onCopied?.()
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
    >
      {copied ? 'Copied ✓' : label}
    </button>
  )
}
