import type { CustomTerm, Span } from '../types'
import { detectCustomTerms } from './customTerms'
import { mergeSpans } from './merge'
import { detectRegex } from './regex'

/** Run all synchronous detectors. NER spans (milestone 3) are passed in via `extra`. */
export function detect(
  text: string,
  customTerms: CustomTerm[],
  ignored: ReadonlySet<string>,
  extra: Span[] = [],
): Span[] {
  return mergeSpans([...detectCustomTerms(text, customTerms), ...detectRegex(text), ...extra], ignored)
}
