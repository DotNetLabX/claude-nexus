'use strict';

/**
 * A spec's `## Parts` list and the part folders made from it.
 *
 *   makeParts(repo, specRel[, { beforeWrite, now }]) -> { ok: true, spec, list, parts, written, unchanged, lockTakenOver }
 *                                                     | { ok: false, refusals: [reason, ...] }
 *   checkPart(repo, partRel)        -> { state: 'ready' | 'stale' | 'waiting' | 'error', waits, reason }
 *   specFolder(repo, slug)          -> the absolute folder of a slug one to three levels under docs/specs, or null
 *   partsFinished(repo, commit, rel[, io])-> { done: true } | { open: [slug, ...] } | null (no list at the commit)
 *   featureFinished(repo, commit, rel[, io]) -> true where the feature's summary, or every listed part's, is at the commit
 *   staleSourceAt(repo, commit, file[, at]) -> null, or why the pointer read at `at` no longer matches its list at `commit`
 *   waitsOf(text, ownSlug, ref)     -> { parts: [slug], features: [slug] } the part `ref` of the list waits for, or null
 *   parseParts(text) / renderPointer(p) / parsePointer(text) / isUntouched(text) / partSlug(parentId, part)
 *
 * The list's file is the definition `sdd-read.js` resolves for the spec's folder; a part's folder sits beside
 * the spec's own `definition/` and holds one generated pointer, `definition/spec.md`. `repo` is the absolute
 * repository root; every other path is repository-relative with `/`.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { isSafeId } = require('./safe-id');

const SPECS = 'docs/specs';
const MAX_DEPTH = 3;
const DEEPEST = 'a part inside a story inside an epic';
const LOCK = '.parts.lock';
const CLAIM = '.takeover';
const LOCK_MAX_AGE_MS = 10 * 60 * 1000;
const TITLE_WORDS = 4;
const NOT_SPEC = new Set(['definition', 'delivery', 'sdd']);
// Records the pipeline itself writes into a definition folder while it plans a feature.
const PIPELINE_RECORDS = new Set(['ideas.md', 'spec-rules.md']);

const MARKER_HEAD = '**Generated:** by nexus parts from ';
const MARKER_TAIL = " — change the parent's ## Parts list and run the command again, never this file";
const PART_HEAD = /^### (Story|Task) ([A-Za-z0-9.]+):\s*(.+?)\s*$/;
const LOOSE_HEAD = /^### (Story|Task)\b/i;
const FIELD = /^\*\*(Covers|Waits for):\*\*\s*(.*?)\s*$/i;
const PART_REF = /^(story|task)\s+([A-Za-z0-9.]+)$/i;
const STATUS_LINE = /^(?:\*\*)?Status(?:\*\*)?:(?:\*\*)?\s*(.*)$/;
const PARENT_ID = [/^([FB]\d+)-/, /^([A-Z][A-Z0-9_]*-\d+)(?:-|$)/];

const lf = (text) => String(text).replace(/\r\n/g, '\n');
const abs = (repo, rel) => path.join(repo, ...rel.split('/'));
const readRel = (repo, rel) => { try { return fs.readFileSync(abs(repo, rel), 'utf8'); } catch { return null; } };
const relOf = (repo, file) => path.relative(repo, file).split(path.sep).join('/');
const isDir = (p) => { try { return fs.statSync(p).isDirectory(); } catch { return false; } };
const refused = (...reasons) => ({ ok: false, refusals: reasons });
const isSegment = (s) => /^[A-Za-z0-9._-]+$/.test(s) && !/^\.+$/.test(s);

function git(repo, args, input) {
  const res = spawnSync('git', args, { cwd: repo, encoding: 'utf8', windowsHide: true, maxBuffer: 64 * 1024 * 1024, ...(input === undefined ? {} : { input }) });
  return { status: res.status, stdout: res.stdout || '', stderr: res.stderr || '' };
}
const blobAt = (repo, commit, rel) => { const r = git(repo, ['rev-parse', '--verify', '--quiet', `${commit}:${rel}`]); return r.status === 0 ? r.stdout.trim() : null; };
const existsAt = (repo, commit, rel) => git(repo, ['cat-file', '-e', `${commit}:${rel}`]).status === 0;
const readAt = (repo, commit, rel) => { const r = git(repo, ['show', `${commit}:${rel}`]); return r.status === 0 ? r.stdout : null; };

function statusOf(text) {
  for (const line of lf(text).split('\n')) {
    const m = STATUS_LINE.exec(line);
    if (m) return m[1].trim();
  }
  return null;
}

// ── the list ─────────────────────────────────────────────────────────────────
function partsSection(text) {
  const lines = lf(text).split('\n');
  let fenced = false;
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*```/.test(lines[i])) fenced = !fenced;
    else if (!fenced && /^## Parts\s*$/.test(lines[i])) { start = i + 1; break; }
  }
  if (start < 0) return null;
  const out = [];
  fenced = false;
  for (let i = start; i < lines.length; i++) {
    if (/^\s*```/.test(lines[i])) { fenced = !fenced; continue; }
    if (fenced) continue;
    if (/^## /.test(lines[i])) break;
    out.push(lines[i]);
  }
  return out;
}

const hasPartsList = (text) => partsSection(text) !== null;

/** The parts of a `## Parts` list in order — `{ kind, id, ref, title, covers, waitsFor }` — or null with no list. */
function parseParts(text) {
  const lines = partsSection(text);
  if (lines === null) return null;
  const parts = [];
  let cur = null;
  for (const line of lines) {
    const head = PART_HEAD.exec(line);
    if (head) {
      cur = { kind: head[1], id: head[2], ref: `${head[1]} ${head[2]}`, title: head[3], covers: null, waitsFor: null };
      parts.push(cur);
      continue;
    }
    if (/^#{1,3} /.test(line)) { cur = null; continue; }
    const field = cur && FIELD.exec(line);
    if (!field) continue;
    if (field[1].toLowerCase() === 'covers') cur.covers = field[2];
    else cur.waitsFor = field[2].split(',').map((s) => s.trim().replace(/\s+/g, ' ')).filter(Boolean);
  }
  return parts;
}

function parentId(slug) {
  for (const re of PARENT_ID) {
    const m = re.exec(slug);
    if (m) return m[1];
  }
  return null;
}

function partSlug(parent, part) {
  const words = part.title.split(/[^A-Za-z0-9]+/).filter(Boolean).slice(0, TITLE_WORDS);
  const title = words.map((w) => w[0].toUpperCase() + w.slice(1)).join('');
  return [parent, `${part.kind === 'Story' ? 'S' : 'T'}${part.id.replace(/\./g, '-')}`, ...(title ? [title] : [])].join('-');
}

// ── the pointer ──────────────────────────────────────────────────────────────
const digestOf = (body) => crypto.createHash('sha256').update(body).digest('hex').slice(0, 16);

/** A part's definition: Ready, marked generated, naming its list file, its part and that file's blob id. */
function renderPointer({ list, part, listHash, parent }) {
  const body = [
    `# ${part} — a part of ${parent}`,
    '',
    '**Status:** Ready',
    `${MARKER_HEAD}${list}${MARKER_TAIL}`,
    `**Part:** ${part}`,
    `**List hash:** ${listHash}`,
  ].join('\n');
  return `${body}\n**Digest:** ${digestOf(`${body}\n`)}\n`;
}

/** The fields of a generated pointer — `{ list, part, listHash, parent }` — or null for any other text. */
function parsePointer(text) {
  const lines = lf(text).split('\n');
  const marker = lines.find((l) => l.startsWith(MARKER_HEAD) && l.endsWith(MARKER_TAIL));
  if (!marker) return null;
  const field = (label) => { const l = lines.find((x) => x.startsWith(`**${label}:** `)); return l ? l.slice(label.length + 6).trim() : null; };
  const title = /^# (.+) — a part of (.+)$/.exec(lines[0] || '');
  const out = { list: marker.slice(MARKER_HEAD.length, marker.length - MARKER_TAIL.length), part: field('Part'), listHash: field('List hash'), parent: title ? title[2] : null };
  return out.part && out.listHash && out.parent ? out : null;
}

/** Whether the text is exactly what the command writes from its own fields, digest included. */
function isUntouched(text) {
  const p = parsePointer(text);
  return p !== null && lf(text) === renderPointer(p);
}

// ── where things are ─────────────────────────────────────────────────────────
function subFolders(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !NOT_SPEC.has(e.name) && !e.name.startsWith('.'))
      .map((e) => e.name);
  } catch { return []; }
}

