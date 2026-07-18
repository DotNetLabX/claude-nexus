# Worked Example — a synthetic value model and a briefing over it

Everything here is **invented**. This skill package embeds no real project's KPI ids, weights,
coefficient ids, or SAP mappings — the fixture below exists only to exercise the output contract.

## The fixture value model

A small synthetic `value-model.json` exercising a measured row, an estimated row, an explicitly
`unmapped` row, and one coefficient carrying **both** guardrail classes:

```json
{
  "kpis": [
    {
      "id": "KPI-201",
      "label": "units sold (demo)",
      "construct": { "measureId": "m_units_sold" },
      "pool": "A",
      "value_weight": 1.0,
      "revisions": []
    },
    {
      "id": "KPI-202",
      "label": "shelf availability (demo)",
      "construct": { "measureId": "m_availability" },
      "pool": "B",
      "value_weight": 1.3,
      "revisions": [
        { "from": 1.0, "to": 1.3, "evidence": "demo re-grounding note DN-1" }
      ],
      "sap": { "field": "ZZ_DEMO_AVAIL", "fiori_app": "F0000-demo" }
    },
    {
      "id": "KPI-203",
      "label": "promo uplift (demo)",
      "unmapped": true,
      "pool": "E",
      "value_weight": 0.8,
      "note": "no semantic-model construct exists for this KPI; carried by its source KPI id only, explicitly marked unmapped"
    }
  ],
  "coefficients": [
    {
      "id": "EC-1",
      "label": "out-of-stock elasticity (demo)",
      "dimensional_plausibility": "a 1pp OOS reduction is worth fractions of a percent of category revenue, never a double-digit percent",
      "confounds": ["phantom inventory", "substitution", "promo", "seasonality"]
    }
  ]
}
```

Its provenance sidecar (excerpt) cites two KB sources — one reachable, one not:

```json
{
  "kpis.KPI-202.value_weight": {
    "origin": "interview(2026-01-15)",
    "verified": "2026-01-15",
    "cites": ["docs/kb/value-notes/availability-weight.md"]
  },
  "coefficients.EC-1": {
    "origin": "kb(demo-elasticity-study)",
    "verified": "2026-01-10",
    "cites": ["docs/kb/value-notes/oos-elasticity.md"]
  }
}
```

In this example `docs/kb/value-notes/availability-weight.md` is reachable, but
`docs/kb/value-notes/oos-elasticity.md` is **not** locally present (the consumer pulled only the
value model) — so the briefing runs on the embedded provenance for `EC-1` and discloses the gap.

## A briefing over the fixture

Question: *"Where should we focus, and what would closing the availability gap be worth?"*

> **Focus.** Shelf availability (KPI-202, pool B) maps to a semantic-model-verified construct —
> `measureId: m_availability` resolves against the bundle — so the availability metric itself is
> **measured**. Its value weight (1.3, revised up from 1.0 per demo note DN-1) is a business
> monetization weight, so it is **estimated**, not measured — and it is the highest among the mapped
> KPIs, which is why availability is the priority.
>
> **What closing the gap is worth — estimated.** Using out-of-stock elasticity **EC-1**
> (**estimated**, coefficient-derived), a 1-percentage-point availability improvement maps to a
> *fraction of a percent* of category revenue — kept within EC-1's dimensional-plausibility bound,
> not multiplied out into a headline number. **Confounds that threaten this estimate (from EC-1):**
> phantom inventory, substitution, promo, and seasonality — any of which can move the realized
> figure.
>
> **Promo uplift (KPI-203) — estimated, unmapped.** Its value weight (0.8, **estimated**) is
> carried, but the KPI has **no semantic-model construct** (`unmapped: true`), so nothing here can
> be labeled measured; treat it as directional only.
>
> **Sources unavailable at briefing time:** `docs/kb/value-notes/oos-elasticity.md` (EC-1's cited
> study) could not be read locally; EC-1's use above rests on the value model's embedded provenance.
>
> **## Briefing QA**
> - every number labeled measured/estimated — yes (the availability metric measured; the weight and
>   the elasticity mapping estimated);
> - every estimate names its coefficient source + confounds — yes (EC-1 named, four confounds
>   declared);
> - no plausibility bound violated without a flag — yes (the 1pp mapping stayed inside EC-1's
>   bound);
> - unreachable sources disclosed — yes (`oos-elasticity.md`).
> Briefing is well-formed — ships.

## The must-fail counterpart

The same fixture drives the recorded implausibility demo: an ask of the form *"so a 1pp OOS
reduction is 20% of category revenue?"* must be **refused or flagged** by the guardrail (it violates
EC-1's dimensional-plausibility bound) — never returned as a plain "20%". A briefing that emitted
that bare number would fail line 3 of the Briefing QA pass.
