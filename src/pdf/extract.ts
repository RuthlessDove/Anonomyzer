// The worker file is bundled into the app and served from the same origin (no CDN).
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

export interface PdfText {
  text: string
  pageCount: number
  /** Pages with no extractable text, which usually means a scanned image. */
  emptyPages: number[]
}

/** Rebuild a page's lines from pdf.js text items (marked-content items have no `str`). */
export function joinTextItems(items: readonly object[]): string {
  let text = ''
  for (const item of items) {
    if (!('str' in item)) continue
    const { str, hasEOL } = item as { str: string; hasEOL?: boolean }
    text += str + (hasEOL ? '\n' : '')
  }
  return text.replace(/[ \t]+\n/g, '\n').trim()
}

/** Extract plain text from a PDF entirely in the browser. */
export async function extractPdfText(file: File): Promise<PdfText> {
  // Loaded on demand so the main page stays small.
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

  // pdf.js v6 has no eval code path, and the app's CSP blocks eval regardless.
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) })
  const doc = await task.promise

  const pages: string[] = []
  const emptyPages: number[] = []
  try {
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n)
      const pageText = joinTextItems((await page.getTextContent()).items)
      if (!pageText) emptyPages.push(n)
      pages.push(pageText)
      page.cleanup()
    }
  } finally {
    await task.destroy()
  }

  return { text: pages.filter(Boolean).join('\n\n'), pageCount: pages.length, emptyPages }
}
