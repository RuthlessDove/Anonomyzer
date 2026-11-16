import { describe, expect, it } from 'vitest'
import { mask } from '../src/anonymise/mask'
import { restore } from '../src/anonymise/restore'
import { detect } from '../src/detectors'
import { sanitiseLabel, type CustomTerm } from '../src/types'

const TERMS: CustomTerm[] = [
  { term: 'Machine Learning', type: 'CUSTOM', label: 'module' },
  { term: 'Dr Okafor', type: 'PERSON', label: 'my lecturer!' },
  { term: 'Warwick', type: 'UNIVERSITY' },
]
const TEXT = 'Dr Okafor teaches Machine Learning at Warwick. machine learning is hard.'

function run() {
  return mask(TEXT, detect(TEXT, TERMS, new Set()), [])
}

describe('custom tag names', () => {
  it('sanitises labels to capital letters and underscores', () => {
    expect(sanitiseLabel('module')).toBe('MODULE')
    expect(sanitiseLabel('my lecturer!')).toBe('MY_LECTURER')
    expect(sanitiseLabel('  a--b  c1 ')).toBe('A_B_C')
    expect(sanitiseLabel('123')).toBe('')
  })

  it('uses the label in placeholders and the type when there is none', () => {
    const { masked } = run()
    expect(masked).toBe('[MY_LECTURER_1] teaches [MODULE_1] at [UNIVERSITY_1]. [MODULE_1] is hard.')
  })

  it('restores labelled placeholders, including reformatted ones', () => {
    const { masked, mapping } = run()
    expect(restore(masked, mapping).text).toBe(TEXT.replace('machine learning', 'Machine Learning'))
    const r = restore('Revise (module 1) and MY_LECTURER_1.', mapping)
    expect(r.text).toBe('Revise Machine Learning and Dr Okafor.')
    expect(r.fuzzy).toHaveLength(2)
  })

  it('numbers each label separately', () => {
    const terms: CustomTerm[] = [
      { term: 'Alpha', type: 'CUSTOM', label: 'MODULE' },
      { term: 'Beta', type: 'CUSTOM', label: 'MODULE' },
      { term: 'Gamma', type: 'CUSTOM' },
    ]
    const t = 'Alpha Beta Gamma'
    expect(mask(t, detect(t, terms, new Set()), []).masked).toBe('[MODULE_1] [MODULE_2] [CUSTOM_1]')
  })
})
