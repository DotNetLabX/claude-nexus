'use strict';
/**
 * A command line read as the commands it runs, for the hooks that judge a command by what it executes,
 * never by what it names: guard.js (a reviewer's in-place edits) and test-entry-gate.js (the mutation runner).
 *
 * `statements` splits a line at `; & | ( ) { }` and newlines outside quotes, into lists of words with their
 * quotes taken off. A `#` that opens a word outside quotes comments out the rest of its line. A backslash
 * outside quotes stays literal, so a Windows path stays whole; inside double quotes it escapes only `"` and `\`.
 *
 * `commandsOf` returns every command a line runs, each from its executable on, past its assignments and
 * launchers (`sudo`, `env`, `timeout 5`, `xargs -n 1`, …). It reads the same way, up to four levels deep, a
 * `$(…)` or backtick body (inside double quotes too), a `bash -c` / `sh -c` string, `cmd /c`, `pwsh -c` /
 * `-Command`, `eval` and each `find -exec` clause.
 *
 * `exeName` is a word's file name, lower-cased, `.exe` dropped.
 *
 * Not read: a `$(…)` body ends at the first `)` that closes it, quotes inside it not counted, so a quoted `)`
 * ends it early; `env -S` text is a value, never a command.
 */

// Words that run the command after them, each with the options that take a value.
const LAUNCHERS = new Map([
  ['sudo', ['-u', '-g', '-h', '-p']], ['doas', ['-u']], ['env', ['-u', '-C', '-S']], ['command', []], ['builtin', []],
  ['nice', ['-n']], ['ionice', ['-c', '-n']], ['nohup', []], ['time', []], ['exec', ['-a']], ['stdbuf', []],
  ['xargs', ['-I', '-n', '-L', '-P', '-s', '-d', '-a', '-E']], ['timeout', ['-s', '-k', '--signal', '--kill-after']],
  ['do', []], ['then', []], ['else', []], ['elif', []], ['!', []],
]);
const MAX_DEPTH = 4;

const exeName = (w) => String(w).replace(/^.*[/\\]/, '').replace(/\.exe$/i, '').toLowerCase();

function substitutions(s) {
  const out = [];
  let quote = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quote === "'") { if (ch === "'") quote = ''; continue; }
    if (ch === "'" && !quote) { quote = ch; continue; }
    if (ch === '"') { quote = quote ? '' : '"'; continue; }
    if (ch === '`') {
      const end = s.indexOf('`', i + 1);
      out.push(s.slice(i + 1, end < 0 ? s.length : end));
      if (end < 0) break;
      i = end;
    } else if (ch === '$' && s[i + 1] === '(') {
      let depth = 1;
      let j = i + 2;
      for (; j < s.length && depth; j++) depth += s[j] === '(' ? 1 : s[j] === ')' ? -1 : 0;
      out.push(s.slice(i + 2, depth ? j : j - 1));
      i = j - 1;
    }
  }
  return out;
}

function statements(command) {
  const s = String(command).replace(/\\\r?\n/g, ' ');
  const out = [];
  let words = [];
  let word = null;
  let quote = '';
  const endWord = () => { if (word !== null) words.push(word); word = null; };
  const endCommand = () => { endWord(); if (words.length) out.push(words); words = []; };
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quote === "'") { if (ch === "'") quote = ''; else word += ch; continue; }
    if (quote === '"') {
      if (ch === '"') quote = '';
      else if (ch === '\\' && (s[i + 1] === '"' || s[i + 1] === '\\')) word += s[++i];
      else word += ch;
      continue;
    }
    if (ch === '#' && word === null) {
      while (i + 1 < s.length && s[i + 1] !== '\n' && s[i + 1] !== '\r') i++;
      continue;
    }
    if (ch === "'" || ch === '"') { quote = ch; word = word ?? ''; continue; }
    if (';&|\n\r(){}'.includes(ch)) { endCommand(); continue; }
    if (/\s/.test(ch)) { endWord(); continue; }
    word = (word ?? '') + ch;
  }
  endCommand();
  return out;
}

// The index of the executable: past assignments, launchers and their options.
function launched(words) {
  let i = 0;
  for (;;) {
    const w = words[i];
    if (w === undefined) return i;
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(w)) { i++; continue; }
    const name = exeName(w);
    const valued = LAUNCHERS.get(name);
    if (!valued) return i;
    for (i++; i < words.length && /^[-+]./.test(words[i]); i++) if (valued.includes(words[i])) i++;
    if (name === 'timeout' && /^\d/.test(words[i] || '')) i++;
  }
}

function expand(words, depth) {
  const cmd = words.slice(launched(words));
  if (!cmd.length) return [];
  const out = [cmd];
  if (depth >= MAX_DEPTH) return out;
  const exe = exeName(cmd[0]);
  const rest = cmd.slice(1);
  const nested = (text) => out.push(...commandsOf(text, depth + 1));
  if (/^(ba|z|da|k)?sh$/.test(exe)) {
    const at = rest.findIndex((x) => /^-[a-z]*c[a-z]*$/.test(x));
    if (at >= 0 && rest[at + 1] !== undefined) nested(rest[at + 1]);
  } else if (exe === 'cmd') {
    if (rest.some((x) => /^\/[ck]$/i.test(x))) nested(rest.filter((x) => !/^\/[a-z]$/i.test(x)).join(' '));
  } else if (exe === 'pwsh' || exe === 'powershell') {
    const at = rest.findIndex((x) => /^-c(o(m(m(a(n(d)?)?)?)?)?)?$/i.test(x));
    if (at >= 0) nested(rest.slice(at + 1).join(' '));
  } else if (exe === 'eval') {
    nested(rest.join(' '));
  } else if (exe === 'find') {
    rest.forEach((x, at) => { if (/^-(exec|execdir|ok|okdir)$/.test(x)) out.push(...expand(rest.slice(at + 1), depth + 1)); });
  }
  return out;
}

function commandsOf(text, depth = 0) {
  const s = String(text);
  const out = statements(s).flatMap((words) => expand(words, depth));
  if (depth < MAX_DEPTH) for (const body of substitutions(s)) out.push(...commandsOf(body, depth + 1));
  return out;
}

module.exports = { exeName, statements, commandsOf };