/** The folder of a slug one, two or three levels under docs/specs (`{epic}/{story}` also taken whole), the shallowest first. */
function specFolder(repo, slug) {
  const parts = String(slug || '').split('/');
  if (!parts.length || parts.length > MAX_DEPTH || !parts.every(isSegment)) return null;
  const specs = path.join(repo, ...SPECS.split('/'));
  const direct = path.join(specs, ...parts);
  if (isDir(direct)) return direct;
  if (parts.length > 1) return null;
  const firsts = subFolders(specs);
  for (const a of firsts) if (isDir(path.join(specs, a, slug))) return path.join(specs, a, slug);
  for (const a of firsts) {
    for (const b of subFolders(path.join(specs, a))) {
      if (isDir(path.join(specs, a, b, slug))) return path.join(specs, a, b, slug);
    }
  }
  return null;
}

// The list's file for a spec folder, or a refusal.
function listFile(repo, specRel) {
  const folder = abs(repo, specRel);
  const sdd = path.join(folder, 'sdd');
  if (isDir(sdd)) {
    const local = path.join(sdd, 'definition', 'spec.md');
    if (!fs.existsSync(local)) {
      return fs.existsSync(path.join(sdd, 'upstream.md'))
        ? { error: `${specRel}/sdd holds a pinned SDD spec from another repository, which is not committed here: the parts command reads a list only in this repository.` }
        : { error: `${specRel}/sdd holds no spec (sdd/definition/spec.md), so there is no list to read.` };
    }
  }
  // Required here, not at load: a hook that loads this library for specFolder alone runs without sdd-read beside it.
  const { resolveFeature } = require('../sdd-read');
  const resolved = resolveFeature(folder);
  if (resolved.error || !resolved.spec) return { error: resolved.error || `${specRel} has no definition (definition/spec.md, bug.md or epic.md).` };
  if (resolved.devSpec) {
    const dev = fs.readFileSync(resolved.devSpec, 'utf8');
    if (hasPartsList(dev)) return { error: `${relOf(repo, resolved.devSpec)} carries a ## Parts list beside the feature's SDD spec: move it into the SDD spec (${relOf(repo, resolved.spec)}), the one file the list is read from.` };
  }
  return { rel: relOf(repo, resolved.spec) };
}

