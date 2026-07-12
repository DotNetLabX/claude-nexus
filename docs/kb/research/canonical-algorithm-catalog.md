# canonical-algorithm-catalog

## What bounded catalog of canonical algorithms should a "recognize the hand-rolled algorithm" skill match against in a production C++ retail-CV SDK, which entries are library-available in the already-linked set (OpenCV/Eigen/STL/NumCpp/vendored DBSCAN) with zero new NDK deps, and how do existing recognition efforts bound their catalogs?

**Verdict:** A ~25-entry catalog (CLRS-core + CV-canon) is the right size, and the highest-rank retail-CV families are **more library-covered than expected**: OpenCV already ships NMS (greedy + rotated + batched/class-aware + Soft-NMS linear & Gaussian), modern RANSAC (USAC family, 4.5.0), a standard Kalman filter (`predict`/`correct`), k-means (`cv::kmeans` with documented compactness objective), predicate-based agglomerative grouping (`cv::partition`, O(N²) equivalence classes — the connected-components/single-linkage substitute), and Hough line fitting — all zero-new-dependency. The notable **reasoning-only** gap is assignment/matching (Hungarian/Kuhn-Munkres): no solver in OpenCV/Eigen/STL/NumCpp (Eigen only hosts the matrix), and it is empirically the #1 hand-rolled algorithm in tracking pipelines (SORT ports vendor their own). Catalog-bounding discipline from the classification literature is consistent (though its verification was cut short by a usage limit): **few, frequent, balanced, deliberately-merged categories, frequency-prune rare ones, dedup for mutual distinctness** — ~30 tags is a proven working size, and code-only algorithm recognition is weak (F1 ~0.56), which argues for a *small high-signal catalog with reasoning-based matching* over broad automated tagging.
**Evidence tier:** read-docs
**As-of:** 2026-07-12
**Validity scope:** OpenCV 4.5.0+ (USAC), 4.x core/dnn/video modules; NumCpp; Eigen; C++ STL; production C++ retail-shelf/tracking CV. Library-availability facts are OpenCV-API-stable; the catalog ranking is retail-CV-specific. Feeds mine-algorithm stage 2 (catalog match).
**Status:** current — self-synthesized (the workflow's synthesis stage failed on a usage limit). Library-availability claims are 3-0 verified; the catalog-bounding-discipline claims are **uncorroborated** (verification votes errored before completing).
**Reconfirm trigger:** finishing verification of the catalog-discipline claims (CodeNet/AlgoLabel/Codeforces-tagger bounding); an OpenCV major that moves NMS/RANSAC/Kalman APIs; or a mine-algorithm pilot that discovers a hand-rolled family absent from this catalog (which extends it).
**Corroboration:** high-stakes (defines a skill's recognition surface). Library-availability claims each 3-0 verified against OpenCV docs/source [1-14]. The reasoning-only classification of Hungarian is 3-0 [15]. Catalog-discipline claims are single-source and verification-incomplete (usage limit) — treat as directional.

## Verdict

The catalog splits into what a replacement can *drop in from the linked set* vs what stays *reasoning-only* (recognize it, but replacement means adopting a vendored/hand-written impl, not a library call). The surprising, verified result is how much of the retail-CV canon OpenCV already covers:

**Library-available (zero new NDK deps), highest-rank first:**
- **NMS (all common variants)** — `cv::dnn::NMSBoxes` (greedy hard NMS: boxes + scores + score-thresh + IoU-thresh + eta + top_k → kept indices), with `Rect` / `Rect2d` / `RotatedRect` overloads, plus `NMSBoxesBatched` (class-aware) and `softNMSBoxes` (linear and Gaussian decay). A hand-rolled greedy-NMS loop is a pure deletion [3,4,7,8,9].
- **RANSAC** — the USAC family (`USAC_DEFAULT/FAST/ACCURATE/MAGSAC`) shipped in OpenCV 4.5.0, and is empirically better than the legacy flag, so replacement is an accuracy upgrade [1,2].
- **k-means** — `cv::kmeans` in core, with the documented objective (min within-cluster SSD / compactness across attempts) that a characterization stage matches against [10,11].
- **Kalman / SORT motion model** — `cv::KalmanFilter` with the canonical `predict()`/`correct()` two-phase API; SORT ports already wrap it [5,6].
- **Predicate-based agglomerative grouping / connected components** — `cv::partition` (O(N²) equivalence-class split by a user predicate) is the linked-set substitute for hand-rolled "merge nearby boxes"/single-linkage grouping [12].
- **Hough line fitting** — `HoughLines` (standard) and `HoughLinesP` (probabilistic, segment endpoints) for shelf-row/boundary structure.
- **Linear-algebra substrate** — Eigen and NumCpp `linalg` (norm/dot/det/inv/lstsq/svd) cover least-squares line/plane fitting and homography solves; NumCpp also gives the ordering/set primitives (`sort/argsort/argmin/argmax/unique`) that hand-rolled score-ranking and greedy matching are built from [13,14].

**Reasoning-only (recognize, but no linked-set solver):**
- **Assignment / matching (Hungarian / Kuhn-Munkres, auction)** — no solver in OpenCV/Eigen/STL/NumCpp; Eigen only hosts the cost matrix. Verified as the top hand-rolled family in tracking pipelines (SORT-cpp and Multitarget-tracker both vendor their own O(N³) Hungarian) [15]. Replacement = adopt a vetted vendored solver, not a library call.
- **Sequence alignment (Levenshtein/Needleman-Wunsch/LCS)** — no linked-set impl (the estate's existing Levenshtein is itself hand-rolled-but-tested); DP archetype, reasoning-only.
- **DBSCAN** — already *vendored* in the SDK (the marquee `clusterize` case), so "available" via the vendored copy, not OpenCV.
- Graph (components beyond `cv::partition`, shortest path, topological), interval/scheduling greedy, geometric hashing, general DP — reasoning-only; recognize the shape, replacement is a vetted hand-impl.

**Catalog-bounding discipline** (directional — verification cut short): existing algorithm/problem-recognition efforts converge on the same scope rules — **few, frequent, balanced, deliberately-merged categories** (AlgoLabel collapses 107 tags → 4; Codeforces taggers prune to ~30 by frequency), **dedup for mutual distinctness** (CodeNet Jaccard 0.9/0.8), and a **hard size cap** (POJ-104 fixed at 104 by sampling a closed universe). And a caution that *validates the whole mine-algorithm approach*: code-only algorithm recognition is weak (best F1 ~0.56, below text-only 0.62) — so a small high-signal catalog matched by *reasoning over problem-signature* beats broad automated code-tagging.

## Finding

- OpenCV ships the USAC RANSAC family (`USAC_DEFAULT/FAST/ACCURATE/MAGSAC`) alongside legacy RANSAC, released in 4.5.0 — hand-rolled/legacy RANSAC replaceable with zero new deps [1] (3-0)
- The USAC flags are empirically better than legacy OpenCV RANSAC on fundamental-matrix benchmarks — replacement is an accuracy upgrade, not just consolidation [2] (3-0)
- `cv::dnn::NMSBoxes` provides greedy hard NMS (boxes + scores + score/IoU thresholds + eta + top_k → kept indices) with `Rect`, `Rect2d`, and `RotatedRect` overloads [3,7] (3-0)
- Rotated-box NMS is covered in-library via the `RotatedRect` overload — relevant for skewed shelf/product detections [4] (3-0)
- Class-aware NMS via `cv::dnn::NMSBoxesBatched` (per-box `class_ids`) covers multi-class post-processing without a hand-rolled per-class loop [8] (3-0)
- Soft-NMS via `cv::dnn::softNMSBoxes` with both decay variants — linear (`*= 1 - overlap`) and Gaussian (`*= exp(-overlap²/sigma)`) — so Soft-NMS is library-available, not reasoning-only [9] (3-0)
- `cv::KalmanFilter` is a standard Kalman filter with the canonical `predict()`/`correct()` two-phase API — the recognizer signature for a hand-rolled predict/update cycle (e.g. inside SORT) [5,6] (3-0)
- `cv::kmeans` (core module) does k-means with a documented objective — returns compactness = ∑‖sampleᵢ − center_labelᵢ‖², min across attempts — a concrete inputs/outputs/objective signature [10,11] (3-0)
- `cv::partition` is a generic O(N²) equivalence-class splitter by user predicate — the linked-set replacement for hand-rolled predicate/agglomerative grouping of detections, distinct from point-vector clustering [12] (3-0)
- NumCpp provides the low-level primitives (`sort`/`argsort`/`argmin`/`argmax`/`unique`) that hand-rolled score-ranking and greedy matching decompose into — primitives, not the composed algorithms [13] (3-0)
- NumCpp `linalg` ships `norm`/`dot`/`det`/`inv`/`lstsq`/`svd` — an availability source for least-squares line fitting and linear solves, overlapping Eigen [14] (3-0)
- **Assignment/matching is reasoning-only:** no Hungarian/assignment solver in OpenCV/Eigen/STL/NumCpp; a standalone Hungarian impl uses Eigen *only* as the matrix substrate — so Hungarian is a reasoning-only catalog entry even though Eigen can host the matrix with zero new deps [15] (3-0). Practitioner corroboration: SORT-cpp and the 2.4k-star Multitarget-tracker both vendor their own O(N³) Hungarian.
- **Refuted (0-3):** "NumCpp implements none of the CV/CLRS families" — over-broad; NumCpp does ship the `linalg`/sorting primitives above, so the correct statement is "primitives yes, composed algorithms no." [13]
- **Refuted (0-3):** the specific *sourced* statement of Hungarian's signature from one repo — killed on sourcing, not substance; the textbook CLRS signature (non-negative n×n cost matrix → min-cost one-to-one assignment) stands and is what the catalog entry uses.
- POJ-104 was bounded by sampling a *closed* problem universe (104 classes × 500 programs), i.e. catalog size fixed a priori, not by open-ended discovery [16] (2-0)
- **[uncorroborated — usage-limit, single-source each]** catalog-bounding discipline across efforts: CodeNet down-selects 4,053 problems → 250–1,400 balanced classes and dedups by Jaccard 0.9/0.8; AlgoLabel collapses 107 tags → 4 merged labels; a Codeforces tagger prunes 35 tags → ~30 by frequency; the taxonomy deliberately mixes problem-topic and solution-technique axes; and code-only recognition reaches only F1 ~0.56 (< text-only 0.62), arguing for small-high-signal + reasoning-based matching

## Fix

For mine-algorithm's stage-2 catalog, ship ~25 entries, each carrying: problem signature (inputs/outputs/objective/invariants), complexity class, and an **availability field** with one of three values:

- **`library` (drop-in, zero new deps):** NMS (all variants → `cv::dnn::NMSBoxes`/`Batched`/`softNMSBoxes`), RANSAC (→ USAC flags), k-means (→ `cv::kmeans`), Kalman (→ `cv::KalmanFilter`), agglomerative/CC grouping (→ `cv::partition`), Hough lines (→ `HoughLines`/`P`), least-squares fitting (→ Eigen/NumCpp `linalg`).
- **`vendored` (available via an already-vendored copy):** DBSCAN (the SDK vendors it — the `clusterize` replacement target).
- **`reasoning-only` (recognize; replacement = adopt a vetted impl, not a call):** Hungarian/assignment (+ auction), sequence alignment (Levenshtein/NW/LCS), graph (shortest-path/topological), interval/scheduling greedy, geometric hashing, general DP.

Rank by likelihood of appearing hand-rolled in retail-CV: assignment, clustering, NMS, alignment, Kalman/tracking, Hough/line-fit, RANSAC first. Enforce the bounding discipline explicitly: cap ~25–30 entries; every entry must be mutually distinct (no two match the same code shape); frequency-rank so rare families don't dilute; and match by *problem-signature reasoning*, not code-token classification (the F1-0.56 finding says code-only tagging is unreliable). The zero-new-NDK-dependency rule is the hard filter on the `library` value — verify against the *actually-linked* OpenCV modules (dnn, core, video, imgproc) at pilot time.

## Alternatives

- **Unbounded/growing catalog:** rejected — the classification literature's consistent lesson is deliberate coarse-graining and frequency-pruning; an ever-growing catalog is the pattern-sprawl failure mode (mirrors the mine-design decision-table ≤15-row cap).
- **Automated code-clone/algorithm tagging instead of a curated catalog:** rejected as the primary mechanism — code-only recognition tops out at F1 ~0.56; use curated signatures + reasoning, keep automated similarity only as a *hint* source.
- **CV-canon only (skip CLRS-core):** rejected — the top hand-rolled family (assignment/Hungarian) is CLRS-core, not CV-canon; the two halves are both load-bearing.
- **Treat Eigen as an assignment source because it can host the matrix:** rejected — hosting a cost matrix is not shipping a solver; Hungarian stays `reasoning-only`.

## Caveat

- The workflow's synthesis stage failed on a usage limit; **this entry is self-synthesized** from the verified claim set. Library-availability claims are 3-0 verified; the **catalog-bounding-discipline claims are uncorroborated** (verification errored) — directionally consistent and primary-sourced, but not independently confirmed.
- `cv::kmeans` and `cv::partition` confirmations came from OpenCV docs; both are `library`-available but neither is DBSCAN — for density-based clustering the SDK's *vendored* DBSCAN is the availability source, not OpenCV.
- Availability is asserted against OpenCV's documented API, not against the SDK's *actual linked modules* — a `library` verdict must be re-checked against the real link set at pilot time (e.g. is `opencv_dnn` linked on the arm64 build?).
- The Hungarian-signature refutation (0-3) is a sourcing artifact, not a substantive doubt — the CLRS signature is textbook and the catalog uses it.

## Fallback

- If a `library` entry turns out not to be linked on the arm64 build (e.g. `opencv_dnn` excluded to shrink the binary): downgrade that entry to `reasoning-only` or `vendored` for that SDK, and record it — availability is per-link-set, not universal.
- If the catalog-discipline claims can't be reconfirmed: apply the ≤25–30-entry cap and frequency-ranking by architect judgment (same posture as the mine-design table), since the direction is unambiguous even unverified.
- If a pilot surfaces a hand-rolled family absent from the catalog: add it as a new entry with its availability value, keeping the mutual-distinctness and size-cap rules.

## Sources

[1] https://opencv.org/evaluating-opencvs-new-ransacs/ — USAC family in 4.5.0; better than legacy (primary)
[3,4,7,8,9] https://docs.opencv.org/4.x/d6/d0f/group__dnn.html and https://github.com/opencv/opencv/blob/master/modules/dnn/src/nms.cpp — NMSBoxes (Rect/Rect2d/RotatedRect), NMSBoxesBatched, softNMSBoxes linear+Gaussian (primary)
[5,6] https://docs.opencv.org/3.4/dd/d6a/classcv_1_1KalmanFilter.html — standard Kalman, predict()/correct() (primary)
[10,11,12] https://docs.opencv.org/4.x/d5/d38/group__core__cluster.html — cv::kmeans (compactness objective), cv::partition (O(N²) equivalence classes) (primary)
[13,14] https://github.com/dpilger26/NumCpp — sort/argsort/argmin/argmax/unique; linalg norm/dot/det/inv/lstsq/svd (primary)
[15] https://github.com/mxemam/hungarianAlgorithm (Eigen as matrix substrate only) + https://github.com/mcximing/sort-cpp + https://github.com/Smorodov/Multitarget-tracker (vendored Hungarian) — assignment is reasoning-only (primary)
[16] https://arxiv.org/abs/1409.5718 — POJ-104 bounded by closed problem universe (primary)
[uncorroborated] https://arxiv.org/pdf/2105.12655 (CodeNet dedup/down-select) ; https://www.mdpi.com/2227-7390/8/11/1995 (AlgoLabel 107→4, code-only F1 0.56) ; https://arxiv.org/pdf/2301.04597 (Codeforces ~30-tag pruning) — catalog-discipline claims, verification incomplete (usage-limit)

## Pilot extension (2026-07-12) — trigger fired: hand-rolled family absent from the catalog

The first mine-algorithm pilot (fixing_tools action optimizer, `D:\Omnishelf\omnivision-ai-sdk`) found a hand-rolled **budgeted selection / knapsack** unit this catalog covered only obliquely (via "interval/scheduling greedy" and "general DP"). Per the reconfirm trigger, the catalog extends:

- **Entry: budgeted selection / knapsack family** — greedy value/cost density heuristic (Dantzig ratio greedy; budgeted max-coverage / submodular cost-benefit (CELF) lineage for re-scored marginal-gain variants). Availability: **reasoning-only** (STL primitives compose the sort/scan; no solver in the linked set). Complexity: O(G log G) sort + selection scan; the underlying problem is NP-hard — exact DP applies only with decision-independent additive values. Recognition cue: budget-capped loop over ratio-ordered candidates with a feasibility veto.
- Provenance: proposed independently by 3/3 stage-2 matchers, endorsed by stage-3 adjudication; brief at `omnivision-ai-sdk/docs/algorithm-briefs/planogram/fixing_tools-optimizer.md`.

**Pilot-2 corrections (2026-07-12, clusterize run — both endorsed by the stage-3 adjudicator against the installed build):**
- **RANSAC/USAC `library` tag needs a module-scoping caveat:** OpenCV's entire USAC/RANSAC surface lives in the `calib3d` module and exposes correspondence estimators (homography/fundamental/PnP), NOT generic point-set line fitting. Mobile-profile builds often don't link `calib3d` at all (the SDK links only core/imgproc/video/videoio/stitching — `CMakeLists.txt:40,44`). Verify the consumer's linked module set before treating RANSAC as library-available; otherwise it is reasoning-only (hand-roll over `cv::RNG` + `cv::fitLine`).
- **`cv::fitLine` name-collision trap:** it is a deterministic M-estimator (IRLS), not a RANSAC-family algorithm — matching must never treat it as one; its legitimate role is the sample-fit primitive *inside* a hand-rolled RANSAC (exactly how the clusterize engine already uses it).

## Recommendation

**Immediate use (mine-algorithm stage 2):** build the ~25-entry catalog with the three-value availability field above; the ranking leads with assignment, clustering, NMS, alignment, tracking. The high-leverage facts: most CV-canon is `library`-available in OpenCV (so those replacements are near-pure deletions with a documented objective to match), while **assignment/Hungarian is the top reasoning-only hand-rolled family** and the `clusterize`/DBSCAN case is `vendored`. Match by problem-signature reasoning, not code tagging. Re-verify every `library` verdict against the SDK's actual arm64 link set at pilot time.

**Next probe if reopened:** finish verifying the catalog-bounding-discipline claims (CodeNet/AlgoLabel/Codeforces) to firm up the size-cap and dedup rules; and enumerate the STL `<algorithm>`/`<numeric>` and Eigen availability for the remaining CLRS-core entries (sort/partial_sort/nth_element/set-ops, Eigen `ColPivHouseholderQR`/`JacobiSVD` for fitting) — the current dive confirmed OpenCV/NumCpp coverage but left STL/Eigen per-entry availability thinner than the CV half.
