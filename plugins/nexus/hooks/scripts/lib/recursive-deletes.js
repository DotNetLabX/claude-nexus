'use strict';
/**
 * Whether a hook's whole-line refusal of a recursive delete may be lifted: `liftable(command, place)` is true only
 * when every delete in the command is read in full and every target lies strictly inside the session's root. It
 * can only lift; whatever it cannot read keeps the caller's verdict. Text in, a boolean out: no file is read and no
 * process is started.
 *
 * `place` is { cwd, root, tool: 'Bash' | 'PowerShell', home, platform }. `home` is read once, and may be a getter:
 * a home that is missing, empty or throws lifts nothing. A target lifts when it is strictly inside `root` from every
 * folder the statement may run in, is not `root` itself, not `{root}/.claude`, and holds no `..` segment; a
 * wildcard only in its last segment, judged by the folder above it.
 *
 * The delete forms the hooks may see:
 *
 * | Shell      | Form                                                   | Read                                        |
 * |------------|--------------------------------------------------------|---------------------------------------------|
 * | Bash       | `rm`, `rmdir`                                          | read; `rmdir -p` / `--parents` not read     |
 * | Bash       | `find … -delete`                                       | not read — its targets are a search         |
 * | Bash       | `git clean`                                            | not read — its targets are git's to pick    |
 * | Bash       | `shred`, `unlink`                                      | not read — not forms today's check reads    |
 * | Bash       | `rsync --delete` (and `--del…`, `--remove-source…`)    | not read — its targets are a comparison     |
 * | any        | `rimraf`, `npx rimraf`                                 | not read — not a form today's check reads   |
 * | PowerShell | `Remove-Item` and `ri`, `rm`, `rmdir`, `rd`, `del`     | read, with only known switches beside paths |
 * | PowerShell | `erase`, `Clear-Content`, a .NET `Delete` call         | not read — not forms today's check reads    |
 * | cmd        | `rd /s`, `rmdir /s`, `del /s`, `robocopy /mir`         | not read — cmd's switches are not parsed    |
 * | launcher   | `bash`/`sh`/`cmd`/`pwsh`/… , `eval`, `iex`, `wsl`, `su` | not read — the command they run is text    |
 * | launcher   | `env -S` / `--split-string`                            | not read — the command it runs is text      |
 * | script     | `node`/`bun` `-e`/`-p`/`--eval`/`--print`, `deno eval`, `python -c`, `perl -e`, `ruby -e`, `php -r`; or any of them with an option before its first operand, with no operand or `-`, fed by a pipe or an input redirect | not read — the script's paths are code, or its script may be stdin |
 *
 * A line holding a form not read keeps the caller's verdict, as does a delete or a folder change anywhere but as a
 * plain statement (inside quotes, a comment, a `$(…)`, backticks, or behind `sudo`, `timeout`, `xargs`,
 * `find -exec` and the like). Not read at all: a here-document, a PowerShell here-string or block comment (`<#`), a
 * subshell or any paren, a brace other than `${NAME}`, `||`, a background `&`, `$'…'` and `$"…"`,
 * `pushd`/`popd`/`chdir`, `source`, a statement opening with a shell control word (`if`, `while`, `for`, `case`,
 * `[[`, `coproc` and the rest), a statement opening with a redirect (`>x cmd`), and in Bash a backslash-newline,
 * which joins the words around it, or any arithmetic: `let`, `((…))`, `$((…))`, `$[…]`, and a subscripted name
 * (`A[i]=`, `read 'A[i]'`), whose subscript is arithmetic that may write a variable. A builtin is
 * found both by name in the text and as a command with its quotes taken off. A variable resolves only under Bash, from a plain `NAME=value` statement that
 * follows `;`, a newline or the line's start, assigned once; `~`, `$HOME`, `${HOME}` and PowerShell's
 * `$env:USERPROFILE` are `home`. A Bash word holding a backslash does not resolve: shell-words keeps it literal where
 * Bash would strip it. A variable whose value holds a space, or that a later `NAME+=` or `NAME[i]=` touches, does
 * not resolve; a line holding a builtin that writes variables (`printf`, `read`, `mapfile`, `readarray`, `export`,
 * `readonly`, `let`, `getopts`, `unset`, PowerShell's `Set-Variable` and kin, an `env:` drive write) resolves no
 * variable and no home; one that writes through an expanded name (`printf -v "$X"`, `read "$X"`) may write `CDPATH`
 * or `PWD`, so under Bash a relative folder change after it is not followed. A line that writes `IFS`, `CDPATH`, `HOME`, `PWD` or `OLDPWD` in any form (`=`, `+=`, `[i]=`,
 * or through such a builtin), or holds `declare`, `typeset` or `local`, lifts nothing: each would split, alias or
 * move a target past what is read here. A delete or folder change whose statement holds a
 * `$` or `~` inside single quotes, a `~` inside double quotes, or a quoted `<` or `>`, lifts nothing: shell-words
 * drops the quotes that make them literal. A PowerShell delete or folder change lifts only beside the switches
 * `-Recurse`, `-Force`, `-Confirm`, `-WhatIf`, `-Verbose` (bound only to `$true`/`$false`), `-ErrorAction` with a
 * preference, and `-Path`/`-LiteralPath` before a path. A path segment holding `~` and a digit may be a Windows short
 * name, and a Windows path segment ending in a dot or a space is the name without it: neither lifts. Under POSIX
 * rules a backslash is a character of a name, so a root, folder, home or target holding one lifts nothing. A root
 * that is a drive or filesystem root, or the home folder itself, lifts nothing; neither does a target that is the
 * home folder or holds it, and `{root}/.claude` is matched in any case, for case-blind disks.
 */
