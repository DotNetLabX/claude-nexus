---
name: consumption-report
description: Reports per-agent token consumption from docs/audit/token-usage.jsonl — peak context, output generated, tool-call count, and context growth per agent (team-lead, architect, each subagent). Requires the token_audit plugin config to have been ON during the run. Use to find which agent burns the most tokens and why.
---

# Consumption Report

Turns the raw per-tool-call token log into a per-agent table: **who burned what, and how their
context grew**. This is the analysis half of the token audit; the capture half is the
`audit-logger` hook, which only writes the log when the **`token_audit`** plugin config is on.

## Precondition

The data lives in **`docs/audit/token-usage.jsonl`** in the current project, written by the
`audit-logger` hook while `token_audit` is enabled. Before reporting:

1. If `docs/audit/token-usage.jsonl` is **missing or empty**, the audit was not on. Tell the user:
   *"No token-usage log yet. Turn on the `token_audit` plugin config (Nexus → Token consumption
   audit, or `token_audit: true`), then re-run the pipeline — the audit only records while it's on."*
   Do not fabricate numbers.
2. If it exists, proceed.

## How the data is shaped

Each line is one tool call: `{ts, agent, tool, input, output, cache_read, cache_creation, context}`
where `context = input + cache_read + cache_creation` (the size of the agent's window at that point)
and `output` is tokens generated. Because the hook records the **last completed turn's** usage on
each tool call, several consecutive tool calls inside one turn carry the **same** usage tuple — so
sum `output` only over *distinct* consecutive tuples (a turn), never over every row.

## Produce the report

Run this aggregation (it handles the same-turn dedup correctly):

```bash
node -e '
const fs=require("fs");
const p="docs/audit/token-usage.jsonl";
if(!fs.existsSync(p)){console.log("No token-usage.jsonl — enable token_audit and re-run.");process.exit(0);}
const rows=fs.readFileSync(p,"utf8").split("\n").filter(Boolean).map(l=>{try{return JSON.parse(l)}catch{return null}}).filter(Boolean);
const A={};
for(const r of rows){
  const g=A[r.agent]||(A[r.agent]={calls:0,peak:0,first:null,last:0,out:0,key:null});
  g.calls++;
  const ctx=r.context||0;
  if(g.first===null)g.first=ctx;
  g.last=ctx;
  if(ctx>g.peak)g.peak=ctx;
  const k=[r.input,r.output,r.cache_read,r.cache_creation].join("|");
  if(k!==g.key){g.out+=r.output||0;g.key=k;}      // new turn -> count its output once
}
const k=n=>n>=1000?(n/1000).toFixed(1)+"k":String(n);
const names=Object.keys(A).sort((a,b)=>A[b].peak-A[a].peak);
console.log("agent          calls   peak-context   output-gen   growth(first->peak)");
console.log("-------------  -----   ------------   ----------   -------------------");
for(const n of names){const g=A[n];
  console.log(n.padEnd(13)+"  "+String(g.calls).padStart(5)+"   "+k(g.peak).padStart(12)+"   "+k(g.out).padStart(10)+"   "+(k(g.first)+" -> "+k(g.peak)).padStart(19));}
const tot=names.reduce((s,n)=>s+A[n].out,0);
console.log("\nTotal output generated across agents: "+k(tot));
'
```

## Interpret it for the user

- **peak-context** — the largest window the agent held. A high peak on `architect`/`team-lead`
  usually means re-reading large artifacts (plan.md, the spec, the comm log).
- **growth (first → peak)** — how much the agent *added* to its own context over its run. A big
  jump is the "agent X added 30k re-reading the plan" signal — cross-check against its read
  discipline.
- **output-gen** — tokens the agent generated (plans, code, reviews, messages).
- **calls** — tool-call count; high counts with low output can indicate thrashing.

Call out the top one or two agents by peak and by growth, and tie the growth back to what that
agent read or re-read during the run. Keep the table; add 2–4 lines of plain-language findings.
