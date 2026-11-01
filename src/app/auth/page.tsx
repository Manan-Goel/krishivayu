'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [role, setRole] = useState<'farmer' | 'buyer' | 'public'>('farmer');
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    // Store demo session in localStorage
    const sessionData = {
      role,
      name: name.trim() || (role === 'farmer' ? 'Demo Farmer' : role === 'buyer' ? 'Demo Buyer' : 'Public Viewer'),
      identifier: identifier.trim() || 'demo-user',
      loggedInAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('krishivayu_user', JSON.stringify(sessionData));
    }

    setTimeout(() => {
      if (role === 'farmer') {
        router.push('/market/sell');
      } else {
        router.push('/market');
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-emerald-400 font-bold text-2xl mb-2">
            <span>🌾</span> KrishiVayu
          </Link>
          <h1 className="text-xl font-bold text-white">Simulated Authentication</h1>
          <p className="text-xs text-slate-400 mt-1">
            Demo Portal Access · No password required
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-8 animate-in fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 animate-bounce" />
            <p className="text-white font-medium">Entering as {role.toUpperCase()}...</p>
            <p className="text-xs text-slate-400 mt-1">Redirecting to marketplace...</p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Select Portal Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('farmer')}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium transition-colors ${
                    role === 'farmer'
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  🌾 Farmer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('buyer')}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium transition-colors ${
                    role === 'buyer'
                      ? 'bg-cyan-600 border-cyan-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  🏭 Buyer (Demo)
                </button>
                <button
                  type="button"
                  onClick={() => setRole('public')}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium transition-colors ${
                    role === 'public'
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  👁️ Public
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Name (Optional)
              </label>
              <input
                type="text"
                placeholder={role === 'farmer' ? 'e.g. Gurpreet Singh' : role === 'buyer' ? 'e.g. Malwa Biomass Buyer' : 'Guest'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full min-h-[44px] bg-slate-800 border border-slate-700 rounded-xl px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {role === 'farmer' ? 'Phone Number (Optional)' : 'Demo Identifier / Org'}
              </label>
              <input
                type="text"
                placeholder={role === 'farmer' ? '98765-XXXXX' : 'DEMO-ORG-01'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full min-h-[44px] bg-slate-800 border border-slate-700 rounded-xl px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-xs text-slate-400 flex items-start gap-2">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Demonstration login for evaluation. In production, farmers manage listings via secure unguessable tokens with no registration barrier.
              </span>
            </div>

            <button
              type="submit"
              className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-900/30"
            >
              <span>Continue to Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
