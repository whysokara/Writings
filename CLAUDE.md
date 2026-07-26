# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

This is not a software project — it's a personal writing corpus plus a voice-imitation pipeline built on top of it. There is no build system, package manager, linter, or test suite. There is nothing to compile or run.

Two kinds of work happen here:
1. Direct work on the corpus itself — drafting, editing, searching pieces in `Published/`.
2. Running the `/write` pipeline, which takes a rough draft and turns it into a new piece in the author's own voice, using a forensic style specification derived from the corpus.

Don't introduce tooling, config, or scaffolding beyond what's described below unless explicitly asked.

## Structure

- `Published/*.txt` — finished, already-published pieces. One per file, filename is the title (e.g. `Chess.txt`, `Wired Earphone.txt`). This is the read-only source corpus the style spec was derived from.
- `StyleSpec.md` — a detailed forensic style specification (title conventions, sentence mechanics, punctuation frequencies, lexicon, rhetoric, generation directives, anti-patterns, a weakness audit) reverse-engineered from `Published/`. This is the canonical reference for the author's voice — don't restate or re-derive it elsewhere; read it directly when voice questions come up.
- `generator.txt` — the operating prompt/process for turning raw material into a finished piece using `StyleSpec.md`. Defines the step-by-step method (find the one idea, choose architecture, write, run a pre-delivery audit against the spec) and optional modes (THREE OPENINGS, SKELETON, DIAGNOSTIC, REWRITE).
- `Draft/` — raw, unstructured input material for new pieces (notes, fragments, half-formed ideas), one file per piece-in-progress.
- `Final/` — generated output from the `/write` pipeline, one `.md` file per piece, named after its source draft. Always reflects the latest generation for that draft.
- `History/<basename>/` — created on demand by the `/write` skill. Before overwriting a `Final/<basename>.md`, its previous content is copied here as `<basename>_<YYYY-MM-DD_HHMM>.md`, so every past generation accumulates as a plain readable file (no git involved).
- `.claude/skills/write/SKILL.md` — defines the `/write <draft-filename>` slash command that runs the full pipeline end-to-end (see below). Manual-only: it does not fire automatically.

## The `/write` pipeline

`/write <basename>` (basename = draft filename without `.txt`) runs a fixed sequence, defined in `.claude/skills/write/SKILL.md`:
1. Load `StyleSpec.md` (the spec) and `generator.txt` (the method).
2. Load the raw draft from `Draft/<basename>.txt`.
3. Generate the piece by executing `generator.txt`'s process against the spec, including its pre-delivery audit.
4. If `Final/<basename>.md` already exists, archive its current content to `History/<basename>/` with a timestamp before overwriting.
5. Write the finished piece (title + body only) to `Final/<basename>.md`.
6. Reply with one line: draft read, final file written, whether/where a previous version was archived, and the new output's character count. The piece itself is never pasted into chat — it's read from `Final/`.

## Working with these files

- **Files inside `Published/` are read-only. Never edit, overwrite, or delete them.** They are finished, published pieces, not drafts. If asked to revise one, propose the change or write a revised copy elsewhere rather than modifying the original.
- `Final/*.md` and `History/**` are pipeline-generated output — treat them as disposable/regeneratable, not hand-authored prose to preserve carefully the way `Published/` is.
- Preserve the plain-`.txt`, one-piece-per-file convention in `Published/` and `Drafts/` unless asked to change it.
- When editing an existing published piece, match its existing capitalization/punctuation register rather than normalizing it to standard prose (see `StyleSpec.md` Section 5 and 8 for the specifics — British/Indian-English spelling, deliberately inconsistent ellipsis style, etc).
- When asked to find a piece "about X," grep across `Published/` — titles don't always signal the topic (e.g. `Wired Earphone.txt` is about reliability/dependability, not audio gear; see `StyleSpec.md` Section 1 for how titles relate to content in this author's work).
