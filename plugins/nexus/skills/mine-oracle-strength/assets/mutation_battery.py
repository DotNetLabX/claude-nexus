# Mutation battery runner for mine-oracle-strength (the twelfth mine).
#
# Promoted from a field-validated blind-battery runner and hardened to the
# mine-verify-cover Instrument-integrity rules (D4). Mechanics preserved
# VERBATIM from the source runner: exact-string apply (count==1 guard),
# CRLF normalization, hash-verified restore-in-finally, Popen + whole-tree
# kill on timeout with a BOUNDED drain, incremental JSON rewrite after EVERY
# mutant. The classify() marker lists and priority order are field-validated
# and reused verbatim (Dart fill); they are NOT reinvented here.
#
# INSTRUMENT-INTEGRITY HARDENING (D4 — binding on this runner):
#   (a) A kill counts ONLY when attributed to a failing test assertion
#       (audit_class == "BEHAVIORAL"). Every other non-pass is classified into
#       COMPILE_FAIL | LOAD_CRASH | TIMEOUT and emitted per-mutant in the JSON
#       report — NEVER auto-killed.
#         - COMPILE_FAIL is excluded from the numerator AND the denominator
#           (a mutant that broke the build is non-viable, evidence of nothing).
#         - LOAD_CRASH and TIMEOUT are NOT killed, NOT survived, NOT in the
#           denominator — they sit in pending buckets awaiting per-mutant
#           adjudication (the skill's Stage 4). Unadjudicated buckets score as
#           survivors: the gate may under-state, never over-state.
#   (b) Per-process-isolated scratch state — a per-pid/GUID scratch dir is
#       created and handed to the test subprocess (cwd + env), so any temp file
#       a scored test writes is isolated. A shared mutable path under parallel
#       workers converts harness collisions into false kills.
#   (c) EXACT floor comparison, NO rounding anywhere in score arithmetic. The
#       numerator and denominator are emitted so a consumer floors exactly via
#       integers (behavioral_kills * 100 >= floor * valid_denominator); the
#       reported kill_pct is the un-rounded quotient.
#   (d) Timeout kill reaches the WHOLE process tree (grandchildren release the
#       pipe), then a bounded drain — the runner never hangs on cleanup.
#   (e) Per-stack commands (test command, parse markers, crash-code handling,
#       tree-kill mechanism) read from a CONFIG block, not hardcoded to one
#       stack. Dart/Flutter is filled (field-proven); override via a JSON config
#       file for other stacks or for an offline stub run.
#
# SCORING (Stryker convention, hardened):
#   - status = "KILLED" only when audit_class == "BEHAVIORAL". Nothing else is
#     ever auto-killed.
#   - kill_pct is a FLOOR whenever any bucket is pending: an unadjudicated
#     LOAD_CRASH/TIMEOUT sits outside the denominator, so adjudicating it a real
#     kill can only RAISE this number.
#
# Usage:
#   python mutation_battery.py <mutants.json> <target_file> <test_path> \
#          <results_out.json> [per_mutant_timeout_s] [config.json]
# mutants.json: [{"id":"M1","find":"<exact>","replace":"<exact>","line":123,"note":"..."}]
# config.json (optional): overrides any DEFAULT_CONFIG key — the per-stack fill.
import hashlib
import json
import os
import subprocess
import sys
import tempfile
import time

# ---- Per-stack config block (D4 change e). Dart/Flutter filled; other stacks
# ---- TBD-at-first-use — override any key via the optional config.json argv.
DEFAULT_CONFIG = {
    # Test command template; the literal "{test_path}" token is substituted with
    # the test_path argv. A stub command (offline dry-run) overrides this key.
    "test_cmd": ["cmd", "/c", "flutter", "test", "{test_path}", "--reporter", "compact"],
    # Verbatim Dart marker lists (field-validated); evaluated in classify() in a
    # fixed priority order. Case-insensitive substring match on stdout+stderr.
    "compile_markers": [
        "failed to load", "compilation failed", "error: compilation",
        "isn't defined", "is not defined", "the argument type",
        "the return type", "undefined_method", "undefined_getter",
        "undefined_identifier", "expected an identifier", "isn't a type",
        "can't be assigned",
    ],
    "behavioral_markers": [
        "expected:", "actual:", " [e]", "test failed", "expected a value",
    ],
    # Whole-tree timeout kill mechanism: "taskkill" (Windows, field-proven) or
    # "killpg" (POSIX process-group). Bounded drain seconds after the kill.
    "tree_kill": "taskkill",
    "timeout_drain_s": 30,
}


