'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MarketMap } from '@/components/MarketMap';
import { PUNJAB_DISTRICTS } from '@/lib/marketDict';
import type { Offer, ListingStatus } from '@/types/market';
import type { PublicListing } from '@/lib/marketSanitizer';
import {
  Filter,
  PlusCircle,
  Truck,
  ShieldAlert,
  HelpCircle,
  Clock,
  Send,
} from 'lucide-react';

interface NearestBuyer {
  id: string;
  name: string;
  type: string;
  district: string;
  approxDistanceKm: number;
  isOperational: boolean;
  isLowConfidence: boolean;
  priceQuote?: string;
  notes?: string;
}

export default function MarketBrowsePage() {
  // Data state
  const [listings, setListings] = useState<PublicListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filterDistrict, setFilterDistrict] = useState<string>('All');
  const [filterForm, setFilterForm] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Selected Listing
  const [selectedListing, setSelectedListing] = useState<PublicListing | null>(null);
  const [selectedOffers, setSelectedOffers] = useState<Offer[]>([]);
  const [nearestBuyers, setNearestBuyers] = useState<NearestBuyer[]>([]);
  const [loadingBuyers, setLoadingBuyers] = useState(false);

  // User Role (lazy initializer to comply with React 19 purity)
  const [userRole, setUserRole] = useState<'public' | 'buyer' | 'farmer'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('krishivayu_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.role) return parsed.role;
        }
      } catch {
        // ignore
      }
    }
    return 'public';
  });

  // Offer submission form state
  const [offerPrice, setOfferPrice] = useState<number | string>(210);
  const [offerDate, setOfferDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [offerNote, setOfferNote] = useState('');
  const [selectedBuyerProfile, setSelectedBuyerProfile] = useState({
    id: 'demo_buyer_pellet_01',
    name: 'Malwa Bio-Pellet Unit (Demo)',
    type: 'pellet_unit' as Offer['buyerType'],
  });
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [offerSuccessMsg, setOfferSuccessMsg] = useState<string | null>(null);

  // Fetch listings from API asynchronously
  useEffect(() => {
    let ignore = false;
    const fetchMarketListings = async () => {
      try {
        const params = new URLSearchParams();
        if (filterDistrict !== 'All') params.append('district', filterDistrict);
        if (filterForm !== 'All') params.append('form', filterForm);
        if (filterStatus !== 'All') params.append('status', filterStatus);

        const res = await fetch(`/api/market/listings?${params.toString()}`);
        const data = await res.json();
        if (ignore) return;
        if (!res.ok) throw new Error(data.error || 'Failed to load listings');

        setListings(data.listings);
        setSelectedListing((prev) => prev ?? (data.listings.length > 0 ? data.listings[0] : null));
        setLoading(false);
      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Error fetching listings');
          setLoading(false);
        }
      }
    };

    fetchMarketListings();
    return () => {
      ignore = true;
    };
  }, [filterDistrict, filterForm, filterStatus]);

  // Load details & nearest buyers for selected listing
  useEffect(() => {
    if (!selectedListing) return;

    let isMounted = true;
    const listingId = selectedListing.id;
    const district = selectedListing.district;

    fetch(`/api/market/listings/${listingId}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success) {
          setSelectedOffers(data.offers || []);
        }
      })
      .catch(() => {});

    fetch(`/api/market/nearest-buyers?district=${encodeURIComponent(district)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success) {
          setNearestBuyers(data.buyers || []);
          setLoadingBuyers(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingBuyers(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedListing]);

  // Handle Offer Submission by Demo Buyer
  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing) return;

    setIsSubmittingOffer(true);
    setOfferSuccessMsg(null);

    try {
      const payload = {
        listingId: selectedListing.id,
        buyerId: selectedBuyerProfile.id,
        buyerName: selectedBuyerProfile.name,
        buyerType: selectedBuyerProfile.type,
        buyerContact: '98111-DEMO',
        pricePerQuintal: Number(offerPrice),
        proposedPickupDate: offerDate,
        shortNote: offerNote.trim() || 'Ready for farmgate loading with tractor trolley.',
        isDemo: true,
      };

      const res = await fetch('/api/market/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit offer');

      setOfferSuccessMsg('✓ Demo Offer submitted! The listing status is now updated to "Offered".');
      setOfferNote('');

      // Refresh listings and current offer list
      setSelectedOffers((prev) => [data.offer, ...prev]);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to submit offer');
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  const getStatusBadge = (status: ListingStatus) => {
    switch (status) {
      case 'listed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Open Listing</span>;
      case 'offered':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Offer Received</span>;
      case 'accepted':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Offer Accepted</span>;
      case 'pickup_scheduled':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">Pickup Scheduled</span>;
      case 'collected':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">Collected</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Banner (Mandatory Product Rule) */}
      <div className="bg-amber-950/80 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-200 text-center font-medium flex items-center justify-center gap-2">
        <HelpCircle className="w-4 h-4 shrink-0 text-amber-400" />
        <span>This site connects farmers and buyers. It does not handle payment or guarantee a sale. Settle directly.</span>
      </div>

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-20 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-emerald-400 font-bold text-lg hover:text-emerald-300">
            <span className="text-xl">🌾</span>
            <span>KrishiVayu</span>
          </Link>
          <span className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-medium">
            Residue Marketplace
          </span>
          <span className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-full font-semibold">
            Demo Badge
          </span>
        </div>

        {/* Role Switcher Pill & Sell Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-xl p-1 text-xs">
            <button
              onClick={() => setUserRole('public')}
              className={`px-2.5 py-1 rounded-lg transition-colors min-h-[32px] ${
                userRole === 'public' ? 'bg-slate-700 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Public View
            </button>
            <button
              onClick={() => setUserRole('buyer')}
              className={`px-2.5 py-1 rounded-lg transition-colors min-h-[32px] flex items-center gap-1 ${
                userRole === 'buyer' ? 'bg-cyan-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🏭 Demo Buyer</span>
            </button>
          </div>

          <Link
            href="/market/sell"
            className="min-h-[40px] px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-900/30"
          >
            <PlusCircle className="w-4 h-4" />
            <span>List Stubble</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Filter Toolbar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-emerald-400" />
            <span>Filters:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* District Filter */}
            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[38px]"
            >
              <option value="All">All Districts</option>
              {PUNJAB_DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Form Filter */}
            <select
              value={filterForm}
              onChange={(e) => setFilterForm(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[38px]"
            >
              <option value="All">All Forms</option>
              <option value="baled">📦 Baled Bundles</option>
              <option value="loose">🌾 Loose Straw</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[38px]"
            >
              <option value="All">All Statuses</option>
              <option value="listed">Open</option>
              <option value="offered">Offered</option>
              <option value="accepted">Accepted</option>
              <option value="pickup_scheduled">Scheduled</option>
              <option value="collected">Collected</option>
            </select>
          </div>
        </div>

        {/* 2-Column Split: Listings List (Left) + Interactive Synced Map (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Listings Scrollable Feed (7 cols) */}
          <div className="lg:col-span-7 space-y-3.5">
            {loading && (
              <div className="text-center py-12 text-slate-400">Loading marketplace listings...</div>
            )}

            {error && (
              <div className="p-4 bg-red-950/60 border border-red-500/40 rounded-xl text-red-200 text-sm">
                {error}
              </div>
            )}

            {!loading && listings.length === 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
                <p className="text-slate-400 text-sm">No listings match the selected filters.</p>
                <button
                  onClick={() => { setFilterDistrict('All'); setFilterForm('All'); setFilterStatus('All'); }}
                  className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs text-white"
                >
                  Reset Filters
                </button>
              </div>
            )}

            {listings.map((l) => {
              const isSelected = selectedListing?.id === l.id;
              return (
                <div
                  key={l.id}
                  onClick={() => setSelectedListing(l)}
                  className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/30 shadow-xl'
                      : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-white">
                          {l.village}, <span className="text-slate-400 font-normal">{l.district}</span>
                        </h2>
                        {l.isDemo && (
                          <span className="text-[10px] uppercase font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded">
                            Demo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Available: {l.availability.startDate} to {l.availability.endDate}
                      </p>
                    </div>
                    {getStatusBadge(l.status)}
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/80 my-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Quantity</span>
                      <span className="font-semibold text-emerald-400 text-sm">{l.quantityQuintals} Qtl</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Residue Form</span>
                      <span className="font-semibold text-slate-200">
                        {l.form === 'baled' ? '📦 Baled' : '🌾 Loose'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Asking Rate</span>
                      <span className="font-semibold text-slate-200">
                        {l.askingPricePerQuintal ? `₹${l.askingPricePerQuintal}/Q` : 'Negotiable'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Truck className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{l.offersCount ?? 0} Offers received</span>
                    </span>
                    <span className="text-emerald-400 font-medium hover:underline flex items-center gap-1">
                      View Details →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Synced Map & Selected Listing Detail Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
            {/* Synced Market Map Component */}
            <div className="h-[280px] w-full">
              <MarketMap
                listings={listings}
                selectedListing={selectedListing}
                onSelectListing={(l) => setSelectedListing(l)}
              />
            </div>

            {/* Selected Listing Inspection & Offer Drawer */}
            {selectedListing ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      ID: {selectedListing.id}
                    </span>
                    <h2 className="text-lg font-bold text-white">
                      {selectedListing.village}, {selectedListing.district}
                    </h2>
                  </div>
                  {getStatusBadge(selectedListing.status)}
                </div>

                {/* Privacy reassurance pill */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 mb-4 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    Farmer contact is strictly private. It will only be unlocked if the farmer accepts your pickup offer.
                  </span>
                </div>

                {/* Offers on this Listing */}
                <div className="mb-5">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Active Offers ({selectedOffers.length})</span>
                    <Clock className="w-3.5 h-3.5" />
                  </h3>

                  {selectedOffers.length === 0 ? (
                    <div className="p-3 bg-slate-950/50 rounded-xl text-xs text-slate-500 text-center border border-slate-800/60">
                      No offers submitted yet. Be the first buyer to submit an offer!
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {selectedOffers.map((off) => (
                        <div
                          key={off.id}
                          className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl text-xs space-y-1"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-white">{off.buyerName}</span>
                            <span className="font-bold text-emerald-400">₹{off.pricePerQuintal}/Qtl</span>
                          </div>
                          <div className="flex justify-between text-slate-400 text-[11px]">
                            <span>Pickup: {off.proposedPickupDate}</span>
                            <span className="capitalize px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                              {off.status}
                            </span>
                          </div>
                          {off.shortNote && (
                            <p className="text-slate-400 text-[11px] italic mt-1 bg-slate-900/60 p-1.5 rounded">
                              &ldquo;{off.shortNote}&rdquo;
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sourced Nearby Facilities (From alternatives.json) */}
                <div className="mb-5 border-t border-slate-800/80 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Nearby Clean Alternatives
                    </h3>
                    <span className="text-[10px] text-slate-500">Directory Lookup</span>
                  </div>

                  {loadingBuyers ? (
                    <p className="text-xs text-slate-500">Matching nearby facilities...</p>
                  ) : (
                    <div className="space-y-2">
                      {nearestBuyers.map((b) => (
                        <div
                          key={b.id}
                          className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-slate-200">{b.name}</span>
                              {b.isLowConfidence && (
                                <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/30 px-1 py-0.2 rounded font-bold uppercase">
                                  Verify
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400">
                              approx. {b.approxDistanceKm} km away · {b.district}
                            </p>
                          </div>
                          <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-1 rounded">
                            {b.isOperational ? 'Operational' : 'Catalog'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Demo Buyer Action: Make an Offer Form */}
                <div className="border-t border-slate-800/80 pt-4">
                  {userRole !== 'buyer' ? (
                    <div className="bg-cyan-950/30 border border-cyan-500/20 rounded-xl p-3 text-center">
                      <p className="text-xs text-cyan-300 mb-2">
                        Want to submit an offer for this residue?
                      </p>
                      <button
                        onClick={() => setUserRole('buyer')}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-md"
                      >
                        Switch to Demo Buyer Mode
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitOffer} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-1">
                          <Send className="w-3.5 h-3.5" /> Submit Offer (Demo)
                        </h4>
                        <span className="text-[10px] text-cyan-400/80 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                          Demo Simulation
                        </span>
                      </div>

                      {offerSuccessMsg && (
                        <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300">
                          {offerSuccessMsg}
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Select Demo Buyer Account
                        </label>
                        <select
                          value={selectedBuyerProfile.id}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'demo_buyer_pellet_01') {
                              setSelectedBuyerProfile({
                                id: 'demo_buyer_pellet_01',
                                name: 'Malwa Bio-Pellet Unit (Demo)',
                                type: 'pellet_unit',
                              });
                            } else if (val === 'demo_buyer_cbg_02') {
                              setSelectedBuyerProfile({
                                id: 'demo_buyer_cbg_02',
                                name: 'Doaba Green Gas Collector (Demo)',
                                type: 'cbg_plant',
                              });
                            } else {
                              setSelectedBuyerProfile({
                                id: 'demo_buyer_agg_03',
                                name: 'Sutlej Biomass Aggregators (Demo)',
                                type: 'aggregator',
                              });
                            }
                          }}
                          className="w-full min-h-[38px] bg-slate-800 border border-slate-700 rounded-xl px-2.5 text-xs text-white"
                        >
                          <option value="demo_buyer_pellet_01">🏭 Malwa Bio-Pellet Unit (Demo)</option>
                          <option value="demo_buyer_cbg_02">⛽ Doaba Green Gas Collector (Demo)</option>
                          <option value="demo_buyer_agg_03">🚛 Sutlej Biomass Aggregators (Demo)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">
                            Offer Rate (₹ / Qtl)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={offerPrice}
                            onChange={(e) => setOfferPrice(e.target.value)}
                            className="w-full min-h-[38px] bg-slate-800 border border-slate-700 rounded-xl px-2.5 text-xs text-white font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">
                            Pickup Date
                          </label>
                          <input
                            type="date"
                            value={offerDate}
                            onChange={(e) => setOfferDate(e.target.value)}
                            className="w-full min-h-[38px] bg-slate-800 border border-slate-700 rounded-xl px-2 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          placeholder="Short note (e.g. loader truck ready)"
                          value={offerNote}
                          onChange={(e) => setOfferNote(e.target.value)}
                          className="w-full min-h-[38px] bg-slate-800 border border-slate-700 rounded-xl px-2.5 text-xs text-white placeholder-slate-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingOffer}
                        className="w-full min-h-[42px] bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-md"
                      >
                        {isSubmittingOffer ? 'Submitting...' : 'Send Offer to Farmer'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-500">
                Select a listing card to view details, nearest facilities, and offers.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
