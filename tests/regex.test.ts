import { describe, expect, it } from 'vitest'
import { detect } from '../src/detectors'
import type { EntityType } from '../src/types'

/** Detected [type, text] pairs after merging. */
function found(text: string): [EntityType, string][] {
  return detect(text, [], new Set()).map((s) => [s.type, s.text])
}

function expectOnly(text: string, type: EntityType, value: string) {
  expect(found(text)).toContainEqual([type, value])
}

describe('UK regex detectors', () => {
  it.each([
    'jane.doe@student.leeds.ac.uk',
    'j.smith+notes@gmail.com',
  ])('email: %s', (v) => expectOnly(`Contact ${v} today.`, 'EMAIL', v))

  it.each(['07911 123456', '07911123456', '+44 7911 123456', '+44 (0)20 7946 0958', '020-7946-0958', '0113 343 2000'])(
    'phone: %s',
    (v) => expectOnly(`Call ${v} please`, 'PHONE', v),
  )

  it.each(['SW1A 1AA', 'M1 1AE', 'LS2 9JT', 'EH8 9YL', 'ls2 9jt'])('postcode: %s', (v) =>
    expectOnly(`Address: 1 High St, ${v}.`, 'POSTCODE', v),
  )

  it.each(['AB 12 34 56 C', 'AB123456D'])('NI number: %s', (v) => expectOnly(`NI: ${v}`, 'NI_NUMBER', v))

  it.each([
    '03/04/2025',
    '3.4.25',
    '2025-04-03',
    '3rd April 2025',
    '14 Feb',
    'Thursday 3 April 2025',
    'April 3rd, 2025',
    'September 2024',
    '1st of March',
  ])('date: %s', (v) => expectOnly(`The deadline is ${v} at noon`, 'DATE', v))

  it.each(['University of Leeds', 'The University of Edinburgh', 'Leeds Beckett University', "King's College London"])(
    'university: %s',
    (v) => expectOnly(`I study at ${v} now.`, 'UNIVERSITY', v),
  )

  it.each(['s1234567', '201912345'])('student id: %s', (v) => expectOnly(`My ID is ${v}.`, 'STUDENT_ID', v))

  it.each(['COMP3011', 'CS101', 'cs320', 'Cs320', 'MA 1001', 'LAW2010A'])('course code: %s', (v) =>
    expectOnly(`Module ${v} coursework`, 'COURSE_CODE', v),
  )

  it('does not flag ordinary prose', () => {
    expect(found('I may have time to finish the essay later this week.')).toEqual([])
  })
})

describe('merging and custom terms', () => {
  it('custom terms take priority over regex', () => {
    const spans = detect('Email bob@uni.ac.uk', [{ term: 'bob@uni.ac.uk', type: 'CUSTOM' }], new Set())
    expect(spans).toHaveLength(1)
    expect(spans[0]).toMatchObject({ type: 'CUSTOM', source: 'custom' })
  })

  it('custom terms are case-insensitive and whole-word', () => {
    const text = 'Dr Okafor met okafor; Okaforian is different'
    const spans = detect(text, [{ term: 'Okafor', type: 'PERSON' }], new Set())
    expect(spans.map((s) => s.text)).toEqual(['Okafor', 'okafor'])
  })

  it('ignored values are not masked', () => {
    const spans = detect('Due 3rd April 2025', [], new Set(['3rd april 2025']))
    expect(spans).toEqual([])
  })

  it('produces non-overlapping sorted spans', () => {
    const spans = detect('Call +44 7911 123456 or email a@b.co.uk on 03/04/2025', [], new Set())
    for (let i = 1; i < spans.length; i++) expect(spans[i].start).toBeGreaterThanOrEqual(spans[i - 1].end)
  })
})
