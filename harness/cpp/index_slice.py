#!/usr/bin/env python3
"""Evidence indexer (Roslyn-equivalent) for the C++ adapter probe.

Reads compile_commands.json, parses the slice translation unit with libclang,
and emits a per-function evidence slice (signature + body source text) for the
functions defined in the main file. This is the Mine-phase input.

Usage: index_slice.py <build_dir_with_compile_commands> <source_file> [out.md]
"""
import sys
import json
import os

from clang import cindex

# The pip `libclang` wheel ships its OWN matching native lib and cindex auto-discovers it.
# Do NOT force the system libclang-15 — the pip bindings are a newer version and the symbol
# sets mismatch (e.g. clang_CXXMethod_isDeleted). Let autodiscovery use the bundled lib.


def main():
    build_dir = sys.argv[1]
    source = os.path.realpath(sys.argv[2])
    out = sys.argv[3] if len(sys.argv) > 3 else "evidence/slice.md"

    # Read compile_commands.json (the point: drive off the real build DB) but keep only the
    # include/define/std flags — the full clang command line carries flags the libclang parser
    # rejects (-fpass-plugin, color, -o foo.o). A self-contained slice parses fine on a clean set.
    raw = []
    cdb = cindex.CompilationDatabase.fromDirectory(build_dir)
    cmds = cdb.getCompileCommands(source)
    if cmds:
        raw = list(cmds[0].arguments)
    if not raw:
        with open(os.path.join(build_dir, "compile_commands.json")) as f:
            for e in json.load(f):
                if os.path.realpath(e["file"]) == source:
                    raw = e.get("arguments") or e["command"].split()
                    break
    print(f"  compile_commands: {len(raw)} raw args (compiler={raw[0] if raw else '?'})",
          file=sys.stderr)

    clean = ["-x", "c++", "-std=c++17"]
    j = 0
    while j < len(raw):
        t = raw[j]
        if t in ("-I", "-isystem", "-D", "-include") and j + 1 < len(raw):
            clean += [t, raw[j + 1]]
            j += 2
            continue
        if t.startswith(("-I", "-isystem", "-D", "-std=")):
            clean.append(t)
        j += 1
    clean += ["-I", os.path.dirname(source)]

    index = cindex.Index.create()
    try:
        tu = index.parse(source, args=clean)
    except cindex.TranslationUnitLoadError:
        # minimal fallback — the slice only needs its own dir + system headers
        tu = index.parse(source, args=["-x", "c++", "-std=c++17", "-I", os.path.dirname(source)])
    diags = [d for d in tu.diagnostics if d.severity >= cindex.Diagnostic.Error]
    for d in diags:
        print(f"  diag: {d.spelling}", file=sys.stderr)

    funcs = []
    for c in tu.cursor.walk_preorder():
        if c.kind in (cindex.CursorKind.FUNCTION_DECL, cindex.CursorKind.CXX_METHOD):
            if not c.is_definition():
                continue
            loc = c.location.file
            if loc is None or os.path.realpath(loc.name) != source:
                continue
            extent = c.extent
            with open(source, "rb") as f:
                data = f.read()
            body = data[extent.start.offset:extent.end.offset].decode("utf-8", "replace")
            funcs.append((c.spelling, extent.start.line, extent.end.line, body))

    os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        f.write(f"# Evidence slice — {os.path.basename(source)}\n\n")
        f.write(f"{len(funcs)} function definitions in the main file.\n\n")
        for name, l0, l1, body in funcs:
            f.write(f"## `{name}` (lines {l0}-{l1})\n\n```cpp\n{body}\n```\n\n")
    print(f"OK wrote {len(funcs)} functions to {out}")
    for name, l0, l1, _ in funcs:
        print(f"  - {name} (L{l0}-{l1})")


if __name__ == "__main__":
    main()