// ── the lock ─────────────────────────────────────────────────────────────────
const ageOf = (file, now) => { try { return now - fs.statSync(file).mtimeMs; } catch { return null; } };

function takeLock(repo, specRel, now) {
  const file = abs(repo, `${specRel}/${LOCK}`);
  const token = `${process.pid}-${crypto.randomBytes(6).toString('hex')}`;
  const body = `${JSON.stringify({ token, at: new Date(now).toISOString() })}\n`;
  const create = (at) => { try { fs.writeFileSync(at, body, { flag: 'wx' }); return null; } catch (e) { return e; } };
  const couldNot = (e) => ({ error: `the lock ${specRel}/${LOCK} could not be made: ${e.message}` });
  const held = { error: `another run of the command holds ${specRel}/${LOCK}: wait for it to end, then run again.` };
  const made = create(file);
  if (!made) return { file, token, takenOver: false };
  if (made.code !== 'EEXIST') return couldNot(made);
  const age = ageOf(file, now);
  if (age !== null && age <= LOCK_MAX_AGE_MS) return held;
  // Two runs that both found the lock stale must not both remove it: the takeover runs under a claim of
  // its own, and the lock's age is read again under it.
  const claim = `${file}${CLAIM}`;
  const claimed = create(claim);
  if (claimed) {
    if (claimed.code !== 'EEXIST') return couldNot(claimed);
    const claimAge = ageOf(claim, now);
    if (claimAge !== null && claimAge > LOCK_MAX_AGE_MS) clearStaleClaim(claim, token, now);
    return { error: `another run of the command is taking over the stale ${specRel}/${LOCK}: wait for it to end, then run again.` };
  }
  try {
    const stale = ageOf(file, now);
    if (stale !== null && stale <= LOCK_MAX_AGE_MS) return held;
    if (stale !== null) { try { fs.unlinkSync(file); } catch { /* its run ended meanwhile */ } }
    const again = create(file);
    if (again) return again.code === 'EEXIST' ? { error: `another run of the command took ${specRel}/${LOCK} first: wait for it to end, then run again.` } : couldNot(again);
    return { file, token, takenOver: stale !== null };
  } finally {
    dropLock({ file: claim, token });
  }
}