const path = require('path');
const { statements, commandsOf, exeName } = require('./shell-words');

const DELETES = new Set(['rm', 'rmdir', 'remove-item', 'ri', 'rd', 'del']);
const DELETE_WORDS = /\b(rm|rmdir|remove-item|ri|rd|del)\b/gi;
const FOLDER_CHANGES = new Set(['cd', 'set-location', 'sl']);
const FOLDER_WORDS = /\b(cd|set-location|sl)\b/gi;
const UNREAD_FOLDER_WORDS = /\b(pushd|popd|push-location|pop-location|chdir)\b/i;
const UNREAD_FOLDER_EXES = new Set(['pushd', 'popd', 'push-location', 'pop-location', 'chdir']);
const VAR_WRITERS = /\b(printf|read|mapfile|readarray|export|readonly|let|getopts|unset)\b/;
const PS_VAR_WRITERS = /\b(set-variable|new-variable|clear-variable|remove-variable|set-item|sv|nv|si)\b|(^|[^$\w])env:/i;
const WRITER_EXES = new Set([
  'printf', 'read', 'mapfile', 'readarray', 'export', 'readonly', 'let', 'getopts', 'unset',
  'set-variable', 'new-variable', 'clear-variable', 'remove-variable', 'set-item', 'sv', 'nv', 'si',
]);
const SCOPE_WRITERS = new Set(['declare', 'typeset', 'local']);
const SPECIAL_WRITE = /(^|[^\w$])(IFS|CDPATH|HOME|PWD|OLDPWD)(\+?=|\[)/;
const SUBSCRIPTED = /(^|[^\w$/.\\])[A-Za-z_][A-Za-z0-9_]*\[|\$\[/;
const SPECIAL_NAMED =/^(-[A-Za-z]*)?(IFS|CDPATH|HOME|PWD|OLDPWD)(?![A-Za-z0-9_])/;
const CONTROL_WORDS = new Set([
  'if', 'then', 'elif', 'else', 'fi', 'while', 'until', 'for', 'do', 'done', 'case', 'esac', 'select', 'function',
  '{', '}', '[[', '((', 'coproc',
]);
const ENV_SPLIT = /^(-[^-]*S|--s(p(l(i(t(-(s(t(r(i(n(g)?)?)?)?)?)?)?)?)?)?)?(=|$))/;
const INTERPRETER = /^(node|nodejs|bun|deno|py(thon)?[0-9.]*|perl|ruby|php)$/;
const LAUNCHERS = new Set([
  'sh', 'bash', 'zsh', 'dash', 'ksh', 'mksh', 'ash', 'fish', 'csh', 'tcsh', 'busybox', 'cmd', 'pwsh', 'powershell',
  'wsl', 'su', 'runuser', 'script', 'eval', 'iex', 'invoke-expression', 'start-process', 'saps', 'start',
]);
const NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
const ASSIGNMENT = /^([A-Za-z_][A-Za-z0-9_]*)=/;
const REDIRECT = /^\d*(>>?|<)/;
const BARE_REDIRECT = /^\d*(>>?|<)$/;
const DRIVE = /^[A-Za-z]:[\\/]/;
const WILDCARD = /[*?[]/;
const SHORT_NAME = /~\d/;
const PS_SWITCHES = [['recurse', 1], ['force', 2], ['confirm', 2], ['whatif', 2], ['verbose', 1]];
const PS_SWITCH_ALIASES = new Set(['vb', 'wi', 'cf']);
const PS_PATH_PARAMS = new Set(['path', 'literalpath', 'lp', 'pspath']);
const PS_ERROR_ACTION = new Set(['erroraction', 'ea']);
const PS_PREFERENCE = /^(silentlycontinue|stop|continue|inquire|ignore|suspend|break|[0-6])$/i;
// Each relative folder change doubles the folders a statement may run in; past this many, none is judged.
const MAX_FOLDERS = 64;

// The line cut at its separators outside quotes, each piece with the separator before and after it and what its
// quotes held; null where the line holds a shape this reader does not read.
function pieces(command) {
  const s = command.replace(/\\\r?\n/g, ' ');
  const out = [];
  let text = '';
  let before = 'start';
  let quote = '';
  let wordStart = true;
  let literal = false;
  let quotedAngle = false;
  const cut = (sep) => {
    out.push({ text, before, after: sep, literal, quotedAngle });
    text = ''; before = sep; wordStart = true; literal = false; quotedAngle = false;
  };
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quote && (ch === '<' || ch === '>')) quotedAngle = true;
    if (quote === "'") {
      text += ch;
      if (ch === "'") quote = '';
      else if (ch === '$' || ch === '~') literal = true;
      continue;
    }
    if (quote === '"') {
      text += ch;
      if (ch === '\\' && (s[i + 1] === '"' || s[i + 1] === '\\')) text += s[++i];
      else if (ch === '"') quote = '';
      else if (ch === '~') literal = true;
      continue;
    }
    if (ch === '#' && wordStart) {
      while (i + 1 < s.length && s[i + 1] !== '\n' && s[i + 1] !== '\r') i++;
      continue;
    }
    if (ch === "'" || ch === '"') { quote = ch; text += ch; wordStart = false; continue; }
    if (ch === '\\' && (s[i + 1] === '"' || s[i + 1] === "'")) return null;
    if (ch === '$' && (s[i + 1] === "'" || s[i + 1] === '"')) return null;
    if (ch === '<' && (s[i + 1] === '<' || s[i + 1] === '#')) return null;
    if (ch === '$' && s[i + 1] === '{') {
      const m = /^\$\{([A-Za-z_][A-Za-z0-9_]*)\}/.exec(s.slice(i));
      if (!m || /[A-Za-z0-9_]/.test(s[i + m[0].length] || '')) return null;
      text += `$${m[1]}`;
      i += m[0].length - 1;
      wordStart = false;
      continue;
    }
    if ('(){}`'.includes(ch)) return null;
    if (ch === ';') { cut(';'); continue; }
    if (ch === '\n' || ch === '\r') { cut('\n'); continue; }
    if (ch === '|') {
      if (s[i + 1] === '|') return null;
      cut('|');
      continue;
    }
    if (ch === '&') {
      if (s[i + 1] === '&') { cut('&&'); i++; continue; }
      if (s[i - 1] === '>' || s[i - 1] === '<' || s[i + 1] === '>') continue;
      return null;
    }
    text += ch;
    wordStart = /\s/.test(ch);
  }
  if (quote) return null;
  cut('end');
  return out;
}

// A word with its home folder and variables put in, or null where it holds anything else that expands.
function expand(word, ctx) {
  if (!ctx.powershell && word.includes('\\')) return null;
  if (word.includes('`')) return null;
  let w = word;
  if (/^~(?=$|[\\/])/.test(w)) {
    if (ctx.home === null) return null;
    w = ctx.home + w.slice(1);
  } else if (w.startsWith('~')) return null;
  let out = '';
  for (let i = 0; i < w.length; i++) {
    if (w[i] !== '$') { out += w[i]; continue; }
    const rest = w.slice(i);
    let m;
    let value = null;
    if (ctx.powershell) {
      m = /^\$env:([A-Za-z_][A-Za-z0-9_]*)/i.exec(rest);
      if (m) value = /^userprofile$/i.test(m[1]) ? ctx.home : null;
      else {
        m = /^\$([A-Za-z_][A-Za-z0-9_]*)/.exec(rest);
        if (m && /^home$/i.test(m[1])) value = ctx.home;
      }
    } else {
      m = /^\$\{([A-Za-z_][A-Za-z0-9_]*)\}/.exec(rest) || /^\$([A-Za-z_][A-Za-z0-9_]*)/.exec(rest);
      if (m) {
        if (m[1] === 'HOME') value = ctx.home;
        else if (!ctx.noVars && ctx.vars.has(m[1])) value = ctx.vars.get(m[1]);
      }
    }
    if (!m || value === null) return null;
    out += value;
    i += m[0].length - 1;
  }
  return out;
}

// A path's kind: { abs } for one that names its own place, { rel } for one read from the folder it runs in.
function located(text, ctx) {
  if (text.includes(':') && (!DRIVE.test(text) || text.indexOf(':', 2) !== -1)) return null;
  const t = ctx.powershell ? text.replace(/\\/g, '/') : text;
  const segments = t.split('/');
  if (segments.includes('..') || segments.slice(0, -1).some((seg) => WILDCARD.test(seg))) return null;
  if (segments.some((seg) => SHORT_NAME.test(seg))) return null;
  if ((ctx.platform === 'win32' || DRIVE.test(t)) && segments.some((seg) => seg !== '.' && /[. ]$/.test(seg))) return null;
  if (DRIVE.test(t) || t.startsWith('//')) return { abs: t };
  if (t.startsWith('/')) {
    if (ctx.platform !== 'win32') return { abs: t };
    if (ctx.powershell) return { rel: t };
    const drive = /^\/([A-Za-z])(?=\/|$)/.exec(t);
    return drive ? { abs: `${drive[1].toUpperCase()}:${t.slice(2) || '/'}` } : null;
  }
  return { rel: t };
}

const windowsForm = (p) => DRIVE.test(p) || /^[\\/]{2}/.test(p);

function libFor(ctx, ...paths) {
  return ctx.platform === 'win32' || paths.some(windowsForm) ? path.win32 : path.posix;
}

// Under POSIX rules a backslash is part of a name: such a path is never compared.
const posixBackslash = (lib, ...paths) => lib === path.posix && paths.some((p) => p.includes('\\'));

function comparable(p, lib) {
  const abs = lib.resolve(p).replace(/\\/g, '/');
  const folded = lib === path.win32 ? abs.toLowerCase() : abs;
  return folded.length > 1 && folded.endsWith('/') ? folded.slice(0, -1) : folded;
}

// True when the absolute path lies strictly inside the root and is neither the root nor its `.claude` folder.
function strictlyInside(abs, ctx) {
  if (ctx.platform !== 'win32' && windowsForm(abs) !== windowsForm(ctx.root)) return false;
  const lib = libFor(ctx, abs, ctx.root);
  if (posixBackslash(lib, abs, ctx.root)) return false;
  const target = comparable(abs, lib);
  const root = comparable(ctx.root, lib);
  if (target === root || !under(target, root)) return false;
  if (target.toLowerCase() === `${root}/.claude`.toLowerCase()) return false;
  const both = libFor(ctx, abs, ctx.homeGuard);
  if (posixBackslash(both, abs, ctx.homeGuard)) return false;
  return !under(comparable(ctx.homeGuard, both), comparable(abs, both));
}

const under = (p, dir) => p === dir || p.startsWith(dir.endsWith('/') ? dir : `${dir}/`);

function targetLifts(word, folders, ctx) {
  if (ctx.powershell && word.includes(',')) return false;
  const text = expand(word, ctx);
  if (text === null) return false;
  const where = located(text, ctx);
  if (!where) return false;
  const wild = WILDCARD.test(text.replace(/\\/g, '/').split('/').pop());
  const judge = (p) => {
    const lib = libFor(ctx, p, ctx.root);
    return strictlyInside(wild ? lib.dirname(p) : p, ctx);
  };
  if (where.abs) return judge(where.abs);
  if (folders === null) return false;
  return folders.every((folder) => judge(libFor(ctx, folder, ctx.root).resolve(folder, where.rel)));
}

// A folder change may fail or be skipped behind `&&`, so the folders before it stay possible; null when unknown.
function changedFolders(operands, folders, ctx) {
  if (folders === null || operands === null || operands.length > 1) return null;
  if (operands.length === 0) return ctx.home === null ? null : [...folders, ctx.home];
  const [word] = operands;
  if (word === '-' || WILDCARD.test(word)) return null;
  const text = expand(word, ctx);
  const where = text === null ? null : located(text, ctx);
  if (!where) return null;
  if (where.abs) return [...folders, where.abs];
  if ((ctx.indirect && !ctx.powershell) || folders.length > MAX_FOLDERS) return null;
  return [...folders, ...folders.map((folder) => libFor(ctx, folder, ctx.root).resolve(folder, where.rel))];
}

function operandsOf(words) {
  const out = [];
  let options = true;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (options && w === '--') { options = false; continue; }
    if (options && w.startsWith('-') && w !== '-') continue;
    if (REDIRECT.test(w)) { if (BARE_REDIRECT.test(w)) i++; continue; }
    out.push(w);
  }
  return out;
}

const psSwitch = (name) => PS_SWITCH_ALIASES.has(name)
  || PS_SWITCHES.some(([full, min]) => name.length >= min && full.startsWith(name));

// A PowerShell statement's path words, or null where a parameter other than the known ones, a splat or a bound
// value could carry a target the list never shows.
function psOperandsOf(words) {
  const out = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (w.startsWith('@')) return null;
    if (!/^-./.test(w)) {
      if (REDIRECT.test(w)) { if (BARE_REDIRECT.test(w)) i++; continue; }
      out.push(w);
      continue;
    }
    const m = /^-([A-Za-z]+)(?::(.*))?$/.exec(w);
    if (!m) return null;
    const name = m[1].toLowerCase();
    const bound = m[2];
    if (psSwitch(name)) {
      if (bound !== undefined && !/^\$(true|false)$/i.test(bound)) return null;
    } else if (PS_PATH_PARAMS.has(name) && bound === undefined && i + 1 < words.length) {
      out.push(words[++i]);
    } else if (PS_ERROR_ACTION.has(name)) {
      if (!PS_PREFERENCE.test(bound !== undefined ? bound : (words[++i] || ''))) return null;
    } else return null;
  }
  return out;
}

