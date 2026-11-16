import { normalise } from '../types'

export interface MappingEntry {
  /** e.g. "[PERSON_1]" or "[MODULE_1]" */
  placeholder: string
  /** The first-seen original spelling, used when restoring. */
  original: string
  /** The placeholder's name: an entity type, or a user-chosen label. */
  tag: string
  /** normalise(original): variants of the same value share one placeholder. */
  key: string
}

/** Immutable list of placeholder assignments. Kept in memory only. */
export type Mapping = readonly MappingEntry[]

export function lookupByPlaceholder(mapping: Mapping, placeholder: string): MappingEntry | undefined {
  return mapping.find((e) => e.placeholder === placeholder)
}

/** Return the placeholder for a value, assigning a new one if needed. */
export function assign(
  mapping: Mapping,
  original: string,
  tag: string,
): { mapping: Mapping; placeholder: string } {
  const key = normalise(original)
  const existing = mapping.find((e) => e.key === key)
  if (existing) return { mapping, placeholder: existing.placeholder }

  const n = mapping.filter((e) => e.tag === tag).length + 1
  const entry: MappingEntry = { placeholder: `[${tag}_${n}]`, original, tag, key }
  return { mapping: [...mapping, entry], placeholder: entry.placeholder }
}
