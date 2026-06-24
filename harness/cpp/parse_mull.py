#!/usr/bin/env python3
"""Kill-score extractor for the gate — proves the mull report is machine-parseable."""
import json
import collections
import sys

path = sys.argv[1] if len(sys.argv) > 1 else "/probe/mull-out/probe.json"
d = json.load(open(path))
files = d.get("files", d)

total = killed = 0
per_file = collections.Counter()
per_file_killed = collections.Counter()
status_ct = collections.Counter()
killed_samples = []

for fpath, info in files.items():
    for m in info.get("mutants", []):
        total += 1
        st = m.get("status", "?")
        status_ct[st] += 1
        per_file[fpath] += 1
        if st == "Killed":
            killed += 1
            per_file_killed[fpath] += 1
            if len(killed_samples) < 8:
                loc = m.get("location", {}).get("start", {})
                name = m.get("mutatorName", "?")
                line = loc.get("line", "?")
                killed_samples.append("{} @ L{}".format(name, line))

score = (100.0 * killed / total) if total else 0.0
print("KILL SCORE: {}/{} = {:.1f}%".format(killed, total, score))
print("status breakdown:", dict(status_ct))
print("per-file mutants (killed/total):")
for p in per_file:
    print("  {}: {}/{}".format(p, per_file_killed[p], per_file[p]))
print("sample killed mutants:")
for s in killed_samples:
    print("  -", s)