const inlineScript = (exe, rest) => {
  if (exe === 'node' || exe === 'nodejs' || exe === 'bun') {
    if (rest.some((w) => /^-[a-z]*[ep]/.test(w) || /^--(eval|print)(=|$)/.test(w))) return true;
  } else if (exe === 'deno') {
    if (rest[0] === 'eval' || rest.some((w) => /^--eval(=|$)/.test(w))) return true;
  } else if (/^py(thon)?[0-9.]*$/.test(exe)) {
    if (rest.some((w) => /^-[a-z]*c/.test(w))) return true;
  } else if (exe === 'perl' || exe === 'ruby') {
    if (rest.some((w) => /^-[a-z]*e/.test(w))) return true;
  } else if (exe === 'php') {
    if (rest.some((w) => /^-[a-z]*r/.test(w) || /^--run(=|$)/.test(w))) return true;
  } else return false;
  return rest.length === 0 || rest[0].startsWith('-') || rest.includes('-');
};

// A command's executable with its quotes off and any redirect glued to it cut away.
const exeOf = (word) => exeName(String(word).split(/[<>]/)[0]);

function unreadForms(command, cut, ctx) {
  if (/\brimraf\b/i.test(command)) return true;
  if (ctx.powershell && /\bdelete\b/i.test(command)) return true;
  for (const words of statements(command)) {
    const at = words.findIndex((w) => exeOf(w) === 'env');
    if (at >= 0 && words.slice(at + 1).some((w) => ENV_SPLIT.test(w))) return true;
  }
  for (const piece of cut) {
    for (const words of commandsOf(piece.text)) {
      if (REDIRECT.test(words[0])) return true;
      if (INTERPRETER.test(exeOf(words[0])) && (piece.before === '|' || words.some((w) => w.includes('<')))) return true;
    }
  }
  for (const words of commandsOf(command)) {
    const exe = exeOf(words[0]);
    const rest = words.slice(1).map((w) => w.toLowerCase());
    if (LAUNCHERS.has(exe)) return true;
    if (exe === 'find' && rest.includes('-delete')) return true;
    if (exe === 'git' && rest.includes('clean')) return true;
    if (exe === 'shred' || exe === 'unlink' || exe === 'erase' || exe === 'clear-content' || exe === 'clc') return true;
    if (exe === 'rsync' && rest.some((w) => /^--(del|remove-source)/.test(w))) return true;
    if ((exe === 'rd' || exe === 'rmdir' || exe === 'del') && rest.includes('/s')) return true;
    if (exe === 'robocopy' && (rest.includes('/mir') || rest.includes('/purge'))) return true;
    if (inlineScript(exe, rest)) return true;
  }
  return false;
}