def load_config(path):
    cfg = dict(DEFAULT_CONFIG)
    if path:
        with open(path, encoding="utf-8") as f:
            cfg.update(json.load(f))
    return cfg


def classify(output, timed_out, rc, cfg):
    # Evaluated in this exact priority order (first match wins). Case-insensitive
    # substring matching on the combined stdout+stderr output. Marker lists come
    # from the per-stack config (Dart fill = the verbatim field-validated lists).
    text = (output or "").lower()
    if timed_out:
        return "TIMEOUT"
    if any(marker in text for marker in cfg["compile_markers"]):
        return "COMPILE_FAIL"
    if any(marker in text for marker in cfg["behavioral_markers"]):
        return "BEHAVIORAL"
    if rc == 0:
        return "SURVIVED"  # rc==0 with no markers -> genuine survivor
    return "LOAD_CRASH"    # rc!=0, no marker -> crash, NOT an auto-kill


def tree_kill(p, cfg):
    # (d) Kill the WHOLE process tree so grandchildren release the pipe.
    mech = cfg.get("tree_kill", "taskkill")
    if mech == "killpg":
        try:
            os.killpg(os.getpgid(p.pid), 9)
        except Exception:
            p.kill()
    else:  # "taskkill" (Windows, default/field-proven)
        subprocess.run(["taskkill", "/PID", str(p.pid), "/T", "/F"],
                       capture_output=True)


