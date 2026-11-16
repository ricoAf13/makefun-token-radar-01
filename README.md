# Vanguard Token Launch Radar

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/ricoAf13/makefun-token-radar-01/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/ricoAf13/makefun-token-radar-01/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

**Vanguard Token Launch Radar** is a real-time web dashboard and valuation engine tracking upcoming pre-token protocol launches from DefiLlama snapshots, built for the [make.fun](https://make.fun) `token-radar-01` competition ($1,325 USDC Bounty).

---

## 🎯 Architecture & Features

1. **Protocol Valuation Model (`lib/model.ts`):**
   - Evaluates pre-token protocols across 750+ tracked ecosystems using quantitative fundamentals:
     - TVL-based baseline multiple
     - 7-day net liquidity growth multiplier (bounded [-60%, +120%])
     - Protocol age and maturity curve damping
   - Generates actionable, protocol-specific farming playbooks (3 to 12 verified action steps per protocol).
   - Segregates active tokenized assets from pre-token opportunities into dedicated watchlists.

2. **Web Dashboard Interface (`dashboard/`):**
   - Static, zero-dependency responsive client.
   - Comprehensive sorting, category breakdown, chain filtering, and search index.
   - Interactive protocol drawer showcasing metrics, TVL progression, and step-by-step farming roadmap.

3. **Sealed Grader Delivery (`main.ts`):**
   - Reads DefiLlama protocol snapshots from `/input/snapshot.json`.
   - Generates deterministic `board.json` and static `data.js`.
   - Produces byte-for-byte compliant `dossier.json` via vendored `makefun-board.ts`.

---

## 🚀 Execution & Local Verification

To run the pipeline against a snapshot:
```bash
node main.ts --input ../input/snapshot.json --output out
```

---

## 📜 License

[MIT License](LICENSE) (SPDX-License-Identifier: MIT)
