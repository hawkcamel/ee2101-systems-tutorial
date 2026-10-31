# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Static HTML/CSS/JS site of interactive lessons for EE2101 (frequency response, Laplace, phasors, AC analysis), published via GitHub Pages from `main` / root at https://hawkcamel.github.io/ee2101-systems-tutorial/. There is no build step, package manager, linter, or test suite. To preview, open the HTML files directly or serve the folder (e.g. `python -m http.server`) and browse to `index.html`.

## Code conventions

- **HTML/CSS (and most JS) is hand-minified**: each file is one to a few very long lines. Use `grep -o` with a short context window or `head -c`/byte offsets rather than reading whole files, and keep edits in the same compact style (no reformatting the file).
- Every script is a `'use strict'` IIFE; no modules, no bundler. Third-party code is limited to KaTeX in `vendor/` (keep its fonts and LICENSE with the site). `.nojekyll` must stay.
- **Cache busting**: scripts/styles are referenced with `?v=YYYYMMDD<letter>` query strings (e.g. `course.js?v=20261021d`). When you change a shared JS/CSS file, bump its version string in *every* HTML page that includes it, otherwise GitHub Pages visitors get stale cached copies. Versions are currently not uniform across pages.
- Internal links must use explicit `.html` filenames.

## Architecture

- **`course.js`** (loaded by every page) is the shared shell. Its `lessons` array is the single source of truth for lesson order: each entry is `[href, title, id, partIndex, subtitle]`, and `parts` names the five parts. From it, course.js builds the grouped "Lessons" menu (each page ships an empty `<ol>`), the "Part · Lesson n of N" strip with progress dots in `#lessonWhere`, the prev/next links in every `.lesson-pagination`, the home-page `#courseMap` and `#resumeLink`, and the grid on `analytics.html`. Reordering or adding a lesson only means editing that array. `id` must equal the page's `<body data-lesson="...">`. The ids are historical (e.g. `complex.html` is `2`, `poles-zeros.html` is `1`); keep them so that saved progress in `localStorage` (`ee2101-progress-v1`) survives. It also renders `[data-tex]` with KaTeX and wires `#markComplete` and `[data-quiz]` boxes (`data-answer`, `data-choice`, `data-explanation`, optional `data-hint`).
- Lesson order: complex → phasors → ac-analysis → resonance → power → three-phase → transformers → systems → impulses → convolution → fourier → laplace → poles-zeros → frequency → responses → playground. `index.html` is the home page, not a lesson (`data-lesson="home"`).
- **Lesson page pattern** (styles in `course.css`): `.hook` (real-world "why bother"), `.goals`, sections titled `<span class="step">Step n</span>…`, `.predict` (question + `<details>` reveal), `.analogy`, `.key-idea`, `.slip` (common mistake), `.worked-example` followed by `.your-turn`, `.try-list`, and a closing `.recap`. Text is plain, second-person and short-sentenced, aimed at first-year undergraduates.
- Page-specific interactives live in separate scripts shared across pages: `lesson-interactives.js` (complex/systems/convolution/laplace), `intuition.js` (impulses/laplace), `bridge.js` (complex/fourier), `circuits.js` (ac-analysis), `phasors.js` (phasors), `power.js` (power), `ac-extra.js` (ac-analysis steps 6–8, resonance, three-phase, transformers), `response.js` + `frequency.js` (frequency/responses). These scripts look up their DOM elements by id, so check every page that includes a script before changing ids it depends on. `frequency.js` and `lesson-interactives.js` attach listeners to *every* `input,select` on the page, so extra form controls on those pages will trigger their re-render (and `lesson-interactives.js` treats out-of-range number inputs as invalid).
- **`playground.js`** + `playground.html`/`playground.css`: the circuit playground. `circuits` defines nine voltage-divider filters as ladder `stages` (series `top` and `shunt` elements, used to draw the schematic) plus a closed-form `tf` (numerator and denominator in ascending powers of s, all of degree ≤ 2). The time responses use exact discretisation of a controllable-canonical state-space model, with the periodic steady state solved directly for the "after it settles" view. Challenges are `[id, title, text, test(info)]` entries checked on every render.
- Assignment Alpha (the graded probe-compensation sandbox) has been removed from the site; it is still in git history (before this change) if needed.
- `time.html` is a standalone legacy lab using its own `style.css` + `app.js`; it is not part of `course.js` navigation.
- Progress is browser-local only. There is no backend, login or analytics collection (`analytics.html` just shows local progress).