// The claim at the path may have been replaced since its age was read, so the file is moved aside first and
// judged as moved: a stale one is removed, a fresh one — another run's — is put back.
function clearStaleClaim(claim, token, now) {
  const aside = `${claim}.${token}`;
  try { fs.renameSync(claim, aside); } catch { return; }
  const age = ageOf(aside, now);
  if (age === null || age <= LOCK_MAX_AGE_MS) {
    try { fs.writeFileSync(claim, fs.readFileSync(aside), { flag: 'wx' }); } catch { /* a newer claim stands */ }
  }
  try { fs.unlinkSync(aside); } catch { /* already gone */ }
}

function dropLock(lock) {
  try { if (fs.readFileSync(lock.file, 'utf8').includes(`"${lock.token}"`)) fs.unlinkSync(lock.file); } catch { /* already gone */ }
}

// ── waits ────────────────────────────────────────────────────────────────────
function findCycle(order, waits) {
  const state = new Map();
  const trail = [];
  const visit = (slug) => {
    state.set(slug, 'open');
    trail.push(slug);
    for (const base of waits.get(slug) || []) {
      if (!waits.has(base)) continue;
      if (state.get(base) === 'open') return trail.slice(trail.indexOf(base));
      if (!state.has(base)) { const found = visit(base); if (found) return found; }
    }
    trail.pop();
    state.set(slug, 'done');
    return null;
  };
  for (const slug of order) {
    if (state.has(slug)) continue;
    const found = visit(slug);
    if (found) return found;
  }
  return null;
}

// What one `**Waits for:**` value names: null for none, `{ part: slug }`, `{ unknown: true }` for a part id
// the list lacks, or `{ feature: slug }`.
function waitTarget(target, byRef, slugs, listed) {
  if (/^none$/i.test(target)) return null;
  const ref = PART_REF.exec(target);
  if (ref) {
    const t = byRef.get(`${ref[1]} ${ref[2]}`.toLowerCase());
    return t ? { part: slugs.get(t) } : { unknown: true };
  }
  return listed.has(target) ? { part: target } : { feature: target };
}

function indexOf(parts, parent) {
  const byRef = new Map();
  for (const p of parts) if (!byRef.has(p.ref.toLowerCase())) byRef.set(p.ref.toLowerCase(), p);
  const slugs = new Map(parts.map((p) => [p, partSlug(parent, p)]));
  return { byRef, slugs, listed: new Set(slugs.values()) };
}

/**
 * What the part `ref` of a list waits for, read from the list's text alone: `{ parts: [slug], features: [slug] }`,
 * or null where the list or the part is not there. `own` is the slug of the spec holding the list.
 */
function waitsOf(text, own, ref) {
  const parts = parseParts(text);
  const parent = parentId(own);
  if (!parts || !parent) return null;
  const { byRef, slugs, listed } = indexOf(parts, parent);
  const entry = byRef.get(String(ref).toLowerCase());
  if (!entry) return null;
  const out = { parts: [], features: [] };
  for (const target of entry.waitsFor || []) {
    const to = waitTarget(target, byRef, slugs, listed);
    if (to && to.part && !out.parts.includes(to.part)) out.parts.push(to.part);
    if (to && to.feature && to.feature !== own && !out.features.includes(to.feature)) out.features.push(to.feature);
  }
  return out;
}

