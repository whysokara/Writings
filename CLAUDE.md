# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

This is not a software project — it's a personal collection of short-form published writing (`Published/`), one piece per `.txt` file. There is no build system, package manager, linter, or test suite. There is nothing to compile or run.

When working here, the tasks are things like: drafting new pieces, editing existing ones, checking consistency of tone/formatting across files, or searching for a piece by theme. Treat requests accordingly — don't introduce tooling, config, or scaffolding unless explicitly asked.

## Structure

- `Published/*.txt` — finished pieces, one per file, filename is a short title (e.g. `Chess.txt`, `Wired Earphone.txt`). No other metadata, front matter, or subfolders.

## Voice and style

The pieces are short (roughly 150–400 words), first-person or omniscient reflective writing — a mix of humor, social observation, and philosophical musing, often built around a single extended metaphor. Recurring patterns worth preserving when writing or editing in this voice:

- **Tech-as-metaphor**: everyday life or emotion frequently mapped onto programming/git/software concepts (`git commit -m "same old routine"`, life as `happiness * Math.random()`, muscle-memory lapses compared to forgetting a terminal command). The author has a software background and reaches for this naturally — don't force it into pieces where it doesn't fit.
- **Indian cultural grounding**: references to chai, sutta shops, cricket/IPL, Diwali, office culture — used to keep abstract observations concrete and local rather than generic.
- **Short, punchy lines mixed with longer flowing sentences** — deliberate sentence fragments for rhythm ("Life does." / "No dude."), often ending a piece on a short, quiet, or open-ended line rather than a neat conclusion.
- **Casual capitalization is inconsistent by design** in some pieces (lowercase openings, mid-sentence lowercase after periods) — this varies piece to piece and isn't a typo to "fix" uniformly; check the specific piece's own internal consistency rather than applying a global rule.
- Pieces tend to build toward a reframe or a twist in perspective rather than a punchline — the humor is observational, not joke-structured.

## Working with these files

- **Files inside `Published/` are read-only. Never edit, overwrite, or delete them.** They are finished, published pieces, not drafts. If asked to revise one, propose the change or write a revised copy elsewhere rather than modifying the original.
- Preserve the plain-`.txt`, one-piece-per-file convention unless asked to change it.
- When editing an existing piece, match its existing capitalization/punctuation register rather than normalizing it to standard prose.
- When asked to find a piece "about X," grep across `Published/` — titles don't always signal the topic (e.g. `Wired Earphone.txt` is about reliability/dependability, not audio gear).
