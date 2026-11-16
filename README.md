# Anonymiser

A local, offline tool for removing sensitive details from text and PDFs before pasting them into an LLM chat (ChatGPT, Claude, etc.), then putting the real details back into the reply.

```
Your text ──▶ [PERSON_1] studied [COURSE_CODE_1] at [UNIVERSITY_1] ──▶ LLM
Your text ◀── restored with the real names, codes and dates ◀────────── reply
```

Built for UK formats, with university work in mind (course codes, student IDs, universities, dates).

## Privacy

- **Nothing leaves your machine.** Detection, masking and restoring all run in your browser tab. There is no backend.
- **No AI model is used yet.** Detection is regex patterns plus your own word list.
- **Network is blocked by the page.** A strict Content-Security-Policy (see [vite.config.ts](vite.config.ts)) makes the browser refuse requests to other sites. PDF reading uses a bundled copy of pdf.js, not a CDN.
- **The mapping is never saved.** The list matching placeholders to real values lives in memory only. It is cleared when you reload the page or click **Clear session**.
- The dev server only listens on `localhost`.

## Getting started

Requires Node.js and npm.

```bash
npm install
npm run dev      # open http://localhost:5173
```

Other scripts:

| Command           | What it does                              |
| ----------------- | ----------------------------------------- |
| `npm test`        | Run the unit tests                        |
| `npm run build`   | Type-check and build to `dist/`           |
| `npm run preview` | Serve the built app on localhost          |
| `npm run lint`    | Lint with oxlint                          |

## How to use it

1. **Paste text** into box 1, or click **Upload PDF**.
2. **Review.** Detected items are highlighted with their placeholder.
   - Click a highlight to leave it unmasked.
   - Select any text to mask something that was missed. Choose a type, or type your own tag name.
3. **Copy masked text** and paste it into the LLM. By default a short note is added asking it to keep the placeholders unchanged.
4. **Paste the reply** into box 3. The placeholders are swapped back to the real values.

Restoring tolerates an LLM that reformats placeholders (e.g. `(Person 1)` or `PERSON_1`), and it flags any it doesn't recognise. Copy the masked text again after changing tags or terms, otherwise the LLM's reply will use the old placeholder names.

### PDFs

PDF text is extracted in the browser. **Scanned PDFs (images of pages) contain no text**, so those pages are skipped and a warning is shown. Don't treat the output as the whole document in that case. OCR is not supported yet.

## What it detects

| Type            | Examples                                                         |
| --------------- | ---------------------------------------------------------------- |
| `EMAIL`         | `jane.doe@student.leeds.ac.uk`                                   |
| `PHONE`         | `07911 123456`, `+44 (0)20 7946 0958`                            |
| `POSTCODE`      | `SW1A 1AA`, `ls2 9jt`                                            |
| `NI_NUMBER`     | `AB 12 34 56 C`                                                  |
| `DATE`          | `03/04/2025`, `3rd April 2025`, `Thursday 3 April`, `April 2025` |
| `UNIVERSITY`    | `University of Leeds`, `Leeds Beckett University`                |
| `STUDENT_ID`    | `s1234567`, `201912345` (generic pattern)                        |
| `COURSE_CODE`   | `COMP3011`, `cs320`, `MA 1001` (any case, generic pattern)       |
| Your own words  | Anything in your word list (below)                               |

**Not detected automatically: people's names**, organisations and places. Regex can't reliably tell that a word is a name. Add names to your word list or select them in the page. Automatic name detection is planned (see below).

The student ID and course code patterns are generic and will sometimes flag unrelated text (e.g. `iso9001`). Click a highlight to leave it unmasked.

## Always-mask word list

Edit [src/detectors/defaultTerms.ts](src/detectors/defaultTerms.ts):

```ts
export const DEFAULT_TERMS: CustomTerm[] = [
  { term: 'Jane Doe', type: 'PERSON' },
  { term: 'University of Warwick', type: 'UNIVERSITY' },
  { term: 'Machine Learning', type: 'CUSTOM', label: 'MODULE' }, // → [MODULE_1]
]
```

- Matching ignores case and only matches whole words (`Warwick` won't match inside `Warwickshire`). Phrases are fine.
- `type` sets the colour and default placeholder name. `label` is optional and overrides the placeholder name. It is cleaned to capital letters and underscores.
- These terms always win over the automatic detectors.
- Words added from the page last until you reload; copy them into this file to keep them.
- Don't commit real names to a public repository.

## How it works

1. Detectors produce spans: your word list ([customTerms.ts](src/detectors/customTerms.ts)) and the UK patterns ([regex.ts](src/detectors/regex.ts)).
2. [merge.ts](src/detectors/merge.ts) resolves overlaps (your terms beat regex, and the longest match wins) and drops values you un-masked.
3. [mask.ts](src/anonymise/mask.ts) swaps each span for a placeholder like `[PERSON_1]`. The same value always gets the same placeholder ([mapping.ts](src/anonymise/mapping.ts)).
4. [restore.ts](src/anonymise/restore.ts) swaps placeholders back, including reformatted ones.

## Project layout

```
src/
  detectors/   regex, custom terms, merging, default word list
  anonymise/   mask, restore, placeholder mapping
  pdf/         PDF text extraction (pdf.js)
  ui/          review view, restore panel, terms table, copy button
  App.tsx
tests/         unit tests + a fake-data PDF fixture
```

## Limitations

- Detection is pattern-based, so it can miss things. **Always read the highlighted preview and the masked output before copying.** You are the last line of defence.
- Details that identify someone without matching any pattern (a unique job title, a nickname, context that gives them away) are not caught.
- Placeholders show structure. An LLM can still infer things from the surrounding text.

## Roadmap

- Automatic name, organisation and place detection with a small model that runs offline in the browser (model files stored locally, no remote loading)
- Import/export of the word list as a JSON file
- Tuning the course code and student ID patterns to real examples
- OCR for scanned PDFs
