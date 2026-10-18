/**
 * The built-in sensitive-path list (F232): the kinds of change that make a light-path step risky — a
 * database migration, login or security code, secrets or environment configuration, a dependency
 * manifest. One matcher serves both readers: the planner's `risk-recheck.js --match` and the
 * handover recheck. The list ships with the plugin and no repo adds to it.
 *
 * Paths are repo-relative with `/` separators. Globs match case-insensitively; `*` stays inside one
 * segment and `**` spans segments, a leading `**\/` included zero segments.
 */
'use strict';

const KIND_IDS = ['migration', 'security', 'secrets', 'dependency'];

const GLOBS = {
  migration: [
    '**/Migrations/**', '**/migrations/**', '**/db/migration/**', '**/db/changelog/**', '**/alembic/versions/**',
  ],
  secrets: [
    '**/.env', '**/.env.*', '**/appsettings*.json', '**/secrets.*', '**/*.pem', '**/*.key', '**/*.pfx',
    '**/application*.properties', '**/application*.yml', '**/settings.py', '**/firebase_options.dart',
    '**/google-services.json', '**/GoogleService-Info.plist',
  ],
  dependency: [
    '**/*.csproj', '**/Directory.Packages.props', '**/packages.lock.json', '**/package.json', '**/package-lock.json',
    '**/pnpm-lock.yaml', '**/yarn.lock', '**/pubspec.yaml', '**/pubspec.lock', '**/requirements*.txt',
    '**/pyproject.toml', '**/poetry.lock', '**/Pipfile', '**/Pipfile.lock', '**/pom.xml', '**/build.gradle',
    '**/build.gradle.kts', '**/gradle.lockfile', '**/go.mod', '**/go.sum',
  ],
};

function globToRegExp(glob) {
  let src = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*' && glob[i + 1] === '*') {
      if (glob[i + 2] === '/') { src += '(?:.*/)?'; i += 2; } else { src += '.*'; i += 1; }
    } else if (c === '*') {
      src += '[^/]*';
    } else {
      src += c.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp(`^${src}$`, 'i');
}

const COMPILED = Object.fromEntries(Object.entries(GLOBS).map(([k, list]) => [k, list.map(globToRegExp)]));

function normalise(p) {
  return String(p).replace(/\\/g, '/').replace(/^\.\//, '');
}

// The security kind is a word test, not a glob: a segment or file stem that is one of these words,
// optionally plural, whole or followed by a boundary — so `author` and `securities` stay out.
const SECURITY_WORDS = ['auth', 'login', 'security', 'identity', 'oauth', 'jwt', 'permission'];
// These two match whatever follows, so `Authentication` and `AuthorizeFilter` are caught while
// `authority` and `authorship` are not.
const SECURITY_PREFIXES = ['authenticat', 'authoriz'];

// A boundary is the end of the name, a non-letter, or an upper-case letter in the original case.
function boundaryAt(name, i) {
  if (i >= name.length) return true;
  const c = name[i];
  const lower = c.toLowerCase();
  const upper = c.toUpperCase();
  if (lower === upper) return true;
  return c === upper;
}

function isSecurityName(name) {
  const lower = name.toLowerCase();
  if (SECURITY_PREFIXES.some((p) => lower.startsWith(p))) return true;
  return SECURITY_WORDS.some((w) => {
    if (!lower.startsWith(w)) return false;
    if (boundaryAt(name, w.length)) return true;
    return lower[w.length] === 's' && boundaryAt(name, w.length + 1);
  });
}

function stem(fileName) {
  const dot = fileName.lastIndexOf('.');
  return dot > 0 ? fileName.slice(0, dot) : fileName;
}

function isSecurityPath(file) {
  const parts = file.split('/').filter(Boolean);
  if (parts.length === 0) return false;
  const names = [...parts.slice(0, -1), stem(parts[parts.length - 1])];
  return names.some(isSecurityName);
}

function matchKinds(p) {
  const file = normalise(p);
  return KIND_IDS.filter((kind) => (kind === 'security'
    ? isSecurityPath(file)
    : (COMPILED[kind] || []).some((re) => re.test(file))));
}

module.exports = { KIND_IDS, matchKinds };
