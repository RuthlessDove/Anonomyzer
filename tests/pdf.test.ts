import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
// Node-compatible build of pdf.js; the browser app uses the standard build with a bundled worker.
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { mask } from '../src/anonymise/mask'
import { detect } from '../src/detectors'
import { joinTextItems } from '../src/pdf/extract'

// Fixture contains only made-up details.
const FIXTURE = new URL('./fixtures/fake-extension-request.pdf', import.meta.url)

async function pdfText(): Promise<string> {
  const task = getDocument({ data: new Uint8Array(readFileSync(FIXTURE)) })
  const doc = await task.promise
  const pages: string[] = []
  for (let n = 1; n <= doc.numPages; n++) {
    pages.push(joinTextItems((await (await doc.getPage(n)).getTextContent()).items))
  }
  await task.destroy()
  return pages.join('\n\n')
}

describe('PDF extraction', () => {
  it('extracts text with line breaks', async () => {
    const text = await pdfText()
    expect(text).toContain('Extension request')
    expect(text).toContain('University of Warwick')
    expect(text.split('\n').length).toBeGreaterThanOrEqual(5)
  })

  it('extracted text is fully masked', async () => {
    const text = await pdfText()
    const terms = [{ term: 'Jane Doe', type: 'PERSON' as const }]
    const { masked } = mask(text, detect(text, terms, new Set()), [])
    for (const secret of ['Jane Doe', 's1234567', 'University of Warwick', 'cs320', '3rd April 2025',
      '07911 123456', 'jane.doe@warwick.ac.uk', 'CV4 7AL']) {
      expect(masked).not.toContain(secret)
    }
  })
})
