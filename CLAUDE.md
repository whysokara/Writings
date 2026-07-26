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
- `Final/` — generated output from the `/write` pipeline. Each run writes a new `<basename>_vNN.md` file (e.g. `Washing Machine_v01.md`, then `_v02.md`, ...) — versions are never overwritten, so every past generation for a draft stays on disk as a plain readable file.
- `.claude/skills/write/SKILL.md` — defines the `/write <draft-filename>` slash command that runs the full pipeline end-to-end (see below). Manual-only: it does not fire automatically. This is the single source of truth for the pipeline — both the terminal `/write` command and the local webapp (`app/`) drive this same skill.
- `app/` — an optional local webapp front end for this same pipeline (see below). Not required for any of the above; the terminal `/write` command works with or without it.

## The `/write` pipeline

`/write <basename>` (basename = draft filename without `.txt`) runs a fixed sequence, defined in `.claude/skills/write/SKILL.md`:
1. Load `StyleSpec.md` (the spec) and `generator.txt` (the method).
2. Load the raw draft from `Draft/<basename>.txt`.
3. Generate the piece by executing `generator.txt`'s process against the spec, including its pre-delivery audit.
4. Determine the next free version number for that basename in `Final/` (scan for `<basename>_vNN.md`, increment the highest, or start at `v01`).
5. Write the finished piece (title + body only) to `Final/<basename>_vNN.md`. Existing versions are never overwritten.
6. Reply with one line: draft read, final file written, and the new output's character count. The piece itself is never pasted into chat — it's read from `Final/`.

## Local webapp

`app/` is a thin, optional local webapp wrapper around the same pipeline — a nicer front door than the terminal for reading `Published/`, editing `Draft/` files, and clicking "Generate" instead of typing `/write <basename>`.

- Run it with `node app/server.js`, then open `http://127.0.0.1:5757` (port configurable via `PORT`).
- Plain Node (`http`/`fs`/`child_process` built-ins only, no npm dependencies) serving plain HTML/CSS/JS — no build step, no bundler, consistent with this repo having no build system otherwise.
- The "Generate" button does not call any model API directly. It shells out to `claude -p "/write <basename>"` (Claude Code's headless mode) in the repo root, which authenticates using whatever the CLI is already logged in as. As long as no `ANTHROPIC_API_KEY` env var is set, this rides your Claude Code subscription login exactly like typing `/write` interactively would — it does not consume separate Anthropic API credits.
- Because both paths (terminal and webapp) drive the exact same `.claude/skills/write/SKILL.md`, there is only one pipeline definition to keep in sync.

## Working with these files

- **Files inside `Published/` are read-only. Never edit, overwrite, or delete them.** They are finished, published pieces, not drafts. If asked to revise one, propose the change or write a revised copy elsewhere rather than modifying the original.
- `Final/*.md` is pipeline-generated output — treat it as disposable/regeneratable, not hand-authored prose to preserve carefully the way `Published/` is.
- Preserve the plain-`.txt`, one-piece-per-file convention in `Published/` and `Drafts/` unless asked to change it.
- When editing an existing published piece, match its existing capitalization/punctuation register rather than normalizing it to standard prose (see `StyleSpec.md` Section 5 and 8 for the specifics — British/Indian-English spelling, deliberately inconsistent ellipsis style, etc).
- When asked to find a piece "about X," grep across `Published/` — titles don't always signal the topic (e.g. `Wired Earphone.txt` is about reliability/dependability, not audio gear; see `StyleSpec.md` Section 1 for how titles relate to content in this author's work).
