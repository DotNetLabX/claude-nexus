# Nexus in claude.ai/code cloud sessions — setup

**Problem this solves:** a cloud/web session (incl. mobile) opened on a repo that declares the
Nexus marketplace fails to auto-install the plugin. The clone of the marketplace repo returns
**HTTP 403**, so `~/.claude/plugins/installed_plugins.json` stays empty and no Nexus agents load.

**Root cause — GitHub App token scope, NOT egress.** The cloud env's **GitHub proxy** intercepts
*all* git-over-HTTPS traffic and injects a GitHub App **installation token** scoped to the repos the
Claude App is installed on. The marketplace lives in a **separate** repo (`DotNetLabX/claude-nexus`)
from the session's repo. If the Claude App isn't installed on `claude-nexus`, GitHub rejects the
clone with **403 — even though the repo is public** (the injected token isn't authorized for it, and
the proxy never falls back to an unauthenticated public read).

> This is **not** a `.claude/settings.json` problem and **not** an egress/Network-access problem.
> `.claude/settings.json` is already correct and **must not change**. Network access can already be
> `Trusted` (it includes github.com) and you will still get the 403 — egress is a red herring here.

---

## TL;DR fix

Pick one (both are account/GitHub-side, not repo-side):

1. **Grant the Claude GitHub App access to `claude-nexus`** (recommended, most targeted):
   github.com → **Settings → Applications → Claude → Configure** → under **Repository access**, add
   `DotNetLabX/claude-nexus` (or select **All repositories**). Start a fresh cloud session.
2. **Re-auth the environment via `/web-setup`** (avoids per-repo App scoping entirely): this uses
   your GitHub **OAuth token**, which can read every public repo your account sees, so the
   installation-scope limit never applies. Account-level, not per-session.

Either way, **leave Network access as-is** (`Trusted` or `Full` both fine; it is not the blocker).

---

## Why egress is not the cause

The cloud GitHub proxy is a fixed security design: the git client inside the sandbox authenticates
with a scoped credential that the proxy translates to your real GitHub token. It applies to **every**
git operation to github.com, including public-repo clones and mid-session secondary fetches like a
plugin marketplace clone.

- **GitHub App auth** (browser onboarding) → the token is an **App installation token**, scoped to
  the App's installed repos. A repo outside that set → **403**, public or not. ← this is our case.
- **`/web-setup` OAuth token** → not installation-scoped; reads all public repos → no 403.

So with App auth, the access-control surface is the **App installation scope**, not the egress
allowlist. `Trusted` already permits the full GitHub host group; the request reaches GitHub and is
rejected at the *auth* layer, returning 403.

---

## Credentials / access summary

| Situation | What's needed |
| --- | --- |
| Session repo (e.g. `knowledge-gateway`) | Already covered — that's the repo you opened the session on. |
| Marketplace repo (`claude-nexus`), public, **App auth** | App must be **installed on `claude-nexus`** (TL;DR fix #1), or switch to `/web-setup` (#2). |
| Marketplace repo, public, **`/web-setup` OAuth auth** | Works as-is — OAuth token reads all public repos. |
| Marketplace repo made **private** later | Same App-installation requirement; the proxy injects the token server-side, never into the container. |

No secret ever needs to go into the environment's **Environment variables** box — auth is handled by
the proxy, not by env vars.

---

## The repo side (for reference — do not change)

`.claude/settings.json` (committed) is already correct. It declares the marketplace and enables the
plugin; cloud sessions read it at startup and install once the App can clone `claude-nexus`:

```json
{
  "extraKnownMarketplaces": {
    "claude-nexus": {
      "source": { "source": "git", "url": "https://github.com/DotNetLabX/claude-nexus.git" }
    }
  },
  "enabledPlugins": {
    "nexus@claude-nexus": true
  }
}
```

Note: `enabledPlugins` currently enables **`nexus` only**. Cloning pulls every plugin's *files*, but
cloud only auto-*enables* what is listed here. To also auto-enable `nexus-dotnet` in cloud, add
`"nexus-dotnet@claude-nexus": true` — a repo-settings choice, separate from this access fix.

The two Nexus plugins ship no MCP servers (`.mcp.json`), no npm dependencies (`package.json`), and no
Git LFS, so nothing is fetched transitively — the **only** outbound dependency is the single
`git clone` of the marketplace repo above.

---

## Alternative: host the marketplace off GitHub

The GitHub proxy only intercepts github.com. A marketplace declared via a non-GitHub git origin
(GitLab, self-hosted, raw HTTPS) routes through the regular egress proxy instead, which permits it
under `Trusted`/`Full` — sidestepping the App-installation scope entirely. Only worth it if the
App-installation fix is impractical; for our public GitHub repo, TL;DR fix #1 is simpler.

---

## Verify the fix

After granting App access (or switching to `/web-setup`), open a fresh cloud session and confirm:

1. `claude plugin list` shows `nexus@claude-nexus` as **enabled**.
2. `~/.claude/plugins/installed_plugins.json` contains a `nexus@claude-nexus` entry (no longer empty).
3. Nexus persona commands (e.g. `/nexus:team-lead`) and always-on rules are available.

Still 403? Re-check **Settings → Applications → Claude → Configure** — confirm `claude-nexus` is
actually listed under **Repository access** (an org install may need an org-admin to approve it).

---

*Last verified: 2026-06-28. GitHub proxy / scoped-credential behavior and the App-installation repo
access path are documented at [Use Claude Code on the web](https://code.claude.com/docs/en/claude-code-on-the-web.md)
and [Get started with Claude Code on the web](https://code.claude.com/docs/en/web-quickstart.md).*