// The list read and checked: `{ parts, slugs, waits }` (waits by slug), or `{ errors }`.
function readList(repo, specRel, listRel, text) {
  const own = path.posix.basename(specRel);
  const parent = parentId(own);
  const parts = parseParts(text);
  if (parts === null) return { errors: [`${listRel} has no ## Parts list.`] };
  const errors = partsSection(text).filter((l) => LOOSE_HEAD.test(l) && !PART_HEAD.test(l))
    .map((l) => `${listRel} has a part heading not in the form ### Story {id}: {title} or ### Task {id}: {title}: "${l.trim()}".`);
  if (!parts.length) return { errors: [...errors, `${listRel}'s ## Parts list holds no ### Story or ### Task block.`] };
  const { byRef, slugs, listed } = indexOf(parts, parent);
  const counted = new Set();
  for (const p of parts) {
    const key = p.ref.toLowerCase();
    if (counted.has(key) && !errors.some((e) => e.startsWith(`${p.ref} heads`))) errors.push(`${p.ref} heads more than one part in ${listRel}: give each part its own id.`);
    counted.add(key);
  }
  const seen = new Map();
  for (const [p, slug] of slugs) {
    if (!isSafeId(slug)) errors.push(`${p.ref} makes the slug ${slug}, which cannot name a folder.`);
    else if (seen.has(slug) && seen.get(slug) !== p.ref) errors.push(`${seen.get(slug)} and ${p.ref} make the same slug ${slug}: give one another title or id.`);
    seen.set(slug, p.ref);
  }
  const waits = new Map();
  for (const p of parts) {
    if (waits.has(slugs.get(p))) continue;
    const list = [];
    if (!p.covers) errors.push(`${p.ref} in ${listRel} has no **Covers:** value: name the sections, flows or rules of the spec it builds.`);
    if (p.waitsFor === null || !p.waitsFor.length) errors.push(`${p.ref} in ${listRel} has no **Waits for:** value: write none, or what it waits for.`);
    for (const target of p.waitsFor || []) {
      const named = waitTarget(target, byRef, slugs, listed);
      if (!named) continue;
      let to = null;
      if (named.unknown) {
        errors.push(`${p.ref} waits for ${target}, and no part of ${listRel} is ${target}.`);
        continue;
      } else if (named.part) {
        to = named.part;
      } else if (target === own) {
        errors.push(`${p.ref} waits for ${own}, its own feature.`);
        continue;
      } else if (isSafeId(target) && specFolder(repo, target)) {
        to = target;
      } else {
        errors.push(`${p.ref} waits for ${target}, which names no part of ${listRel} and no feature folder under ${SPECS}.`);
        continue;
      }
      if (!list.includes(to)) list.push(to);
    }
    waits.set(slugs.get(p), list);
  }
  if (errors.length) return { errors };
  const order = parts.map((p) => slugs.get(p));
  const loop = findCycle(order, waits);
  if (loop) return { errors: [`the parts wait for each other in a loop, so none of them could ever start: ${loop.join(' → ')} → ${loop[0]}.`] };
  return { parts, slugs, waits, parent };
}

// ── making the folders ───────────────────────────────────────────────────────
function specRelOf(repo, specRel) {
  const rel = String(specRel || '').replace(/\\/g, '/').replace(/\/+$/, '');
  const segs = rel.split('/');
  if (!rel.startsWith(`${SPECS}/`) || segs.slice(2).some((s) => !isSafeId(s))) return { error: `${specRel} is not a spec folder under ${SPECS}/.` };
  const depth = segs.length - 2;
  if (depth > MAX_DEPTH - 1) return { error: `${rel} is ${depth} levels under ${SPECS}, so its parts would sit ${depth + 1} deep: the deepest supported nesting is ${DEEPEST}.` };
  if (!isDir(abs(repo, rel))) return { error: `there is no spec folder ${rel}.` };
  return { rel };
}

// Refusals for the files a part's folder already holds: only this command's pointer for this part may be there.
function folderFault(repo, folderRel, expect) {
  const folder = abs(repo, folderRel);
  if (!fs.existsSync(folder)) return null;
  const defDir = path.join(folder, 'definition');
  const held = isDir(defDir) ? fs.readdirSync(defDir) : [];
  const pointerRel = `${folderRel}/definition/spec.md`;
  const foreign = held.filter((n) => n !== 'spec.md' && !PIPELINE_RECORDS.has(n));
  if (!held.includes('spec.md')) return `${folderRel} exists and was not written by this command (it holds no generated definition): rename or remove it, or give the part another title.`;
  const text = readRel(repo, pointerRel);
  const p = parsePointer(text || '');
  if (!p || foreign.length) return `${pointerRel}${foreign.length ? ` and ${foreign.map((n) => `definition/${n}`).join(', ')}` : ''} at a part's folder was not written by this command: a part's detail goes in the list entry or the section it covers, never in a file at its folder.`;
  if (!isUntouched(text)) return `${pointerRel} was edited since this command wrote it, and is never overwritten: move the change into the parent's ## Parts list, then remove the file and run the command again.`;
  if (p.list !== expect.list || p.part !== expect.part) return `${pointerRel} was written for ${p.part} of ${p.list}, not for ${expect.part} of ${expect.list}: two parts make the same folder name.`;
  return null;
}

