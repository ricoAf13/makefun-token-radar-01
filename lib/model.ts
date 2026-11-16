// Vanguard Protocol: Token Launch Radar Quantitative Model
// Erasable TypeScript targeting Node.js 22 runtime.

export interface SnapshotProtocol {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
}

export interface Snapshot {
  as_of: string;
  source: string;
  floor_usd: number;
  protocols: SnapshotProtocol[];
  watchlist: string[];
}

export interface BoardRow {
  rank: number;
  slug: string;
  name: string;
  category: string;
  chains: string[];
  tvl_usd: number;
  implied_value_usd: number;
  momentum_score: number;
  farm_steps: string[];
}

export interface RadarPayload {
  as_of: string;
  floor_usd: number;
  total_tracked: number;
  rows: BoardRow[];
}

const CATEGORY_WEIGHTS: Record<string, number> = {
  Dexes: 1.35,
  Lending: 1.25,
  Derivatives: 1.40,
  Yield: 1.15,
  Synthetics: 1.20,
  Indexes: 1.10,
  Payments: 1.15,
};

function calculateMaturityMultiplier(listedAt: string | null, asOfStr: string): number {
  if (!listedAt) return 0.85;
  const asOf = new Date(asOfStr).getTime();
  const listed = new Date(listedAt).getTime();
  const days = Math.max(1, Math.floor((asOf - listed) / (1000 * 60 * 60 * 24)));
  return Math.min(1.4, 0.75 + (Math.min(days, 1000) / 1000) * 0.65);
}

function calculateMomentumMultiplier(change7d: number | null): number {
  if (change7d === null || Number.isNaN(change7d)) return 1.0;
  const clamped = Math.max(-50, Math.min(150, change7d));
  return 1.0 + (clamped / 200) * 0.45;
}

function generateFarmSteps(p: SnapshotProtocol): string[] {
  const cat = p.category ?? 'DeFi';
  const primaryChain = p.chains[0] ?? 'Mainnet';
  return [
    `Deposit liquidity into verified ${cat} pools on ${primaryChain} to establish an early farming epoch position.`,
    `Execute recurring volume interactions weekly to maximize on-chain protocol loyalty multipliers and user tiers.`,
    `Bridge and stake governance test tokens across secondary rollups to earn multi-chain deployment allocation bonuses.`,
    `Retain active collateral balances through the final snapshot event to secure top-decile airdrop claim eligibility.`
  ];
}

export function parseSnapshot(raw: string): Snapshot {
  return JSON.parse(raw) as Snapshot;
}

export function buildRadar(snapshot: Snapshot): { board: BoardRow[]; radar: RadarPayload } {
  const watchlistSet = new Set(snapshot.watchlist);
  const eligible = snapshot.protocols.filter((p) => {
    if (watchlistSet.has(p.slug)) return true;
    return p.mcap_usd === null && p.gecko_id === null && p.symbol === null && p.tvl_usd >= 5_000_000;
  });

  const scored = eligible.map((p) => {
    const catWeight = CATEGORY_WEIGHTS[p.category ?? ''] ?? 1.0;
    const chainMult = 1.0 + Math.min(p.chains.length, 5) * 0.05;
    const momMult = calculateMomentumMultiplier(p.change_7d);
    const matMult = calculateMaturityMultiplier(p.listed_at, snapshot.as_of);

    const baseValuation = p.tvl_usd * 0.32;
    const computed = baseValuation * catWeight * chainMult * momMult * matMult;
    const implied = Math.max(100_000, Math.round(computed));

    return {
      slug: p.slug,
      name: p.name,
      category: p.category ?? 'Uncategorized',
      chains: p.chains,
      tvl_usd: p.tvl_usd,
      implied_value_usd: implied,
      momentum_score: Math.round(momMult * 100),
      farm_steps: generateFarmSteps(p),
    };
  });

  // Sort descending by implied valuation; break ties deterministically by TVL then slug
  scored.sort((a, b) => b.implied_value_usd - a.implied_value_usd || b.tvl_usd - a.tvl_usd || a.slug.localeCompare(b.slug));

  // Assign sequential 1-based ranks
  const board: BoardRow[] = scored.map((row, idx) => ({
    rank: idx + 1,
    ...row,
  }));

  const radar: RadarPayload = {
    as_of: snapshot.as_of,
    floor_usd: snapshot.floor_usd,
    total_tracked: board.length,
    rows: board,
  };

  return { board, radar };
}

export function boardIssue(board: BoardRow[], snapshot: Snapshot): string | null {
  const slugs = new Set(board.map((r) => r.slug));
  const missing = snapshot.watchlist.filter((s) => !slugs.has(s));
  if (missing.length > 0) return `Missing watchlist slugs: ${missing.slice(0, 5).join(', ')}`;

  const ranks = board.map((r) => r.rank).sort((a, b) => a - b);
  for (let i = 0; i < ranks.length; i++) {
    if (ranks[i] !== i + 1) return `Invalid rank at sequence: ${i + 1}`;
  }

  for (let i = 1; i < board.length; i++) {
    if (board[i]!.implied_value_usd > board[i - 1]!.implied_value_usd) {
      return `Row ${i + 1} has higher valuation than row ${i}`;
    }
  }

  if (board.length >= 2 && board[0]!.implied_value_usd === board[board.length - 1]!.implied_value_usd) {
    return 'Flat valuation across all rows';
  }

  for (const row of board) {
    if (row.farm_steps.length < 3 || row.farm_steps.length > 12) {
      return `Row ${row.slug} has invalid farm steps count: ${row.farm_steps.length}`;
    }
    for (const step of row.farm_steps) {
      if (step.length < 20 || step.length > 600) {
        return `Row ${row.slug} step length out of bounds: ${step.length}`;
      }
    }
    if (!Number.isSafeInteger(row.implied_value_usd) || row.implied_value_usd <= 0) {
      return `Row ${row.slug} invalid implied value: ${row.implied_value_usd}`;
    }
  }

  return null;
}

export function dataScript(radar: RadarPayload): string {
  return `window.RADAR=${JSON.stringify(radar)};\n`;
}
