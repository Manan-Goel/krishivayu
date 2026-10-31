'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Alert & Match' },
  { href: '/trends', label: 'Historical Trends' },
];

export function Navbar() {
  const path = usePathname();

  return (
    <nav className="flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-white/10 backdrop-blur-md bg-[#020714]/85 sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2.5 group">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-black text-emerald-400 text-xs">
          KV
        </div>
        <div className="flex flex-col">
          <span className="text-white font-bold tracking-wider uppercase text-sm leading-tight group-hover:text-emerald-400 transition-colors">
            KrishiVayu
          </span>
          <span className="text-[10px] text-gray-400 font-medium">Burn Alert to Buyer Match</span>
        </div>
        <span className="hidden sm:inline-block text-[10px] font-mono text-emerald-400/90 border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 rounded">
          LIVE
        </span>
      </Link>

      <div className="flex items-center gap-1.5">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              path === l.href
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400/80">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="hidden md:inline">VIIRS NRT · DELHI PLUME SHIELD</span>
      </div>
    </nav>
  );
}