function makeParts(repo, specRelIn, { beforeWrite = null, now = Date.now() } = {}) {
  const where = specRelOf(repo, specRelIn);
  if (where.error) return refused(where.error);
  const specRel = where.rel;
  const own = path.posix.basename(specRel);
  if (/^adhoc-/i.test(own)) return refused(`${own} is ad-hoc work, which is solo-only and never split into parts: give it a feature slug first.`);
  if (!parentId(own)) return refused(`${own} is not in a slug form a part's slug is made from (F{N}-…, B{N}-…, GAP-{N}-… or a tracker {KEY}-{number}-…).`);
  const list = listFile(repo, specRel);
  if (list.error) return refused(list.error);
  const listRel = list.rel;
  const text = readRel(repo, listRel);
  if (parsePointer(text || '')) return refused(`${specRel} is a part's folder, made by this command: a part holds no list. Split the parent's entry instead.`);

  const lock = takeLock(repo, specRel, now);
  if (lock.error) return refused(lock.error);
  try {
    // The list is read and hashed at one commit; a checkout that moves off it before a write refuses the run.
    const headOf = () => git(repo, ['rev-parse', '--verify', '--quiet', 'HEAD']).stdout.trim();
    const head = headOf();
    const listHash = head ? blobAt(repo, head, listRel) : null;
    if (!listHash) return refused(`${listRel} is not committed: commit it before the parts command reads it.`);
    if (git(repo, ['status', '--porcelain', '--', listRel]).stdout.trim() !== '') return refused(`${listRel} differs from what is committed: commit it, or discard the change, then run the command again.`);
    const committed = readAt(repo, head, listRel);
    const status = committed === null ? null : statusOf(committed);
    if (status === null || !/^\**Ready\b/.test(status)) return refused(`${listRel} is not marked Ready (it reads ${status === null ? 'no status line' : `"${status}"`}): parts are made from a ready spec.`);

    const read = readList(repo, specRel, listRel, committed);
    if (read.errors) return refused(...read.errors);
    const planned = [];
    const faults = [];
    for (const p of read.parts) {
      const slug = read.slugs.get(p);
      const folder = `${specRel}/${slug}`;
      const rel = `${folder}/definition/spec.md`;
      const want = renderPointer({ list: listRel, part: p.ref, listHash, parent: own });
      const fault = folderFault(repo, folder, { list: listRel, part: p.ref });
      if (fault) { faults.push(fault); continue; }
      planned.push({ rel, want, held: readRel(repo, rel) });
    }
    if (faults.length) return refused(...faults);

    const written = [];
    const unchanged = [];
    const late = [];
    for (const item of planned) {
      if (item.held !== null && lf(item.held) === item.want) { unchanged.push(item.rel); continue; }
      if (beforeWrite) beforeWrite(item.rel);
      if (headOf() !== head) {
        late.push(`the checkout moved off the commit ${listRel} was read at while the command ran, so ${item.rel} and the parts after it were not written: run the command again.`);
        break;
      }
      const file = abs(repo, item.rel);
      if (item.held === null) {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        try { fs.writeFileSync(file, item.want, { flag: 'wx' }); } catch (e) {
          if (e.code !== 'EEXIST') throw e;
          late.push(`${item.rel} appeared after the command read the folder, and is never overwritten: run the command again once its writer is done.`);
          continue;
        }
      } else {
        if (readRel(repo, item.rel) !== item.held) { late.push(`${item.rel} changed while the command ran, and is never overwritten: run the command again.`); continue; }
        fs.writeFileSync(file, item.want);
      }
      written.push(item.rel);
    }
    if (late.length) return { ...refused(...late), written };
    return {
      ok: true,
      spec: specRel,
      list: listRel,
      parts: read.parts.map((p) => ({ slug: read.slugs.get(p), folder: `${specRel}/${read.slugs.get(p)}`, waitsFor: read.waits.get(read.slugs.get(p)) })),
      written,
      unchanged,
      lockTakenOver: lock.takenOver,
    };
  } finally {
    dropLock(lock);
  }
}

