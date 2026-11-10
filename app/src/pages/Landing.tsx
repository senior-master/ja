import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, GraduationCap, MonitorPlay, Trophy, Sparkles, 
  ChevronRight, CheckCircle2, ShieldCheck, Zap
} from 'lucide-react';

export function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <MonitorPlay size={24} className="text-amber-500" />,
      title: "Real CBT Simulation",
      desc: "Experience the exact JAMB interface. Timers, subject tabs, and the exact 180-question format."
    },
    {
      icon: <Sparkles size={24} className="text-amber-500" />,
      title: "Smart Tutor",
      desc: "Stuck on a question? Tap 'Ask Tutor' and get a step-by-step explanation instantly."
    },
    {
      icon: <BookOpen size={24} className="text-amber-500" />,
      title: "13,000+ Questions",
      desc: "A massive database covering 27 subjects, complete with detailed corrections."
    },
    {
      icon: <Trophy size={24} className="text-amber-500" />,
      title: "Leaderboards & Streaks",
      desc: "Compete with other students nationwide and build a daily study streak."
    }
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 font-sans selection:bg-amber-500/30">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-800 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              <GraduationCap size={20} className="text-black" />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">CBT Master</span>
          </div>
          <button 
            onClick={() => navigate('/login')}
            className="text-sm font-bold bg-white text-black px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors"
          >
            Log In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Bybit-style Yellow Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/15 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-amber-500 mb-6">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span>
            The smartest way to prep for JAMB 2026
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
            Pass JAMB with <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Smart Prep.</span>
          </h1>
          <p className="text-lg text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Stop studying blindly. Practice with 13,000+ expert-curated questions, simulate the real CBT exam, and get instant step-by-step explanations.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all shadow-[0_0_25px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2"
            >
              Start Practicing Free <ChevronRight size={20} />
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl border border-zinc-800 transition-colors flex items-center justify-center gap-2"
            >
              Take a Free CBT Mock
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-zinc-950/50 border-y border-zinc-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Why use CBT Master?</h2>
            <p className="text-zinc-400 max-w-xl mx-auto">Everything you need to score 300+ in your UTME, all in one place.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/50 hover:border-amber-500/30 transition-colors group">
                <div className="w-12 h-12 bg-zinc-950 rounded-xl flex items-center justify-center mb-4 border border-zinc-800 group-hover:border-amber-500/50 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / Stats Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        {/* Subtle bottom glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Ready to ace your exam?</h2>
            <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm font-medium">
              <div className="flex items-center gap-2 text-zinc-300"><CheckCircle2 size={18} className="text-amber-500"/> No credit card required</div>
              <div className="flex items-center gap-2 text-zinc-300"><ShieldCheck size={18} className="text-amber-500"/> 100% Free to start</div>
              <div className="flex items-center gap-2 text-zinc-300"><Zap size={18} className="text-amber-500"/> Instant smart feedback</div>
            </div>
            <button 
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors shadow-xl"
            >
              Create Free Account
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-8 px-4 text-center text-sm text-zinc-500">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 CBT Master. Not affiliated with JAMB.</p>
          <div className="flex gap-4">
            <button onClick={() => navigate('/privacy')} className="hover:text-white transition-colors">Privacy Policy</button>
            <button onClick={() => navigate('/terms')} className="hover:text-white transition-colors">Terms of Service</button>
            <a href="mailto:algotred.a1v1@gmail.com" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
