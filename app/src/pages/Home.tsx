import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/useExamStore';
import { supabase } from '../services/questions';
import { BookOpen, GraduationCap, MonitorPlay, ArrowRight, Mail, Lock, User, Shield, Flame, Trophy, ChevronDown } from 'lucide-react';

export function Home() {
  const navigate = useNavigate();
  const { user, setUser, setExamMode, resetExam, profile, setProfile } = useExamStore();
  
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const ADMIN_EMAIL = "abdul01abdul03@gmail.com";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user || null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => subscription.unsubscribe();
  }, [setUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) return;
    const checkStreak = async () => {
      let { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (!profileData) {
        const { data: newProfile } = await supabase.from('profiles').insert({
          id: user.id, full_name: user.user_metadata?.full_name || user.email.split('@')[0],
          streak: 1, last_active: new Date().toISOString().split('T')[0]
        }).select().single();
        profileData = newProfile;
      }
      if (profileData) {
        const today = new Date().toISOString().split('T')[0];
        if (profileData.last_active === today) {
          setProfile(profileData);
        } else {
          const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          let newStreak = profileData.last_active === yesterdayStr ? profileData.streak + 1 : 1;
          const { data: updated } = await supabase.from('profiles').update({ streak: newStreak, last_active: today }).eq('id', user.id).select().single();
          if (updated) setProfile(updated);
        }
      }
    };
    checkStreak();
  }, [user, setProfile]);

  const switchMode = () => { setIsLogin(!isLogin); setError(''); setPassword(''); setConfirmPassword(''); };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!isLogin && password !== confirmPassword) return setError("Passwords do not match.");
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
        if (error) throw error;
        alert("Account created! You can now log in."); setIsLogin(true);
      }
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); setUser(null); setProfile(null); setIsMenuOpen(false); };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4 text-zinc-300">
        <div className="w-full max-w-md bg-zinc-900 rounded-2xl shadow-xl p-8 border border-zinc-800">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
              <GraduationCap size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white">CBT Master</h1>
            <p className="text-zinc-400 mt-1 text-sm">
              {isLogin ? 'Welcome back! Log in to continue.' : 'Create an account to track your progress.'}
            </p>
          </div>

          {error && <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm mb-4 text-center font-medium border border-red-500/20">{error}</div>}

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3 top-3 text-zinc-500" size={20} />
                <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-white placeholder-zinc-500" />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-zinc-500" size={20} />
              <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-white placeholder-zinc-500" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-zinc-500" size={20} />
              <input type="password" placeholder={isLogin ? "Password" : "Create Password"} value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-white placeholder-zinc-500" />
            </div>
            {!isLogin && (
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-zinc-500" size={20} />
                <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-white placeholder-zinc-500" />
              </div>
            )}
            <button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-400 text-black py-3 rounded-lg font-bold mt-2 transition-colors disabled:opacity-50">
              {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button onClick={switchMode} className="text-sm font-bold text-amber-500 hover:text-amber-400">
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
            </button>
          </div>
          <div className="mt-8 pt-4 border-t border-zinc-800 text-center flex justify-center gap-4 text-xs text-zinc-500">
            <button onClick={() => navigate('/privacy')} className="hover:text-amber-500 transition-colors">Privacy Policy</button>
            <span>•</span>
            <button onClick={() => navigate('/terms')} className="hover:text-amber-500 transition-colors">Terms of Service</button>
          </div>
        </div>
      </div>
    );
  }

  const modes = [
    { id: 'cbt', title: 'CBT Master', desc: '4 subjects. 180 questions. 120 minutes.', icon: <MonitorPlay size={28} />, color: 'bg-zinc-800/50 text-amber-500 border-zinc-700' },
    { id: 'practice', title: 'Practice Mode', desc: 'Pick subjects. Choose your question count and timer.', icon: <BookOpen size={28} />, color: 'bg-zinc-800/50 text-amber-500 border-zinc-700' },
    { id: 'learning', title: 'Learning Mode', desc: 'Pick specific topics. Get instant feedback.', icon: <GraduationCap size={28} />, color: 'bg-zinc-800/50 text-amber-500 border-zinc-700' }
  ];

  const handleModeSelect = (mode: any) => {
    setExamMode(mode); resetExam(); 
    if (mode === 'cbt') navigate('/cbt-setup');
    else if (mode === 'practice') navigate('/practice-setup');
    else if (mode === 'learning') navigate('/learning-setup');
  };

  return (
    <div className="min-h-screen bg-[#09090b] p-4 pb-24 max-w-2xl mx-auto text-zinc-200">
      
      <header className="mt-4 mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-1">Dashboard</h1>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white capitalize">
              {user.user_metadata?.full_name?.split(' ')[0] || user.email.split('@')[0]}
            </h2>
            {profile && (
              <div className="flex items-center gap-1 bg-orange-500/10 text-orange-500 px-2 py-1 rounded-md text-xs font-bold border border-orange-500/20">
                <Flame size={14} className="fill-orange-500" /> {profile.streak}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2" ref={menuRef}>
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 p-1.5 pl-3 bg-zinc-900 rounded-xl border border-zinc-800 shadow-sm hover:bg-zinc-800 transition-colors"
            >
              <span className="text-sm font-bold text-zinc-200 hidden sm:block">Menu</span>
              <div className="w-8 h-8 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center font-bold">
                {user.email[0].toUpperCase()}
              </div>
              <ChevronDown size={16} className="text-zinc-500 mr-1" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-zinc-900 rounded-xl shadow-xl border border-zinc-800 overflow-hidden z-50 animate-slide-up" style={{ animationDuration: '0.2s' }}>
                <div className="p-2 space-y-1">
                  <button onClick={() => { navigate('/dashboard'); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-800 flex items-center gap-2">
                    <Trophy size={16} className="text-amber-500" /> My Progress
                  </button>
                  <button onClick={() => { navigate('/leaderboard'); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-800 flex items-center gap-2">
                    <Trophy size={16} className="text-amber-500" /> Leaderboard
                  </button>
                  {user.email === ADMIN_EMAIL && (
                    <button onClick={() => { navigate('/admin'); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-800 flex items-center gap-2">
                      <Shield size={16} className="text-zinc-400" /> Admin Panel
                    </button>
                  )}
                </div>
                <div className="p-2 border-t border-zinc-800">
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-red-400 hover:bg-red-500/10">
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="space-y-4">
        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider pl-1">Choose Your Mode</h2>
        {modes.map(mode => (
          <button 
            key={mode.id} 
            onClick={() => handleModeSelect(mode.id)} 
            className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 flex items-center gap-5 shadow-sm hover:shadow-md hover:border-amber-500/50 group ${mode.color}`}
          >
            <div className="p-3 bg-zinc-950 rounded-xl shadow-sm border border-zinc-800 group-hover:scale-110 transition-transform">
              {mode.icon}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-lg text-white">{mode.title}</span>
                <ArrowRight size={20} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-amber-500" />
              </div>
              <p className="text-sm text-zinc-400 leading-snug font-medium">{mode.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