// ── finished ─────────────────────────────────────────────────────────────────
// How a commit is read: this module's own git, or a caller's `{ readAt, existsAt }` of the same signatures.
const OWN_IO = { readAt, existsAt };

// The list's file of a feature at a commit: its SDD spec where one is there, else its definition.
function listAt(repo, commit, rel, io) {
  for (const name of ['sdd/definition/spec.md', 'definition/spec.md', 'definition/bug.md', 'definition/epic.md']) {
    const text = io.readAt(repo, commit, `${rel}/${name}`);
    if (text !== null) return text;
  }
  return null;
}

/** Whether every part a feature's list names at the commit has its summary there; null where it lists none. */
function partsFinished(repo, commit, rel, io = OWN_IO) {
  const text = listAt(repo, commit, rel, io);
  const parts = text === null ? null : parseParts(text);
  const parent = parentId(path.posix.basename(rel));
  if (!parts || !parts.length || !parent) return null;
  const open = parts.map((p) => partSlug(parent, p)).filter((slug) => !io.existsAt(repo, commit, `${rel}/${slug}/delivery/summary.md`));
  return open.length ? { open } : { done: true };
}

function featureFinished(repo, commit, rel, io = OWN_IO) {
  if (io.existsAt(repo, commit, `${rel}/delivery/summary.md`)) return true;
  const parts = partsFinished(repo, commit, rel, io);
  return Boolean(parts && parts.done);
}

/** Why a pointer read at `at` no longer matches its list's blob at `commit`, or null while it does (or is no pointer). */
function staleSourceAt(repo, commit, file, at = commit) {
  const p = parsePointer(readAt(repo, at, file) || '');
  if (!p) return null;
  const now = blobAt(repo, commit, p.list);
  if (now === null) return `${file} was made from ${p.list}, which is not there at ${commit}.`;
  return now === p.listHash ? null : `${file} was made from another version of ${p.list}: run the parts command again and commit its output.`;
}

// ── check ────────────────────────────────────────────────────────────────────
function checkPart(repo, partRelIn) {
  const partRel = String(partRelIn || '').replace(/\\/g, '/').replace(/\/+$/, '');
  const pointerRel = `${partRel}/definition/spec.md`;
  const text = readRel(repo, pointerRel);
  const p = parsePointer(text || '');
  if (!p) return { state: 'error', waits: [], reason: `${pointerRel} is not a part's generated definition.` };
  if (!isUntouched(text)) return { state: 'stale', waits: [], reason: `${pointerRel} was edited by hand: make the parts again (parts.js --spec).` };
  const listText = readRel(repo, p.list);
  if (listText === null) return { state: 'stale', waits: [], reason: `${p.list}, the list it was made from, is gone.` };
  const hash = git(repo, ['hash-object', '--stdin', `--path=${p.list}`], listText);
  if (hash.status !== 0 || hash.stdout.trim() !== p.listHash) return { state: 'stale', waits: [], reason: `${p.list} changed since the part was made: make the parts again (parts.js --spec ${path.posix.dirname(partRel)}).` };
  const specRel = path.posix.dirname(partRel);
  const read = readList(repo, specRel, p.list, listText);
  if (read.errors) return { state: 'stale', waits: [], reason: read.errors.join(' ') };
  const entry = read.parts.find((x) => x.ref === p.part);
  if (!entry) return { state: 'stale', waits: [], reason: `${p.part} is no longer in ${p.list}.` };
  const listed = new Set(read.slugs.values());
  const open = read.waits.get(read.slugs.get(entry)).filter((slug) => {
    if (listed.has(slug)) return !existsAt(repo, 'HEAD', `${specRel}/${slug}/delivery/summary.md`);
    const folder = specFolder(repo, slug);
    return !folder || !featureFinished(repo, 'HEAD', relOf(repo, folder));
  });
  return open.length ? { state: 'waiting', waits: open, reason: `waits for ${open.join(', ')}` } : { state: 'ready', waits: [], reason: '' };
}

module.exports = {
  MAX_DEPTH,
  MARKER_HEAD,
  makeParts,
  checkPart,
  specFolder,
  partsFinished,
  featureFinished,
  staleSourceAt,
  waitsOf,
  parseParts,
  parentId,
  partSlug,
  renderPointer,
  parsePointer,
  isUntouched,
};
