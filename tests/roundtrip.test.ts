import { describe, expect, it } from 'vitest'
import { mask } from '../src/anonymise/mask'
import { restore } from '../src/anonymise/restore'
import { detect } from '../src/detectors'
import type { CustomTerm } from '../src/types'

const SAMPLE = `Dear Professor Adebayo,

I'm Jane Doe (s1234567), a second-year student at the University of Leeds.
I missed the COMP3011 deadline on 3rd April 2025 because I was ill.
You can reach me on 07911 123456 or jane.doe@student.leeds.ac.uk.
My address is 12 Hyde Park Road, LS6 1AB. Jane Doe will also attend on 10/04/2025.`

const TERMS: CustomTerm[] = [
  { term: 'Jane Doe', type: 'PERSON' },
  { term: 'Adebayo', type: 'PERSON' },
]

function run(text = SAMPLE) {
  return mask(text, detect(text, TERMS, new Set()), [])
}

describe('mask', () => {
  it('removes every sensitive value', () => {
    const { masked } = run()
    for (const secret of ['Jane Doe', 'Adebayo', 's1234567', 'University of Leeds', 'COMP3011', '3rd April 2025',
      '07911 123456', 'jane.doe@student.leeds.ac.uk', 'LS6 1AB', '10/04/2025']) {
      expect(masked).not.toContain(secret)
    }
  })

  it('reuses placeholders for repeated values', () => {
    const { masked, mapping } = run()
    expect(masked.match(/\[PERSON_2\]/g)).toHaveLength(2)
    expect(mapping.filter((e) => e.original === 'Jane Doe')).toHaveLength(1)
  })

  it('numbers placeholders per type', () => {
    const { masked } = run()
    expect(masked).toContain('[DATE_1]')
    expect(masked).toContain('[DATE_2]')
  })

  it('keeps existing assignments when extending a mapping', () => {
    const first = run()
    const second = mask('Jane Doe again', detect('Jane Doe again', TERMS, new Set()), first.mapping)
    expect(second.masked).toBe('[PERSON_2] again')
  })
})

describe('restore', () => {
  it('round-trips: restore(mask(x)) === x', () => {
    const { masked, mapping } = run()
    const r = restore(masked, mapping)
    expect(r.text).toBe(SAMPLE)
    expect(r.fuzzy).toEqual([])
    expect(r.unknown).toEqual([])
  })

  it('handles placeholders the LLM reformatted', () => {
    const { mapping } = run()
    const reply = 'Hi (Person 2), your {date-1} extension for [course_code 1] is fine. PERSON_1 agreed.'
    const r = restore(reply, mapping)
    expect(r.text).toBe('Hi Jane Doe, your 3rd April 2025 extension for COMP3011 is fine. Adebayo agreed.')
    expect(r.fuzzy).toHaveLength(4)
  })

  it('flags unknown placeholders and leaves unrelated brackets alone', () => {
    const { mapping } = run()
    const r = restore('See [Section 2] and [PERSON_9].', mapping)
    expect(r.text).toBe('See [Section 2] and [PERSON_9].')
    expect(r.unknown).toEqual(['[PERSON_9]'])
  })
})
