'use strict';
/**
 * The here-documents of a command, read apart from the lines it runs, for test-entry-gate.js.
 *
 * `readHeredocs(command)` returns the command's logical lines with every here-document body taken out (`lines` — a
 * line ending in a continuing `\` or PowerShell backtick is joined to the next), the bodies (`bodies`), each with the
 * line its `<<` operator stands on (`line`, `at` its index in `lines`), and the PowerShell here-strings
 * (`hereStrings`, each `{ at, body }`). An operator is `<<WORD`, `<<-WORD` (leading tabs stripped from the closing
 * line), the word plain, quoted or escaped; it is read outside quotes or inside a `$(…)` (a double-quoted one
 * included), never inside `$((…))`, and before a `#` comment, and a line may carry several, whose bodies follow in
 * order. A body runs to the line that is its word alone, or to the end of the command. `<<<` is a here-string — one
 * word — and opens no body.
 *
 * A PowerShell here-string — a line ending in `@'` or `@"` through the line that opens with `'@` or `"@` — becomes
 * the one word `here-string` in its line, so its text is never read as lines; its text is kept in `hereStrings` for
 * the reader to place by what consumes it.
 */

const HERE_STRING_WORD = 'here-string';

function replaceHereStrings(text) {
  const lines = String(text).split('\n');
  const out = [];
  const strings = [];
  for (let i = 0; i < lines.length; i++) {
    const open = /^(.*?)@(['"])\s*\r?$/.exec(lines[i]);
    if (open) {
      const close = lines.findIndex((l, j) => j > i && l.startsWith(`${open[2]}@`));
      if (close > i) {
        strings.push({ at: out.length, body: lines.slice(i + 1, close).join('\n') });
        out.push(`${open[1]}${HERE_STRING_WORD}${lines[close].slice(2)}`);
        i = close;
        continue;
      }
    }
    out.push(lines[i]);
  }
  return { all: out, strings };
}

// A line that goes on into the next: an odd run of backslashes, or a PowerShell backtick, at its end.
function continues(line) {
  const s = line.replace(/\r$/, '');
  const tail = /\\+$/.exec(s);
  return (tail && tail[0].length % 2 === 1) || s.endsWith('`');
}

// A `$(` opens a command substitution, inside double quotes too, where operators are read again; `$((` opens
// arithmetic, where `<<` is a shift.
function substitution(line, i, stack) {
  if (line[i] !== '$' || line[i + 1] !== '(') return i;
  const arithmetic = line[i + 2] === '(';
  stack.push(arithmetic ? '$((' : '$(');
  return i + (arithmetic ? 2 : 1);
}

function operators(line) {
  const ops = [];
  const stack = [];
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const top = stack[stack.length - 1];
    if (top === "'") { if (ch === "'") stack.pop(); continue; }
    if (top === '"') {
      if (ch === '\\') i++;
      else if (ch === '"') stack.pop();
      else i = substitution(line, i, stack);
      continue;
    }
    if (top === '$((') { if (ch === ')' && line[i + 1] === ')') { stack.pop(); i++; } continue; }
    if (ch === "'" || ch === '"') { stack.push(ch); continue; }
    if (ch === '\\') { i++; continue; }
    if (ch === '$' && line[i + 1] === '(') { i = substitution(line, i, stack); continue; }
    if (ch === ')' && top === '$(') { stack.pop(); continue; }
    if (ch === '#' && (i === 0 || /\s/.test(line[i - 1]))) break;
    if (ch !== '<' || line[i + 1] !== '<') continue;
    if (line[i + 2] === '<') { i += 2; continue; }
    let j = i + 2;
    const strip = line[j] === '-';
    if (strip) j++;
    while (line[j] === ' ' || line[j] === '\t') j++;
    const word = /^(?:'([^']*)'|"([^"]*)"|\\?([A-Za-z0-9_.-]+))/.exec(line.slice(j));
    if (!word) continue;
    ops.push({ delimiter: word[1] ?? word[2] ?? word[3], strip });
    i = j + word[0].length - 1;
  }
  return ops;
}

function readHeredocs(command) {
  const { all, strings } = replaceHereStrings(command);
  const lines = [];
  const bodies = [];
  const hereStrings = [];
  for (let i = 0; i < all.length; i++) {
    const from = i;
    let line = all[i];
    while (continues(line) && i + 1 < all.length) line = `${line.replace(/\r$/, '').slice(0, -1)} ${all[++i]}`;
    for (const s of strings) if (s.at >= from && s.at <= i) hereStrings.push({ at: lines.length, body: s.body });
    lines.push(line);
    for (const op of operators(line.replace(/\r$/, ''))) {
      const body = [];
      for (i++; i < all.length; i++) {
        const l = all[i].replace(/\r$/, '');
        if ((op.strip ? l.replace(/^\t+/, '') : l) === op.delimiter) break;
        body.push(all[i]);
      }
      bodies.push({ line, at: lines.length - 1, body: body.join('\n') });
    }
  }
  return { lines, bodies, hereStrings };
}

module.exports = { readHeredocs, HERE_STRING_WORD };
