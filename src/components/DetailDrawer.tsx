'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { DistrictSummary } from '@/types';
import { generateFarmerMessages } from '@/lib/messages';
import {
  X,
  Copy,
  Check,
  Share2,
  Factory,
  Flame,
  Truck,
  Wrench,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface DetailDrawerProps {
  district: DistrictSummary | null;
  onClose: () => void;
}

export function DetailDrawer({ district, onClose }: DetailDrawerProps) {
  const [selectedLang, setSelectedLang] = useState<'en' | 'hi' | 'pa'>('en');
  const [copied, setCopied] = useState(false);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!district) return null;

  const messages = generateFarmerMessages(district);
  const currentMessage = messages.find((m) => m.lang === selectedLang) ?? messages[0];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentMessage.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'moderate':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
  };

  const getAlternativeIcon = (type: string) => {
    switch (type) {
      case 'cbg_plant':
        return <Factory className="w-4 h-4 text-emerald-400" />;
      case 'biomass_plant':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'residue_buyer':
        return <Truck className="w-4 h-4 text-cyan-400" />;
      case 'machinery_rental':
        return <Wrench className="w-4 h-4 text-purple-400" />;
      default:
        return <Factory className="w-4 h-4 text-gray-400" />;
    }
  };

  const getAlternativeTypeLabel = (type: string) => {
    switch (type) {
      case 'cbg_plant':
        return 'CBG Bio-CNG Facility';
      case 'biomass_plant':
        return 'Biomass / Pellet Plant';
      case 'residue_buyer':
        return 'Residue Off-Take Buyer';
      case 'machinery_rental':
        return 'Custom Hiring Centre (CHC)';
      default:
        return 'Clean Alternative';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      {/* Click outside to close */}
      <div className="flex-1 cursor-pointer" onClick={onClose} aria-hidden="true" />

      {/* Drawer Container */}
      <aside
        className="w-full max-w-xl bg-[#03091e] border-l border-white/10 text-white flex flex-col h-full shadow-2xl overflow-y-auto focus:outline-none"
        role="dialog"
        aria-label={`Action plan for District ${district.name}`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#03091e]/95 backdrop-blur-md px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {district.name}
              </h2>
              <span className="text-xs text-gray-400 font-medium">({district.state})</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold uppercase ${getRiskBadgeColor(
                  district.riskLevel
                )}`}
              >
                {district.riskLevel} Risk · {district.riskScore}/100
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Identified Crop-Residue Hotspots & Clean Alternative Action Plan
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors focus:ring-2 focus:ring-emerald-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-6">
          {/* Risk Breakdown Box */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-gray-200">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Transparent Risk Heuristic Breakdown</span>
              </div>
              <span className="text-[10px] font-mono text-gray-400">Delhi Receptor Impact</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-black/30 border border-white/5 rounded-lg p-2.5">
                <div className="text-[10px] text-gray-400 font-medium">Active Fires</div>
                <div className="text-base font-bold text-red-400 mt-0.5">
                  {district.fireCount}
                </div>
                <div className="text-[10px] text-gray-400">Total: {district.totalFrp} MW</div>
              </div>

              <div className="bg-black/30 border border-white/5 rounded-lg p-2.5">
                <div className="text-[10px] text-gray-400 font-medium">Distance to Delhi</div>
                <div className="text-base font-bold text-cyan-400 mt-0.5">
                  {district.distanceToDelhiKm.toFixed(0)} <span className="text-xs font-normal">km</span>
                </div>
                <div className="text-[10px] text-gray-400">{district.bearingToDelhiDeg.toFixed(0)}° Azimuth</div>
              </div>

              <div className="bg-black/30 border border-white/5 rounded-lg p-2.5">
                <div className="text-[10px] text-gray-400 font-medium">Wind Alignment</div>
                <div className="text-base font-bold text-emerald-400 mt-0.5">
                  {(district.windAlignment * 100).toFixed(0)}%
                </div>
                <div className="text-[10px] text-gray-400">Trajectory to NCR</div>
              </div>
            </div>

            <div className="text-[11px] text-gray-400 leading-relaxed bg-black/20 p-2.5 rounded border border-white/5">
              <b>Heuristic Weighting:</b> 40% Fire Density + 30% Proximity (50–450 km scale) + 30% Downwind Plume Trajectory.
            </div>
          </div>

{/* Demand Signal from Marketplace */}
          {district.demandSignals && district.demandSignals.count > 0 && (
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5">
              <span className="text-base">📢</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                    Farmer Supply Demand Signal
                  </span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-semibold">
                    {district.demandSignals.count} Active Listing{district.demandSignals.count > 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-xs text-amber-100/90 mt-1">
                  <b>{district.demandSignals.totalQuintals.toLocaleString()} Quintals</b> of paddy straw listed by local farmers in {district.name} awaiting buyer off-take.
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-amber-200/60">Zero personal data · Aggregated capacity indicator</span>
                  <Link href={`/market?district=${encodeURIComponent(district.name)}`} className="text-amber-300 hover:text-white font-medium underline">
                    Browse Listings →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Matched Alternatives Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-200">
                  Nearest Clean Alternatives Found
                </h3>
              </div>
              {district.matchedAlternatives.some(a => !a.isDemo) ? (
                <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-md">
                  PEDA / PIB / IOCL Official Registry
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-md">
                  Demo Data (Synthetic Benchmark)
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {district.matchedAlternatives.map((alt) => (
                <div
                  key={alt.id}
                  className="bg-white/5 hover:bg-white/[0.08] transition-colors border border-white/10 rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                        {getAlternativeIcon(alt.type)}
                      </div>
                      <div>
                        <div className="text-xs font-medium text-emerald-400 uppercase tracking-wide">
                          {getAlternativeTypeLabel(alt.type)}
                        </div>
                        <div className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                          {alt.name}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-2 py-1 rounded-md">
                        {alt.distanceKm} km away
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1 font-mono">
                        {alt.district}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-300 pt-2 border-t border-white/5">
                    <div>
                      <span className="text-gray-400 text-[11px]">Pricing / Incentive:</span>
                      <div className="font-semibold text-emerald-400">
                        {alt.priceQuote ?? 'Standard Market Rate'}
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-400 text-[11px]">Capacity / Fleet:</span>
                      <div className="font-medium text-gray-200 truncate">
                        {alt.capacityOrFleet ?? 'Active Processing Unit'}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
                    <span className="text-[11px] font-mono text-gray-400">
                      Contact: <span className="text-white font-bold">{alt.contact ?? 'Official Desk'}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      {alt.sourceUrl && (
                        <a
                          href={alt.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-mono"
                        >
                          Source Link ↗
                        </a>
                      )}
                      {alt.isDemo ? (
                        <span className="text-[10px] text-amber-400 font-mono">
                          ● Demo Facility
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-mono">
                          ● Official Entity {alt.status ? `(${alt.status})` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Farmer Advisory Generator Section */}
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                  <span>Farmer Message Generator</span>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
                    Ready-to-Send
                  </span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Personalized SMS / WhatsApp notification with nearest non-burning options.
                </p>
              </div>

              {/* Language Selector */}
              <div className="flex items-center bg-black/40 border border-white/10 rounded-lg p-1 gap-1">
                {messages.map((m) => (
                  <button
                    key={m.lang}
                    onClick={() => setSelectedLang(m.lang)}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                      selectedLang === m.lang
                        ? 'bg-emerald-500 text-black font-bold shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Box */}
            <div className="relative">
              <textarea
                readOnly
                value={currentMessage.message}
                rows={7}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-xs text-gray-200 font-mono leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <button
                onClick={handleCopy}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20 active:scale-95 min-h-[44px]"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-black" />
                    <span>Copied Advisory!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-black" />
                    <span>Copy Message</span>
                  </>
                )}
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(currentMessage.message)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition-colors shadow-md shadow-emerald-900/40 min-h-[44px]"
                title="Share directly via WhatsApp"
              >
                <Share2 className="w-4 h-4 text-emerald-200" />
                <span>Share on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
