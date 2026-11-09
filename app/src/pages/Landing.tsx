import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, GraduationCap, MonitorPlay, Trophy, Sparkles, 
  ChevronRight, CheckCircle2, ShieldCheck, Zap
} from 'lucide-react';

export function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <MonitorPlay size={24} className="text-blue-400" />,
      title: "Real CBT Simulation",
      desc: "Experience the exact JAMB interface. Timers, subject tabs, and the exact 180-question format."
    },
    {
      icon: <Sparkles size={24} className="text-purple-400" />,
      title: "AI Tutor",
      desc: "Stuck on a question? Tap 'Ask AI' and get a step-by-step explanation instantly."
    },
    {
      icon: <BookOpen size={24} className="text-green-400" />,
      title: "13,000+ Questions",
      desc: "A massive database covering 27 subjects, complete with detailed corrections."
    },
    {
      icon: <Trophy size={24} className="text-yellow-400" />,
      title: "Leaderboards & Streaks",
      desc: "Compete with other students nationwide and build a daily study streak."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">CBT Master</span>
          </div>
          <button 
            onClick={() => navigate('/login')}
            className="text-sm font-bold bg-white text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Log In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-blue-400 mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            The smartest way to prep for JAMB 2026
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
            Pass JAMB with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">AI Power.</span>
          </h1>
          <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Stop studying blindly. Practice with 13,000+ AI-generated questions, simulate the real CBT exam, and get instant explanations from your personal AI Tutor.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2"
            >
              Start Practicing Free <ChevronRight size={20} />
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              Take a Free CBT Mock
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Why use CBT Master?</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Everything you need to score 300+ in your UTME, all in one place.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 hover:border-slate-600 transition-colors">
                <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-4 border border-slate-700">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
                <p className="text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / Stats Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-800/50 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Ready to ace your exam?</h2>
            <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm font-medium">
              <div className="flex items-center gap-2 text-slate-300"><CheckCircle2 size={18} className="text-green-400"/> No credit card required</div>
              <div className="flex items-center gap-2 text-slate-300"><ShieldCheck size={18} className="text-green-400"/> 100% Free to start</div>
              <div className="flex items-center gap-2 text-slate-300"><Zap size={18} className="text-green-400"/> Instant AI feedback</div>
            </div>
            <button 
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors shadow-xl"
            >
              Create Free Account
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-4 text-center text-sm text-slate-500">
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
