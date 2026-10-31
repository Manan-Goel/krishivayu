'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

// ─── constants ────────────────────────────────────────────────────────────────

const STATE_META: Record<string, { label: string; color: string }> = {
  PUNJAB:         { label: 'Punjab',          color: '#f97316' },
  HARYANA:        { label: 'Haryana',         color: '#facc15' },
  UTTAR_PRADESH:  { label: 'Uttar Pradesh',   color: '#60a5fa' },
  MADHYA_PRADESH: { label: 'Madhya Pradesh',  color: '#a78bfa' },
  RAJASTHAN:      { label: 'Rajasthan',       color: '#34d399' },
  DELHI:          { label: 'Delhi',           color: '#f472b6' },
};

const LINE_COLORS = ['#f97316', '#facc15', '#60a5fa', '#a78bfa', '#34d399'];

function activeSeason(): 'paddy' | 'wheat' {
  const m = new Date().getMonth() + 1;
  return (m >= 3 && m <= 6) ? 'wheat' : 'paddy';
}

// ─── types ────────────────────────────────────────────────────────────────────

interface CreamsData {
  state_totals: Record<string, Record<string, number>>;
  districts:    Record<string, { name: string; lat: number; lon: number; [y: string]: number | string }[]>;
}

interface FirmsResult {
  counts:     Record<string, number>;
  frp_sum:    Record<string, number>;
  total:      number;
  days:       number;
  date_range: { from: string; to: string } | null;
  fetched_at: string;
  source:     string;
  error?:     string;
}

// ─── shared tooltip ───────────────────────────────────────────────────────────

