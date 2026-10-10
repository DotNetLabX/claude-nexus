'use strict';
/**
 * Resolve the `replyStyle` switch out of a project's .claude/nexus-agents.json.
 *
 * `replyStyle` is the FIRST key in that file a hook reads — every other key is agent-read, resolved
 * by a model at pre-flight. That difference is the whole reason this module exists: a hook runs
 * unattended at session start, so every failure mode has to have a defined, silent answer instead
 * of a judgment call. There are exactly two values (`on` | `off`), matched case-insensitively with
 * surrounding whitespace ignored; a committed team setting, the same posture as `model` /
 * `modelRanking`.
 *
 * FAIL OPEN, ALWAYS. Only a string whose trimmed lower-cased value is `off` turns the envelope off.
 * A missing file, a missing key, a non-string value, an unrecognised string, an unreadable file and
 * unparseable JSON ALL resolve to `on` — a broken config must never cost a session its rules, and
 * it must never crash the hook. This function does not throw; callers rely on that instead of
 * wrapping it.
 *
 * WHY `source` IS PART OF THE CONTRACT. The emitter injects NO disclosure for a bad value — a
 * stderr nag or a context line every session for one typo is noise. So the ONLY feedback channel a
 * user has is the /nexus:style report, and that report is only useful if it can say WHICH failure
 * happened: `off` typed as `maybe` and `off` in a file the process cannot read look identical from
 * the state alone. `raw` carries the offending value back for the same reason, and `error` carries
 * the parse failure — which is also what makes the command refuse a textual splice into JSON it
 * could not parse, rather than writing a partial.
 *
 * `path` is returned because every command output path discloses the file it resolved: a session
 * started in a repo SUBDIRECTORY keys its config there and not at the git root (probed), and a
 * silent mismatch between where the user thinks the repo is and where the session started is the
 * one confusing failure this switch can produce.
 */
const fs = require('fs');
const path = require('path');

const CONFIG_REL = ['.claude', 'nexus-agents.json'];

/**
 * @param {string} projectDir - the directory the session opened in.
 * @returns {{state:'on'|'off', source:'key'|'file-absent'|'key-absent'|'unrecognised'|'unreadable',
 *            raw:*, path:string, error:string|undefined}}
 */
function resolveReplyStyle(projectDir) {
  const dir = typeof projectDir === 'string' && projectDir ? projectDir : process.cwd();
  const configPath = path.join(dir, ...CONFIG_REL);
  const result = (state, source, extra) => ({ state, source, raw: undefined, path: configPath, ...extra });

  let text;
  try {
    text = fs.readFileSync(configPath, 'utf8');
  } catch (e) {
    // ENOENT is the ordinary case — no config file at all — and is reported separately from a file
    // that exists but cannot be read (a permissions problem, or a directory wearing the name),
    // because the two have different fixes and the report names them differently.
    if (e && e.code === 'ENOENT') return result('on', 'file-absent');
    return result('on', 'unreadable', { error: String((e && e.message) || e) });
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return result('on', 'unreadable', { error: String((e && e.message) || e) });
  }

  // A valid JSON document that is not a plain object (null, an array, a bare string) has no
  // top-level key to read — `parsed.replyStyle` on null would throw, which is the one thing this
  // function may not do.
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return result('on', 'key-absent');
  }
  if (!Object.prototype.hasOwnProperty.call(parsed, 'replyStyle')) {
    return result('on', 'key-absent');
  }

  const raw = parsed.replyStyle;
  // Non-string FIRST: `false` would slip past a loose comparison, and `null` would throw on
  // .trim(). Both are unrecognised, and the report quotes them back as such.
  if (typeof raw !== 'string') return result('on', 'unrecognised', { raw });

  const canonical = raw.trim().toLowerCase();
  if (canonical === 'off') return result('off', 'key', { raw });
  if (canonical === 'on') return result('on', 'key', { raw });
  return result('on', 'unrecognised', { raw });
}

module.exports = { resolveReplyStyle, CONFIG_REL };
