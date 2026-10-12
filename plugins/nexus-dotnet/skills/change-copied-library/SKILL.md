---
name: change-copied-library
description: Changes an app's copy of a shared library's source when a copied piece does not fit - raise the gap, fix a plain defect or wait for the library owner's ruling, fix the copy with a test that fails on the copy as it was, and hand every fix back in one hand-over file per session so the change and its test reach the library. Use when an app holds a copy of a shared library's source and a piece of it is wrong, missing or does not fit the app, or when a session must send its fixes of a copied library back to that library.
---

# Change a Copied Library

Some apps hold a copy of a shared library's source rather than a package reference — copied in once, then kept in
step with the library by hand or by the library's own sync tool. When a copied piece does not fit, the fix belongs to
the library: made once in the app's copy, proven by a test, and sent back so the library and every other copy get
it. A workaround in a service hides the gap and leaves every other copy with it.

## Assumes

- **A copy of the library's source in the app's repository**, built with the app — not a package reference.
- **A test project for the copy**, or the app's own tests, in the test framework the app already uses.
- **A library owner** who rules on the library's form and applies hand-overs in the library's own repository.

## When to Use

- An app holds a copy of a shared library's source, and a copied piece is wrong, missing or does not fit.
- A session fixed the copy and its fixes must travel back to the library.

## Steps

1. **Raise the gap.** Name what does not fit and where, before writing code. Never work around it in a service — no
   wrapper, no subclass and no duplicate of the piece beside the code that needs it.
2. **Decide who decides.** A plain defect with one obvious fix (a wrong comparison, a missing null case, a value that
   is never read) is fixed now. A choice about the library's own form — a new public member, a changed signature, a
   new dependency, a different behaviour some other app may rely on — waits for the library owner's ruling; the
   service waits with it.
3. **Fix the copy, with a test.** The fix is made in the app's copy of the library, with a test that fails on the
   copy as it was and passes on the fix. One session at a time changes the copy, so two fixes never cross.
4. **Record every fix of the session in one hand-over file,** committed in the app (below).
5. **Send the change and its failing test back.** Both travel to the library — by the library's sync tool where it
   has one, and by the hand-over file always. The app's session never writes in the library's own repository: the
   library's owner applies the change there.

## The Hand-Over File

One file per session: `docs/library-feedback/{library}-{yyyy-mm-dd}.md` in the app. A second session on the same day
adds a short topic to the name, `{library}-{yyyy-mm-dd}-{topic}.md`. The file holds numbered points, one per fix:

```markdown
# {library} — fixes from {app}, {yyyy-mm-dd}

## 1. {short title}

- **Observed:** what did not fit, and where it showed.
- **What changed:** the fix, in a sentence or two.
- **Files:** the library files changed, as paths inside the library.
- **Test:** the test that failed on the copy as it was, and where it lives.
```

## What This Skill Does NOT Do

- Create a shared library — `create-building-blocks-package`.
- Write in the library's own repository — the library's owner applies the hand-over there.
- Decide a question about the library's form — the library's owner does.