// A root that is a drive or filesystem root, or the home folder itself, holds the folders today's check protects.
function wideRoot(root, home, platform) {
  const lib = libFor({ platform }, root);
  if (posixBackslash(lib, root)) return true;
  const resolved = lib.resolve(root);
  if (lib.dirname(resolved) === resolved) return true;
  const both = libFor({ platform }, home, root);
  if (posixBackslash(both, home, root)) return true;
  return comparable(home, both) === comparable(root, both);
}

function liftable(command, place) {
  try { return judged(command, place); } catch { return false; }
}

function judged(command, place) {
  if (typeof command !== 'string' || !place || typeof place.root !== 'string' || place.root === '') return false;
  const home = place.home;
  if (typeof home !== 'string' || home === '') return false;
  if (wideRoot(place.root, home, place.platform)) return false;
  const powershell = place.tool === 'PowerShell';
  if (powershell && (command.includes('`') || command.includes('\\"') || /@["']/.test(command))) return false;
  if (!powershell && (/\\\r?\n/.test(command) || SUBSCRIPTED.test(command))) return false;
  if (UNREAD_FOLDER_WORDS.test(command) || SPECIAL_WRITE.test(command)) return false;
  if (/(^|[\s;&|])(declare|typeset|local)\s/.test(command)) return false;
  let writes = false;
  let indirect = false;
  for (const words of commandsOf(command)) {
    const exe = exeOf(words[0]);
    if (SCOPE_WRITERS.has(exe) || UNREAD_FOLDER_EXES.has(exe) || exe === 'let') return false;
    if (!WRITER_EXES.has(exe)) continue;
    const args = words.slice(1);
    if (exe === 'printf' && !args.some((w) => w.startsWith('-v'))) continue;
    if (args.some((w) => SPECIAL_NAMED.test(w))) return false;
    writes = true;
    if (args.some((w) => w.split('=')[0].includes('$'))) indirect = true;
  }
  const renamesHome = powershell && /\$env:USERPROFILE\s*=/i.test(command);
  const noVars = writes || VAR_WRITERS.test(command) || (powershell && PS_VAR_WRITERS.test(command));
  const slashed = powershell || !(place.platform === 'win32' || windowsForm(home)) ? home : home.replace(/\\/g, '/');
  const ctx = {
    powershell,
    platform: place.platform,
    root: place.root,
    home: renamesHome || noVars ? null : slashed,
    homeGuard: home,
    noVars,
    indirect,
    vars: new Map(),
  };
  const cut = pieces(command);
  if (!cut) return false;
  let folders = [typeof place.cwd === 'string' && place.cwd !== '' ? place.cwd : place.root];
  let deletes = 0;
  let changes = 0;
  for (const piece of cut) {
    const found = statements(piece.text);
    if (found.length > 1) return false;
    if (found.length === 0) continue;
    const words = found[0];
    const piped = piece.before === '|' || piece.after === '|';
    let at = 0;
    while (at < words.length && ASSIGNMENT.test(words[at])) at++;
    if ([words[0], words[at]].some((w) => w !== undefined && CONTROL_WORDS.has(w.toLowerCase()))) return false;
    if (at === words.length) {
      const plain = !powershell && !piped && !piece.literal && ['start', ';', '\n'].includes(piece.before);
      for (const w of words) {
        const [, name] = ASSIGNMENT.exec(w);
        const value = plain && !ctx.vars.has(name) ? expand(w.slice(name.length + 1), ctx) : null;
        ctx.vars.set(name, value !== null && /\s/.test(value) ? null : value);
      }
      continue;
    }
    const exe = exeName(words[at]);
    const rest = words.slice(at + 1);
    if (exe === 'source' || exe === '.') return false;
    const deleting = DELETES.has(exe);
    if (!deleting && !FOLDER_CHANGES.has(exe)) {
      for (const w of words) {
        const named = ASSIGNMENT.exec(w) || /^([A-Za-z_][A-Za-z0-9_]*)(\+=|\[)/.exec(w);
        if (named) ctx.vars.set(named[1], null);
        else if (NAME.test(w) && ctx.vars.has(w)) ctx.vars.set(w, null);
      }
      continue;
    }
    if (piece.literal || piece.quotedAngle) return false;
    const operands = powershell ? psOperandsOf(rest) : operandsOf(rest);
    if (deleting) {
      deletes++;
      if (!powershell && exe === 'rmdir' && rest.some((w) => /^-[a-z]*p/i.test(w) || /^--p/i.test(w))) return false;
      if (!operands || operands.length === 0 || !operands.every((t) => targetLifts(t, folders, ctx))) return false;
      continue;
    }
    if (piped) return false;
    changes++;
    folders = changedFolders(operands, folders, ctx);
  }
  if (deletes === 0) return false;
  if ((command.match(DELETE_WORDS) || []).length !== deletes) return false;
  if ((command.match(FOLDER_WORDS) || []).length !== changes) return false;
  return !unreadForms(command, cut, ctx);
}

module.exports = { liftable };
