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

## Step 4 — Determine the next version number

Look in `Final/` for existing files matching the pattern `<basename>_v<NN>.md` (e.g. `on-patience_v01.md`, `on-patience_v02.md`).

If none exist, this is the first generation: the version is `v01`.

If some exist, find the highest version number present and use the next integer, zero-padded to two digits (so `v01`...`v09`, then `v10`, `v11`, and so on — zero-padding keeps them sorting correctly in a plain file browser instead of v10 landing next to v1).

## Step 5 — Write the output

Write the finished piece (title + body, nothing else — no preamble, no notes, no commentary) to `Final/<basename>_v<NN>.md`, using the version number from Step 4. Never overwrite an existing file here — every run produces a new file. Nothing in Final/ is ever deleted or modified by this skill.

## Step 6 — Confirm

Reply with exactly one line: which draft was read, the exact filename written (including its version number), and the character count of the new output. Nothing else. Do not paste the piece itself back into the conversation — the user will open the file in Final/ to read it.
