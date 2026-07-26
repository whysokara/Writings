---
name: write
description: Turn a raw draft in Draft/ into a finished piece in Final/, written in the author's own voice using StyleSpec.md and Generator.txt. Manual-only — use when the user explicitly runs /write, not automatically.
argument-hint: draft-filename (without .txt, e.g. "on-patience")
disable-model-invocation: true
allowed-tools: Read, Write
context: fork
---

You are running a fixed pipeline. Do not improvise, do not skip steps, and do not print the finished piece into this conversation — the output belongs in a file, not in chat.

## Resolve the filename

The argument is: $ARGUMENTS

Strip a trailing `.txt` if the user included one, so you have a bare base name (e.g. `on-patience`). Use this bare name for both the draft lookup and the final output filename.

If $ARGUMENTS is empty, stop and report: "Usage: /write <draft-filename-without-extension>" — do not guess a file.

## Step 1 — Load the spec and the generator

Read `StyleSpec.md` in the project root. This is the STYLE SPECIFICATION.

Read `Generator.txt` in the project root. This is the exact prompt and process you must follow for Step 3 — it defines the working method (finding the piece inside the raw context, choosing architecture, writing, then the pre-delivery audit against the spec). Follow it precisely; do not summarize or shortcut it.

## Step 2 — Load the draft

Read `Draft/<basename>.txt`.

If this file does not exist, stop and report exactly that — which path you looked for — and do not create anything in Final/.

If it exists but is empty or only whitespace, stop and report that the draft is empty rather than generating from nothing.

The content of this file is the RAW CONTEXT referenced in Generator.txt.

## Step 3 — Generate

Execute Generator.txt's process exactly, using:
- STYLE SPECIFICATION = the content of StyleSpec.md
- RAW CONTEXT = the content of Draft/<basename>.txt

Run the full pre-delivery audit described in Generator.txt before finalizing anything. Do not deliver a piece that hasn't passed that audit.

## Step 4 — Preserve the previous version, if there is one

Before writing anything new, check whether `Final/<basename>.md` already exists.

If it does, copy its current content, unchanged, into a new file at `History/<basename>/<basename>_<YYYY-MM-DD_HHMM>.md`, using the current date and time (create the `History/<basename>/` folder first if it doesn't exist yet). This is a plain copy into a plain folder — nothing git-related, nothing to configure. Every past version simply accumulates there as a readable file with a title on it, browsable in Finder/Explorer like any other folder.

If `Final/<basename>.md` does not exist yet (first generation for this piece), skip this step — there is nothing to preserve.

## Step 5 — Write the output

Write the finished piece (title + body, nothing else — no preamble, no notes, no commentary) to `Final/<basename>.md`, overwriting it if it already exists. This file always reflects the latest generation from the current draft.

## Step 6 — Confirm

Reply with exactly one line: which draft was read, which final file was written, whether a previous version was archived to History/ (and its filename if so), and the character count of the new output. Nothing else. Do not paste the piece itself back into the conversation — the user will open Final/<basename>.md to read it.