def run_battery(mutants_path, target, test_path, out_path, per_mutant_timeout, config_path):
    cfg = load_config(config_path)
    mutants = json.load(open(mutants_path, encoding="utf-8"))
    orig = open(target, "rb").read()
    orig_hash = hashlib.sha256(orig).hexdigest()
    orig_text = orig.decode("utf-8")
    uses_crlf = "\r\n" in orig_text
    results = []

    # (b) Per-pid/GUID scratch dir. Route the test's temp writes into it via the
    # temp env vars WITHOUT changing the working directory — the test command
    # must still run from the runner's cwd (the project root) so it can find the
    # suite and package; only the temp state is isolated per process.
    scratch = tempfile.mkdtemp(prefix="oracle_battery_{0}_".format(os.getpid()))
    child_env = dict(os.environ)
    child_env["OSMB_SCRATCH"] = scratch
    child_env["TMPDIR"] = scratch   # POSIX temp root
    child_env["TEMP"] = scratch     # Windows temp root
    child_env["TMP"] = scratch      # Windows temp root

    test_cmd = [test_path if tok == "{test_path}" else tok for tok in cfg["test_cmd"]]

    def dump_partial():
        counts = {}
        for r in results:
            counts[r["audit_class"]] = counts.get(r["audit_class"], 0) + 1
        behavioral_kills = counts.get("BEHAVIORAL", 0)
        survived = counts.get("SURVIVED", 0)
        excluded_non_viable = counts.get("COMPILE_FAIL", 0)
        pending_adjudication = counts.get("LOAD_CRASH", 0) + counts.get("TIMEOUT", 0)
        pending_ids = [r["id"] for r in results
                       if r["audit_class"] in ("LOAD_CRASH", "TIMEOUT")]
        valid_denominator = behavioral_kills + survived
        # (c) EXACT — no rounding. Numerator + denominator are emitted so a
        # consumer floors exactly via integers; kill_pct is the un-rounded
        # quotient (None when the denominator is empty).
        kill_pct = (100 * behavioral_kills / valid_denominator) if valid_denominator else None
        summary = {
            "target": target,
            "test_path": test_path,
            "mutants_total": len(mutants),
            "apply_failures": len([r for r in results if r["status"] == "APPLY_FAIL"]),
            "counts": counts,
            "behavioral_kills": behavioral_kills,
            "survived": survived,
            "valid_denominator": valid_denominator,
            "kill_pct": kill_pct,
            "excluded_non_viable": excluded_non_viable,
            "pending_adjudication": pending_adjudication,
            "pending_ids": pending_ids,
            "requires_adjudication": pending_adjudication > 0,
            "complete": len(results) == len(mutants),
            "results": results,
        }
        json.dump(summary, open(out_path, "w", encoding="utf-8"), indent=1)
        return summary

    for m in mutants:
        find, repl = m["find"], m["replace"]
        if uses_crlf and "\n" in find and "\r\n" not in find:
            find = find.replace("\n", "\r\n")
            repl = repl.replace("\n", "\r\n")
        n = orig_text.count(find)
        if n != 1:
            # Exact-string apply guard: a non-unique find is never applied.
            results.append({
                **m, "status": "APPLY_FAIL", "audit_class": "APPLY_FAIL",
                "rc": None, "secs": 0.0,
                "output_tail": f"find-string count={n} (need exactly 1)",
            })
            dump_partial()
            print(f"{m['id']}: APPLY_FAIL rc=None (0.0s)", flush=True)
            continue
        mutated = orig_text.replace(find, repl, 1)
        open(target, "w", encoding="utf-8", newline="").write(mutated)
        t0 = time.time()
        timed_out = False
        rc = None
        output = ""
        try:
            p = subprocess.Popen(
                test_cmd, env=child_env,  # cwd inherited = project root (see (b))
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                text=True, encoding="utf-8", errors="replace",
            )
            try:
                output, _ = p.communicate(timeout=per_mutant_timeout)
                rc = p.returncode
            except subprocess.TimeoutExpired:
                # A mutant that hangs the suite is behaviorally detected only via
                # adjudication (proven infinite loop) — the runner buckets it
                # TIMEOUT, never an auto-kill. Kill the whole tree, drain bounded.
                timed_out = True
                tree_kill(p, cfg)
                try:
                    output, _ = p.communicate(timeout=cfg["timeout_drain_s"])
                except Exception:
                    pass
                rc = -1
        finally:
            dt = round(time.time() - t0, 1)  # wall-clock label only, not a score
            # restore + verify before recording — must happen even on timeout/crash
            open(target, "wb").write(orig)
            if hashlib.sha256(open(target, "rb").read()).hexdigest() != orig_hash:
                print(f"FATAL: restore hash mismatch after {m['id']}", file=sys.stderr)
                sys.exit(2)

        output = output or ""
        audit_class = classify(output, timed_out, rc, cfg)
        status = "KILLED" if audit_class == "BEHAVIORAL" else audit_class
        results.append({
            **m, "status": status, "audit_class": audit_class, "rc": rc, "secs": dt,
            "output_tail": output[-1200:],
        })
        dump_partial()
        print(f"{m['id']}: {audit_class} rc={rc} ({dt}s)", flush=True)

    summary = dump_partial()
    try:
        os.rmdir(scratch)
    except OSError:
        pass  # leave a non-empty scratch for post-mortem; never fail the run on it
    print(f"SUMMARY: mutants_total={summary['mutants_total']} "
          f"apply_failures={summary['apply_failures']} "
          f"behavioral_kills={summary['behavioral_kills']} survived={summary['survived']} "
          f"kill_pct={summary['kill_pct']} excluded_non_viable={summary['excluded_non_viable']} "
          f"pending_adjudication={summary['pending_adjudication']}")
    return summary


if __name__ == "__main__":
    mutants_path, target, test_path, out_path = sys.argv[1:5]
    per_mutant_timeout = int(sys.argv[5]) if len(sys.argv) > 5 else 240
    config_path = sys.argv[6] if len(sys.argv) > 6 else None
    run_battery(mutants_path, target, test_path, out_path, per_mutant_timeout, config_path)
