'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { MainMap } from '@/components/MainMap';
import { DetailDrawer } from '@/components/DetailDrawer';
import type { MatchesApiResponse, DistrictSummary } from '@/types';
import {
  Flame,
  AlertTriangle,
  Wind,
  CheckCircle2,
  Search,
  RefreshCw,
  ChevronRight,
  Database,
} from 'lucide-react';

export default function HomePage() {
  const [data, setData] = useState<MatchesApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<'ALL' | 'PUNJAB' | 'HARYANA'>('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictSummary | null>(null);
  const [activeMobileTab, setActiveMobileTab] = useState<'map' | 'list'>('map');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/matches');
      if (!res.ok) throw new Error(`API returned HTTP ${res.status}`);
      const json: MatchesApiResponse = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch matches data:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to KrishiVayu API');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/matches')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json: MatchesApiResponse) => {
        if (!active) return;
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to connect to KrishiVayu API');
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Filtered districts
  const filteredDistricts = useMemo(() => {
    if (!data) return [];
    return data.districts.filter((d) => {
      const matchesSearch =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.state.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesState = selectedState === 'ALL' || d.state === selectedState;
      return matchesSearch && matchesState;
    });
  }, [data, searchQuery, selectedState]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'text-red-400 bg-red-500/15 border-red-500/30';
      case 'high':
        return 'text-orange-400 bg-orange-500/15 border-orange-500/30';
      case 'moderate':
        return 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30';
      default:
        return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
    }
  };

  return (
    <div className="flex flex-col h-screen min-h-[640px] bg-[#020714] text-[#e8eaf0] overflow-hidden">
      <Navbar />

      {/* Headline Metric Row */}
      <section className="bg-[#030a1c] border-b border-white/10 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 flex-1">
            {/* Metric 1: Hotspots */}
            <div className="flex items-center gap-2 bg-white/[0.02] sm:bg-transparent p-2 sm:p-0 rounded-lg border border-white/5 sm:border-none">
              <div className="p-1.5 sm:p-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 flex-shrink-0">
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] sm:text-[10px] uppercase font-mono text-gray-400 truncate">Hotspots Detected</div>
                <div className="text-sm sm:text-base lg:text-lg font-bold text-white flex items-center gap-1">
                  {loading ? (
                    <span className="w-10 h-4 bg-white/10 rounded animate-pulse inline-block" />
                  ) : (
                    <>
                      <span>{data?.totalHotspots ?? 0}</span>
                      <span className="text-[9px] text-red-400 font-mono font-normal">Active VIIRS</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Metric 2: High Risk Districts */}
            <div className="flex items-center gap-2 bg-white/[0.02] sm:bg-transparent p-2 sm:p-0 rounded-lg border border-white/5 sm:border-none">
              <div className="p-1.5 sm:p-2 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-400 flex-shrink-0">
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] sm:text-[10px] uppercase font-mono text-gray-400 truncate">Delhi High Risk</div>
                <div className="text-sm sm:text-base lg:text-lg font-bold text-white flex items-center gap-1">
                  {loading ? (
                    <span className="w-10 h-4 bg-white/10 rounded animate-pulse inline-block" />
                  ) : (
                    <>
                      <span>{data?.highRiskDistricts ?? 0}</span>
                      <span className="text-[9px] text-orange-400 font-mono font-normal">Districts (≥51)</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Metric 3: Wind Vector */}
            <div className="flex items-center gap-2 bg-white/[0.02] sm:bg-transparent p-2 sm:p-0 rounded-lg border border-white/5 sm:border-none">
              <div className="p-1.5 sm:p-2 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex-shrink-0">
                <Wind className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] sm:text-[10px] uppercase font-mono text-gray-400 truncate">Regional Wind (10m)</div>
                <div className="text-sm sm:text-base lg:text-lg font-bold text-white flex items-center gap-1 truncate">
                  {loading ? (
                    <span className="w-12 h-4 bg-white/10 rounded animate-pulse inline-block" />
                  ) : (
                    <>
                      <span>{data?.wind.speedKmh ?? 0} km/h</span>
                      <span
                        className={`text-[9px] font-mono px-1 py-0.2 rounded border ${
                          data?.wind.isTowardsDelhi
                            ? 'text-red-300 border-red-500/40 bg-red-500/15'
                            : 'text-gray-300 border-gray-600 bg-gray-800'
                        }`}
                      >
                        {data?.wind.directionCardinal} {data?.wind.isTowardsDelhi ? '→ NCR ⚠️' : ''}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Metric 4: Alternatives Ready */}
            <div className="flex items-center gap-2 bg-white/[0.02] sm:bg-transparent p-2 sm:p-0 rounded-lg border border-white/5 sm:border-none">
              <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex-shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] sm:text-[10px] uppercase font-mono text-gray-400 truncate">Clean Alternatives</div>
                <div className="text-sm sm:text-base lg:text-lg font-bold text-white flex items-center gap-1">
                  <span>15 Facilities</span>
                  <span className="text-[9px] font-mono text-emerald-400">CBG & CHCs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right status badge */}
          <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t border-white/5 sm:border-none flex-shrink-0">
            {data?.isUsingSnapshot && (
              <span className="text-[9px] sm:text-[10px] font-mono text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Database className="w-3 h-3 text-amber-400" />
                <span>Cached Snapshot ({data.snapshotDate ?? '2026-10-30'})</span>
              </span>
            )}

            <button
              onClick={fetchData}
              disabled={loading}
              aria-label="Refresh Live Satellite and Weather Data"
              title="Refresh Live Satellite & Weather Data"
              className="min-h-[36px] min-w-[36px] sm:min-h-[32px] sm:min-w-[32px] flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>
      </section>

      {/* Mobile Tab Switcher (< 1024px) */}
      <div className="lg:hidden flex border-b border-white/10 bg-[#03091e] px-3 py-2 gap-2 flex-shrink-0">
        <button
          onClick={() => setActiveMobileTab('map')}
          className={`flex-1 min-h-[44px] py-2 text-xs font-bold rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${
            activeMobileTab === 'map'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-xs'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Map View ({data?.totalHotspots ?? 0} Fires)
        </button>
        <button
          onClick={() => setActiveMobileTab('list')}
          className={`flex-1 min-h-[44px] py-2 text-xs font-bold rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${
            activeMobileTab === 'list'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-xs'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Risk Rankings ({data?.districts.length ?? 0} Districts)
        </button>
      </div>

      {/* Main Workspace */}
      <main className="flex-1 relative flex overflow-hidden p-3 sm:p-4 gap-4">
        {/* Error State */}
        {error && (
          <div className="absolute inset-0 z-40 bg-[#020714]/90 flex flex-col items-center justify-center p-6 text-center">
            <div className="p-3 rounded-full bg-red-500/20 text-red-400 mb-3 border border-red-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Data Service Unavailable</h3>
            <p className="text-sm text-gray-400 mt-1 max-w-md">{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-colors"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && !data && (
          <div className="w-full h-full flex flex-col lg:flex-row gap-4 animate-pulse">
            <div className="flex-1 bg-white/5 rounded-xl border border-white/10" />
            <div className="w-full lg:w-96 bg-white/5 rounded-xl border border-white/10" />
          </div>
        )}

        {/* Ready State */}
        {data && (
          <>
            {/* Map Column */}
            <div
              className={`flex-1 h-full min-h-[380px] ${
                activeMobileTab === 'map' ? 'block' : 'hidden lg:block'
              }`}
            >
              <MainMap
                hotspots={data.hotspots}
                districts={data.districts}
                selectedDistrict={selectedDistrict}
                onSelectDistrict={(dist) => setSelectedDistrict(dist)}
              />
            </div>

            {/* Ranked Districts Panel */}
            <aside
              className={`w-full lg:w-[390px] flex-shrink-0 flex flex-col h-full bg-[#03091e]/90 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md shadow-2xl ${
                activeMobileTab === 'list' ? 'block' : 'hidden lg:flex'
              }`}
            >
              {/* Panel Header & Controls */}
              <div className="p-3.5 border-b border-white/10 flex flex-col gap-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-300">
                      Risk to Delhi Air Quality
                    </h2>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-gray-300">
                      {filteredDistricts.length} active
                    </span>
                  </div>

                  <span className="text-[10px] text-gray-400 font-mono">Ranked by Heuristic</span>
                </div>

                {/* Search & State Filter Bar */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search district or state..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>

                  <div className="flex items-center bg-black/40 border border-white/10 rounded-lg p-0.5 text-[11px] font-mono">
                    <button
                      onClick={() => setSelectedState('ALL')}
                      className={`px-2 py-1 rounded transition-colors ${
                        selectedState === 'ALL' ? 'bg-emerald-500 text-black font-bold' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      ALL
                    </button>
                    <button
                      onClick={() => setSelectedState('PUNJAB')}
                      className={`px-2 py-1 rounded transition-colors ${
                        selectedState === 'PUNJAB' ? 'bg-emerald-500 text-black font-bold' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      PB
                    </button>
                    <button
                      onClick={() => setSelectedState('HARYANA')}
                      className={`px-2 py-1 rounded transition-colors ${
                        selectedState === 'HARYANA' ? 'bg-emerald-500 text-black font-bold' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      HR
                    </button>
                  </div>
                </div>
              </div>

              {/* District List */}
              <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                {filteredDistricts.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-500">
                    No active burning districts match your filter.
                  </div>
                ) : (
                  filteredDistricts.map((district) => {
                    const isSelected = selectedDistrict?.districtKey === district.districtKey;

                    return (
                      <div
                        key={district.districtKey}
                        onClick={() => setSelectedDistrict(district)}
                        className={`p-3.5 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-emerald-500/15 border-l-4 border-l-emerald-400 pl-3'
                            : 'hover:bg-white/5 border-l-4 border-l-transparent'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white truncate">
                              {district.name}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {district.state === 'PUNJAB' ? 'PB' : 'HR'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1">
                            <span className="flex items-center gap-1 text-red-400">
                              <Flame className="w-3 h-3" />
                              <b>{district.fireCount}</b> fires
                            </span>
                            <span>•</span>
                            <span>{district.distanceToDelhiKm.toFixed(0)} km to NCR</span>
                            <span>•</span>
                            <span>{(district.windAlignment * 100).toFixed(0)}% downwind</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right">
                            <span
                              className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${getRiskColor(
                                district.riskLevel
                              )}`}
                            >
                              {district.riskScore}
                            </span>
                            <div className="text-[9px] text-gray-400 uppercase mt-0.5 font-mono">
                              {district.riskLevel}
                            </div>
                          </div>

                          <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-emerald-400 translate-x-0.5' : 'text-gray-500'}`} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Panel Footer Action */}
              {selectedDistrict && (
                <div className="p-3 bg-[#03091e] border-t border-white/10 flex-shrink-0">
                  <button
                    onClick={() => {}}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-colors"
                  >
                    <span>Action Plan for {selectedDistrict.name}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </aside>
          </>
        )}
      </main>

      {/* Detail Drawer & Farmer Message Generator */}
      <DetailDrawer
        district={selectedDistrict}
        onClose={() => setSelectedDistrict(null)}
      />
    </div>
  );
}