const Tip = ({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a1628]/97 border border-white/12 rounded-lg px-3 py-2.5 text-xs shadow-2xl backdrop-blur">
      <div className="text-gray-400 mb-2 font-mono font-semibold">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 py-0.5">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-gray-300">{STATE_META[p.name]?.label ?? p.name}</span>
          <span className="ml-auto pl-4 text-white font-bold font-mono">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

// ─── FIRMS live panel (props-driven, no internal fetch) ───────────────────────

interface FirmsPanelProps {
  season:    'paddy' | 'wheat';
  data:      FirmsResult | null;
  loading:   boolean;
  noKey:     boolean;
  days:      number;
  onDays:    (d: number) => void;
  onRefresh: () => void;
}

function FirmsPanel({ season, data, loading, noKey, days, onDays, onRefresh }: FirmsPanelProps) {
  const activeLabel = season === 'wheat' ? 'Wheat (Rabi) · Apr–Jun' : 'Paddy (Kharif) · Sep–Nov';

  if (noKey) return (
    <div className="border border-dashed border-white/15 rounded-xl p-5 flex items-center gap-5 bg-[#0d1f35]/30">
      <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-white mb-0.5">Connect NASA FIRMS for live fire data</div>
        <div className="text-xs text-gray-500">Same satellite source CREAMS uses (VIIRS 375m). Free API key, takes 30 seconds.</div>
        <div className="mt-2 flex items-center gap-3 flex-wrap">
          <a href="https://firms.modaps.eosdis.nasa.gov/api/" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 font-mono transition-colors">
            1. Get free key → firms.modaps.eosdis.nasa.gov/api
          </a>
          <span className="text-gray-600 text-xs font-mono">2. Add FIRMS_MAP_KEY=your_key to .env.local</span>
          <span className="text-gray-600 text-xs font-mono">3. Restart server</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0d1f35]/30">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8 bg-[#020714]/40">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-semibold text-white">NASA FIRMS Live · 2026</span>
          <span className="text-[10px] font-mono text-gray-500 border border-white/10 rounded px-1.5 py-0.5">{activeLabel}</span>
          {data && <span className="text-[10px] font-mono text-gray-600">{data.source}</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#020714] border border-white/10 rounded-lg overflow-hidden text-[10px] font-mono">
            {[1, 3, 5].map(d => (
              <button key={d} onClick={() => onDays(d)}
                className={`px-2 py-1 transition-colors ${days === d ? 'bg-orange-500/20 text-orange-400' : 'text-gray-500 hover:text-gray-300'}`}>
                {d}d
              </button>
            ))}
          </div>
          <button onClick={onRefresh} disabled={loading}
            className="flex items-center gap-1 text-[10px] font-mono text-gray-500 hover:text-white disabled:opacity-40 border border-white/8 rounded-lg px-2 py-1 transition-colors">
            <svg className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
          {data?.fetched_at && (
            <span className="text-[10px] font-mono text-gray-700">
              {new Date(data.fetched_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} · auto ↻ 1h
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-6 divide-x divide-white/6">
        {Object.entries(STATE_META).map(([key, { label, color }]) => {
          const count = data?.counts[key] ?? 0;
          const frp   = data?.frp_sum[key] ?? 0;
          const total = data?.total ?? 1;
          const pct   = total > 0 ? (count / total * 100) : 0;
          return (
            <div key={key} className="px-3 py-3 text-center">
              <div className="text-[10px] font-mono text-gray-500 mb-1 truncate">{label}</div>
              <div className="text-lg font-bold font-mono" style={{ color }}>
                {loading ? <span className="text-gray-700">—</span> : count.toLocaleString()}
              </div>
              <div className="text-[9px] text-gray-600 font-mono">detections</div>
              {frp > 0 && <div className="text-[9px] text-gray-700 font-mono mt-0.5">{(frp / 1000).toFixed(1)}k MW FRP</div>}
              {count > 0 && (
                <div className="mt-1.5 h-0.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {data && (
        <div className="px-4 py-1.5 border-t border-white/6 bg-[#020714]/30 flex items-center justify-between">
          <div className="text-[10px] font-mono text-gray-600">
            {data.total.toLocaleString()} total detections · confidence ≥ nominal · VIIRS 375m resolution
          </div>
          {data.date_range && (
            <div className="text-[10px] font-mono text-gray-700">
              {data.date_range.from} → {data.date_range.to}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── year pill toggle ─────────────────────────────────────────────────────────

function YearPills({
  allYears, selected, onChange, hasLive,
}: {
  allYears: string[]; selected: string[]; onChange: (y: string[]) => void; hasLive: boolean;
}) {
  const toggle = (yr: string) => {
    if (selected.includes(yr)) {
      const next = selected.filter(y => y !== yr);
      if (next.length > 0) onChange(next);
    } else {
      onChange([...selected, yr].sort());
    }
  };
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[10px] text-gray-600 font-mono mr-0.5">Years</span>
      {allYears.map(yr => {
        const isLive = yr === '2026';
        const on = selected.includes(yr);
        return (
          <button key={yr} onClick={() => toggle(yr)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono border transition-all ${
              on
                ? isLive
                  ? 'bg-green-500/15 border-green-500/40 text-green-400'
                  : 'bg-orange-500/15 border-orange-500/40 text-orange-300'
                : 'bg-transparent border-white/10 text-gray-600 hover:text-gray-400'
            }`}>
            {isLive && hasLive && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
            {yr}{isLive ? ' live' : ''}
          </button>
        );
      })}
      <button onClick={() => onChange(allYears)}
        className="px-2 py-0.5 rounded-md text-[10px] font-mono border border-white/8 text-gray-600 hover:text-gray-400 transition-colors ml-1">
        All
      </button>
    </div>
  );
}

// ─── FIRMS cache ──────────────────────────────────────────────────────────────

const FIRMS_CACHE_KEY   = 'parali_firms_cache_v1';
const REFRESH_MS        = 60 * 60 * 1000;

interface FirmsCacheEntry { data: FirmsResult; days: number; at: number }

function readCache(): FirmsCacheEntry | null {
  try {
    const c: FirmsCacheEntry = JSON.parse(localStorage.getItem(FIRMS_CACHE_KEY) ?? 'null');
    return c && Date.now() - c.at < REFRESH_MS ? c : null;
  } catch { return null; }
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function TrendsPage() {
  // CREAMS data
  const [paddyData, setPaddyData] = useState<CreamsData | null>(null);
  const [wheatData, setWheatData] = useState<CreamsData | null>(null);
  const [season,      setSeason]      = useState<'paddy' | 'wheat'>(activeSeason);
  const [stateFilter, setStateFilter] = useState('all');

  // FIRMS live data (lifted to parent so charts can use it)
  const [firmsData,    setFirmsData]    = useState<FirmsResult | null>(() => readCache()?.data ?? null);
  const [firmsLoading, setFirmsLoading] = useState(false);
  const [firmsNoKey,   setFirmsNoKey]   = useState(false);
  const [firmsDays,    setFirmsDays]    = useState<number>(() => readCache()?.days ?? 3);

  const fetchFirms = useCallback(async (d: number, silent = false) => {
    if (!silent) setFirmsLoading(true);
    try {
      const res  = await fetch(`/api/firms?days=${d}`);
      const json: FirmsResult = await res.json();
      if (res.status === 400) { setFirmsNoKey(true); return; }
      setFirmsData(json);
      try { localStorage.setItem(FIRMS_CACHE_KEY, JSON.stringify({ data: json, days: d, at: Date.now() })); } catch { /* ignore */ }
    } finally { if (!silent) setFirmsLoading(false); }
  }, []);

  // Load CREAMS; load FIRMS (cache-first)
  useEffect(() => {
    let active = true;
    fetch('/data/creams_paddy.json')
      .then(r => r.json())
      .then(d => { if (active) setPaddyData(d); });
    fetch('/data/creams_wheat.json')
      .then(r => r.json())
      .then(d => { if (active) setWheatData(d); });

    const hasCached = readCache();
    if (!hasCached) {
      setTimeout(() => {
        if (active) fetchFirms(firmsDays);
      }, 0);
    }
    const id = setInterval(() => fetchFirms(firmsDays, true), REFRESH_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFirmsDays = (d: number) => { setFirmsDays(d); fetchFirms(d); };

  const data = season === 'paddy' ? paddyData : wheatData;

  // CREAMS years
  const creamsYears = useMemo(() => {
    if (!data) return [];
    return [...new Set(Object.values(data.state_totals).flatMap(v => Object.keys(v)))].sort();
  }, [data]);

  // All selectable years: CREAMS + 2026 if FIRMS connected
  const allYears = useMemo(() => {
    const base = creamsYears;
    return firmsNoKey ? base : [...base, '2026'];
  }, [creamsYears, firmsNoKey]);

  // Default: 2026 only
  const [selectedYears, setSelectedYears] = useState<string[]>(['2026']);

  const validSelectedYears = useMemo(() => {
    if (allYears.length && !selectedYears.some(y => allYears.includes(y))) {
      return [allYears.at(-1)!];
    }
    return selectedYears;
  }, [allYears, selectedYears]);

  const effectiveStateFilter = (data && stateFilter !== 'all' && !data.state_totals[stateFilter]) ? 'all' : stateFilter;
  const states = useMemo(() => data ? Object.keys(data.state_totals) : [], [data]);
  const filteredStates = useMemo(() => effectiveStateFilter === 'all' ? states : [effectiveStateFilter], [effectiveStateFilter, states]);

  // "Latest" year from selection — used by static charts
  const displayLatest  = validSelectedYears.at(-1) ?? creamsYears.at(-1) ?? '2025';
  const isLiveSelected = displayLatest === '2026';
  // Previous CREAMS year for YoY
  const prevYear = creamsYears.at(-1) ?? creamsYears.at(-2) ?? creamsYears[0];
  const baseYear = validSelectedYears.find(y => y !== '2026') ? (validSelectedYears.filter(y => y !== '2026')[0]) : (creamsYears[0] ?? '2020');

  // ── Chart 1: area/trend — selected years on X axis ────────────────────────
  const areaData = useMemo(() => {
    const yrs = validSelectedYears.filter(y => allYears.includes(y));
    return yrs.map(yr => {
      const row: Record<string, string | number> = { year: yr === '2026' ? '2026 ↗' : yr };
      filteredStates.forEach(s => {
        row[s] = yr === '2026'
          ? (firmsData?.counts[s] ?? 0)
          : (data?.state_totals[s]?.[yr] ?? 0);
      });
      return row;
    });
  }, [validSelectedYears, allYears, filteredStates, data, firmsData]);

  // ── Chart 2: top districts / states for displayLatest ─────────────────────
  const topDistricts = useMemo(() => {
    if (isLiveSelected) {
      // 2026: use FIRMS state totals as bars (no district breakdown)
      return Object.entries(STATE_META)
        .filter(([k]) => stateFilter === 'all' || k === stateFilter)
        .map(([k, { label, color }]) => ({
          name: label, fires: firmsData?.counts[k] ?? 0, color, state: label,
        }))
        .sort((a, b) => b.fires - a.fires);
    }
    if (!data) return [];
    return (stateFilter === 'all' ? states : [stateFilter])
      .flatMap(s => (data.districts[s] ?? []).map(d => ({
        name:  d.name as string,
        fires: (d[displayLatest] as number) ?? 0,
        color: STATE_META[s]?.color ?? '#888',
        state: STATE_META[s]?.label ?? s,
      })))
      .sort((a, b) => b.fires - a.fires)
      .slice(0, 12);
  }, [data, isLiveSelected, stateFilter, states, displayLatest, firmsData]);

  // ── Chart 3: YoY ──────────────────────────────────────────────────────────
  const yoyRows = useMemo(() => {
    if (isLiveSelected) {
      // 2026 vs 2025 CREAMS — state level
      return states
        .filter(s => stateFilter === 'all' || s === stateFilter)
        .map(s => {
          const cur = firmsData?.counts[s] ?? 0;
          const prv = data?.state_totals[s]?.[prevYear] ?? 0;
          return { label: STATE_META[s]?.label ?? s, cur, pct: prv > 0 ? ((cur - prv) / prv * 100) : 0 };
        })
        .sort((a, b) => a.pct - b.pct);
    }
    if (!data) return [];
    const latest = displayLatest;
    const prev2  = selectedYears.filter(y => y < latest).at(-1) ?? creamsYears.at(-2) ?? creamsYears[0];
    if (stateFilter !== 'all') {
      return (data.districts[stateFilter] ?? [])
        .map(d => ({
          label: d.name as string,
          cur:   (d[latest] as number) ?? 0,
          pct:   (d[prev2] as number) > 0 ? (((d[latest] as number ?? 0) - (d[prev2] as number ?? 0)) / (d[prev2] as number) * 100) : 0,
        }))
        .sort((a, b) => a.pct - b.pct).slice(0, 10);
    }
    return states.map(s => {
      const cur = data.state_totals[s]?.[latest] ?? 0;
      const prv = data.state_totals[s]?.[prev2]  ?? 0;
      return { label: STATE_META[s]?.label ?? s, cur, pct: prv > 0 ? ((cur - prv) / prv * 100) : 0 };
    }).sort((a, b) => a.pct - b.pct);
  }, [data, isLiveSelected, stateFilter, states, displayLatest, selectedYears, creamsYears, firmsData, prevYear]);

  // ── Chart 4: district trend lines (CREAMS years only) ─────────────────────
  const trendState = stateFilter !== 'all' ? stateFilter : (season === 'paddy' ? 'PUNJAB' : 'MADHYA_PRADESH');
  const chartYears = selectedYears.filter(y => y !== '2026'); // trend lines use CREAMS only
  const trendDistricts = useMemo(() => {
    if (!data || chartYears.length === 0) return { rows: [], names: [] };
    const latest2 = chartYears.at(-1)!;
    const top = (data.districts[trendState] ?? [])
      .sort((a, b) => ((b[latest2] as number) ?? 0) - ((a[latest2] as number) ?? 0))
      .slice(0, 5);
    return {
      rows:  chartYears.map(yr => { const r: Record<string, string | number> = { year: yr }; top.forEach(d => { r[d.name as string] = (d[yr] as number) ?? 0; }); return r; }),
      names: top.map(d => d.name as string),
    };
  }, [data, trendState, chartYears]);

  // ── Summary cards ──────────────────────────────────────────────────────────
  const totalLatest = isLiveSelected
    ? filteredStates.reduce((s, k) => s + (firmsData?.counts[k] ?? 0), 0)
    : filteredStates.reduce((s, k) => s + (data?.state_totals[k]?.[displayLatest] ?? 0), 0);
  const totalBase = filteredStates.reduce((s, k) => s + (data?.state_totals[k]?.[baseYear] ?? 0), 0);
  const overallPct = totalBase > 0 ? ((totalLatest - totalBase) / totalBase * 100) : 0;
  const topStateKey = isLiveSelected
    ? (Object.keys(firmsData?.counts ?? {}).sort((a, b) => (firmsData?.counts[b] ?? 0) - (firmsData?.counts[a] ?? 0))[0] ?? states[0])
    : ([...states].sort((a, b) => (data?.state_totals[b]?.[displayLatest] ?? 0) - (data?.state_totals[a]?.[displayLatest] ?? 0))[0]);

  if (!data) return (
    <div className="flex flex-col h-screen bg-[#020714] text-white">
      <Navbar />
      <div className="flex-1 flex items-center justify-center gap-3 text-gray-500 text-sm">
        <div className="w-4 h-4 border-2 border-orange-500/40 border-t-orange-500 rounded-full animate-spin" />
        Loading CREAMS data…
      </div>
    </div>
  );

  const yearRangeLabel = selectedYears.length === 1
    ? selectedYears[0] + (isLiveSelected ? ' (live)' : '')
    : `${selectedYears[0]}–${selectedYears.at(-1)}`;

  const yoyLabel = isLiveSelected ? `${prevYear} → 2026` : `${selectedYears.filter(y => y !== '2026').at(-2) ?? baseYear} → ${displayLatest}`;

  return (
    <div className="flex flex-col h-screen bg-[#020714] text-white overflow-hidden">
      <Navbar />

      {/* ── header ── */}
      <div className="flex-shrink-0 px-6 pt-4 pb-3 border-b border-white/8 space-y-3">

        {/* Title + controls row */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-bold text-white">Crop Fire Trends</h1>
            <p className="text-[11px] text-gray-500 font-mono mt-0.5">
              CREAMS/IARI historical · NASA FIRMS live · {yearRangeLabel}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Year pills */}
            <YearPills allYears={allYears} selected={selectedYears} onChange={setSelectedYears} hasLive={!firmsNoKey} />
            {/* Season toggle */}
            <div className="flex bg-[#0d1f35] border border-white/10 rounded-lg overflow-hidden text-xs">
              {(['paddy', 'wheat'] as const).map(s => (
                <button key={s} onClick={() => setSeason(s)}
                  className={`px-3 py-1.5 font-mono transition-colors ${season === s ? 'bg-orange-500/20 text-orange-300' : 'text-gray-500 hover:text-white'}`}>
                  {s === 'paddy' ? '🌾 Paddy' : '🌿 Wheat'}
                </button>
              ))}
            </div>
            {/* State filter */}
            <select value={stateFilter} onChange={e => setStateFilter(e.target.value)}
              className="bg-[#0d1f35] border border-white/10 text-white text-xs rounded-lg px-3 py-1.5 font-mono outline-none focus:border-orange-500/40">
              <option value="all">All States</option>
              {states.map(s => <option key={s} value={s}>{STATE_META[s]?.label ?? s}</option>)}
            </select>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-5 gap-3">
          {[
            {
              label: `Fires ${isLiveSelected ? '2026 (live)' : displayLatest}`,
              value: totalLatest.toLocaleString(),
              sub:   isLiveSelected ? `${firmsDays}d window · VIIRS 375m` : (stateFilter === 'all' ? 'All tracked states' : STATE_META[stateFilter]?.label),
              color: 'text-orange-400',
            },
            {
              label: `vs ${isLiveSelected ? prevYear : baseYear}`,
              value: `${overallPct > 0 ? '+' : ''}${overallPct.toFixed(0)}%`,
              sub:   isLiveSelected ? `${prevYear} full season` : `Since ${baseYear}`,
              color: overallPct <= 0 ? 'text-green-400' : 'text-red-400',
            },
            {
              label: 'Highest state',
              value: STATE_META[topStateKey]?.label ?? topStateKey ?? '—',
              sub:   isLiveSelected
                ? `${(firmsData?.counts[topStateKey] ?? 0).toLocaleString()} detections`
                : `${(data.state_totals[topStateKey]?.[displayLatest] ?? 0).toLocaleString()} fires`,
              color: 'text-red-400',
            },
            {
              label: 'Active season',
              value: season === 'paddy' ? 'Paddy' : 'Wheat',
              sub:   season === 'paddy' ? 'Sep – Nov' : 'Apr – Jun',
              color: activeSeason() === season ? 'text-green-400' : 'text-gray-400',
            },
            {
              label: 'Data source',
              value: isLiveSelected ? 'FIRMS Live' : 'VIIRS 375m',
              sub:   isLiveSelected ? 'SNPP + NOAA-20 · Dual sat' : 'NASA MODIS/VIIRS · CREAMS',
              color: isLiveSelected ? 'text-green-400' : 'text-cyan-400',
            },
          ].map(c => (
            <div key={c.label} className="bg-[#0d1f35]/50 border border-white/8 rounded-xl px-3 py-2.5">
              <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">{c.label}</div>
              <div className={`text-base font-bold mt-0.5 leading-tight ${c.color}`}>{c.value}</div>
              <div className="text-[10px] text-gray-600 mt-0.5 truncate">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* FIRMS live panel */}
        <FirmsPanel
          season={season}
          data={firmsData} loading={firmsLoading} noKey={firmsNoKey}
          days={firmsDays} onDays={handleFirmsDays} onRefresh={() => fetchFirms(firmsDays)}
        />
      </div>

      {/* ── charts grid ── */}
      <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-3 p-4 overflow-hidden min-h-0">

        {/* 1: trend area — spans 2 cols */}
        <div className="col-span-2 bg-[#0d1f35]/40 border border-white/8 rounded-xl p-4 flex flex-col min-h-0">
          <div className="text-xs font-semibold text-white mb-0.5">
            {stateFilter === 'all' ? 'Fire Events by State' : `${STATE_META[stateFilter]?.label} — Annual Fires`} · {yearRangeLabel}
          </div>
          <div className="text-[10px] text-gray-500 font-mono mb-2">
            {season === 'paddy' ? 'Paddy residue burning · Oct–Nov' : 'Wheat residue burning · Apr–May'}
            {isLiveSelected && <span className="text-green-600 ml-1">· 2026 bar = FIRMS {firmsDays}d snapshot</span>}
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="year" tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                <Tooltip content={<Tip />} />
                {stateFilter === 'all' && <Legend wrapperStyle={{ fontSize: 10 }} formatter={v => STATE_META[v]?.label ?? v} />}
                {filteredStates.map((key, i) => (
                  <Area key={key} type="monotone" dataKey={key} name={key}
                    stackId={stateFilter === 'all' ? '1' : undefined}
                    stroke={STATE_META[key]?.color ?? LINE_COLORS[i]}
                    fill={STATE_META[key]?.color ?? LINE_COLORS[i]}
                    fillOpacity={0.12} strokeWidth={2} dot={{ r: 3 }} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2: YoY change */}
        <div className="bg-[#0d1f35]/40 border border-white/8 rounded-xl p-4 flex flex-col min-h-0">
          <div className="text-xs font-semibold text-white mb-0.5">{yoyLabel} Change</div>
          <div className="text-[10px] text-gray-500 font-mono mb-3">
            {isLiveSelected ? 'Live 2026 vs full 2025 season' : stateFilter !== 'all' ? `Districts · ${STATE_META[stateFilter]?.label}` : 'By state'}
          </div>
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {yoyRows.map(({ label, cur, pct }) => (
              <div key={label}>
                <div className="flex justify-between text-[10px] font-mono mb-0.5">
                  <span className="text-gray-400 truncate pr-2">{label}</span>
                  <span className={`font-bold flex-shrink-0 ${pct <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {pct > 0 ? '+' : ''}{pct.toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.abs(pct))}%`, background: pct <= 0 ? '#22c55e' : '#ef4444' }} />
                  </div>
                  <span className="text-[9px] text-gray-700 font-mono w-12 text-right flex-shrink-0">{cur.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3: Top districts / states */}
        <div className="bg-[#0d1f35]/40 border border-white/8 rounded-xl p-4 flex flex-col min-h-0">
          <div className="text-xs font-semibold text-white mb-0.5">
            {isLiveSelected ? 'Live State Totals (2026)' : `Top Districts (${displayLatest})`}
          </div>
          <div className="text-[10px] text-gray-500 font-mono mb-2">
            {isLiveSelected ? `${firmsDays}d VIIRS snapshot · state level` : (stateFilter === 'all' ? 'All states' : STATE_META[stateFilter]?.label)}
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topDistricts} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 9 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<Tip />} />
                <defs>
                  <linearGradient id="fg" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ffb300" /><stop offset="100%" stopColor="#ff2d2d" />
                  </linearGradient>
                </defs>
                <Bar dataKey="fires" name="Fires" fill="url(#fg)" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4: District trend lines (CREAMS only) */}
        <div className="col-span-2 bg-[#0d1f35]/40 border border-white/8 rounded-xl p-4 flex flex-col min-h-0">
          <div className="text-xs font-semibold text-white mb-0.5">
            District Trends — {STATE_META[trendState]?.label ?? trendState}
          </div>
          <div className="text-[10px] text-gray-500 font-mono mb-2">
            Top 5 districts · {chartYears.length > 0 ? `${chartYears[0]}–${chartYears.at(-1)}` : 'Select a historical year to see trends'}
          </div>
          <div className="flex-1 min-h-0">
            {chartYears.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-600 text-xs font-mono">
                Select a historical year (2020–2025) to see district trends
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendDistricts.rows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="year" tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{ fontSize: 10, color: '#9ca3af' }} />
                  {trendDistricts.names.map((name, i) => (
                    <Line key={name} type="monotone" dataKey={name}
                      stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2}
                      dot={{ r: 3, fill: LINE_COLORS[i % LINE_COLORS.length] }} activeDot={{ r: 5 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-1.5 border-t border-white/5 text-[10px] text-gray-700 font-mono flex-shrink-0 flex items-center justify-between">
        <span>Historical: CREAMS Lab · ICAR-IARI · Bulletin No. 77 · GODL-India License</span>
        <span>Live: NASA FIRMS · VIIRS SNPP + NOAA-20 · 375m · Same satellite feed as CREAMS</span>
      </div>
    </div>
  );
}
