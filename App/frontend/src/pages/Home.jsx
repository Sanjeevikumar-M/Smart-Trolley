import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import sessionManager from '../utils/sessionManager';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [trolleyId, setTrolleyId] = useState(null);

  useEffect(() => {
    const id = sessionManager.getTrolleyId();
    if (id) {
      setIsConnected(true);
      setTrolleyId(id);
    }
  }, []);

  return (
    <div className="py-8 relative overflow-hidden min-h-screen">
      {/* Animated Background Orbs */}
      <div className="bg-orb bg-orb-1"></div>
      <div className="bg-orb bg-orb-2"></div>
      <div className="bg-orb bg-orb-3"></div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i}
            className="particle"
            style={{
              left: `${15 + i * 15}%`,
              animationDelay: `${i * 1.5}s`,
              animationDuration: `${8 + i * 2}s`
            }}
          />
        ))}
      </div>

      <div className="max-w-2xl mx-auto text-center relative z-10">
        {/* Hero Section */}
        <div className="mb-12 animate-fade-in-up">
          <div className="relative inline-block mb-8">
            {/* Glowing ring effect */}
            <div className="absolute inset-0 w-32 h-32 mx-auto rounded-3xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 blur-2xl opacity-60 animate-pulse"></div>
            <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-3xl flex items-center justify-center text-white shadow-2xl animate-float glow-blue">
              <span className="text-6xl drop-shadow-lg">🛒</span>
            </div>
          </div>
          
          <h1 className="text-5xl font-black tracking-tight mb-4">
            <span className="text-gradient">Smart</span>
            <span className="text-white">Trolley</span>
          </h1>
          <p className="text-xl text-slate-400 font-medium max-w-md mx-auto">
            The future of shopping is here. Scan, shop, and checkout with zero queues.
          </p>
        </div>

        {/* Connection Status */}
        {isConnected ? (
          <div className="card p-8 mb-8 animate-slide-in relative overflow-hidden">
            {/* Success gradient border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-cyan-500 to-blue-500"></div>
            
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="relative">
                <div className="w-4 h-4 bg-emerald-400 rounded-full animate-ping absolute"></div>
                <div className="w-4 h-4 bg-emerald-400 rounded-full relative"></div>
              </div>
              <span className="text-xl font-bold text-emerald-400">Connected & Ready</span>
            </div>
            
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 mb-6 border border-cyan-500/20">
              <p className="text-sm text-slate-400 mb-2 uppercase tracking-wider font-medium">Trolley ID</p>
              <p className="text-3xl font-black font-mono text-gradient">{trolleyId}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Link
                to="/cart"
                className="btn-primary py-4 rounded-2xl flex items-center justify-center gap-3 text-lg group"
              >
                <span className="text-2xl group-hover:animate-bounce">🛒</span>
                <span>View Cart</span>
              </Link>
              <Link
                to="/connect"
                className="btn-secondary py-4 rounded-2xl flex items-center justify-center gap-3 text-lg group"
              >
                <span className="text-2xl group-hover:rotate-12 transition-transform">📷</span>
                <span>New Scan</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Main CTA Card */}
            <Link
              to="/connect"
              className="block card p-10 group hover:scale-[1.02] transition-all duration-500 relative overflow-hidden animate-border-glow"
            >
              {/* Animated gradient border */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-cyan-500/50 rounded-tl-3xl"></div>
              <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-purple-500/50 rounded-br-3xl"></div>
              
              <div className="relative z-10">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 border border-cyan-500/30 backdrop-blur-sm">
                  <span className="text-5xl">📷</span>
                </div>
                <h2 className="text-3xl font-black text-white mb-3">Scan QR Code</h2>
                <p className="text-lg text-slate-400 mb-6">Connect to your smart trolley and start shopping instantly</p>
                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-cyan-500/25 group-hover:shadow-2xl group-hover:shadow-cyan-500/40 transition-all btn-glow">
                  <span>Get Started</span>
                  <span className="text-2xl group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </div>
            </Link>

            {/* Features Grid - Redesigned */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { icon: '⚡', title: 'Lightning Fast', desc: 'Skip queues', color: 'from-yellow-400 to-orange-500' },
                { icon: '🔒', title: 'Secure Pay', desc: 'Bank-level', color: 'from-emerald-400 to-cyan-500' },
                { icon: '🌱', title: 'Eco Smart', desc: 'Zero paper', color: 'from-green-400 to-emerald-500' },
              ].map((feature, i) => (
                <div 
                  key={feature.title}
                  className="card p-5 text-center hover-lift animate-fade-in-up group cursor-pointer"
                  style={{ animationDelay: `${i * 0.1 + 0.2}s` }}
                >
                  <div className={`w-16 h-16 mx-auto bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-3 text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className="font-bold text-white text-sm">{feature.title}</h3>
                  <p className="text-xs text-slate-500">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Stats Section */}
            <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="grid grid-cols-3 divide-x divide-slate-700">
                {[
                  { value: '50K+', label: 'Happy Users' },
                  { value: '99.9%', label: 'Uptime' },
                  { value: '< 30s', label: 'Checkout' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center px-4">
                    <div className="text-2xl font-black text-gradient">{stat.value}</div>
                    <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Trust Badges - Redesigned */}
        <div className="mt-12 flex items-center justify-center gap-8 text-slate-500 text-sm animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <span className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700">
            <span className="text-cyan-400">✓</span> Secure
          </span>
          <span className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700">
            <span className="text-cyan-400">✓</span> Fast
          </span>
          <span className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700">
            <span className="text-cyan-400">✓</span> Reliable
          </span>
        </div>
      </div>
    </div>
  );
}
