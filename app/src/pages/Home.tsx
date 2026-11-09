import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/useExamStore';
import { supabase } from '../services/questions';
import { BookOpen, GraduationCap, MonitorPlay, ArrowRight, Mail, Lock, User, Shield, Flame, Trophy, Moon, Sun } from 'lucide-react';

export function Home() {
  const navigate = useNavigate();
  const { user, setUser, setExamMode, resetExam, profile, setProfile, theme, setTheme } = useExamStore();
  
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 🔐 REPLACE THIS WITH YOUR ACTUAL ADMIN EMAIL
  const ADMIN_EMAIL = "abdul01abdul03@gmail.com"; 

  // Check if user is already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  // ── STREAK LOGIC ──
  useEffect(() => {
    if (!user) return;
    
    const checkStreak = async () => {
      // Fetch or create profile
      let { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      
      if (!profileData) {
        // Fallback if trigger didn't run for older users
        const { data: newProfile } = await supabase.from('profiles').insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email.split('@')[0],
          streak: 1,
          last_active: new Date().toISOString().split('T')[0]
        }).select().single();
        profileData = newProfile;
      }
      
      if (profileData) {
        const today = new Date().toISOString().split('T')[0];
        const lastActive = profileData.last_active;
        
        if (lastActive === today) {
          setProfile(profileData);
        } else {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          let newStreak = profileData.streak;
          if (lastActive === yesterdayStr) {
            newStreak += 1;
          } else {
            newStreak = 1;
          }
          
          const { data: updated } = await supabase.from('profiles').update({
            streak: newStreak,
            last_active: today
          }).eq('id', user.id).select().single();
          
          if (updated) setProfile(updated);
        }
      }
    };
    checkStreak();
  }, [user, setProfile]);

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { data: { full_name: name } }
        });
        if (error) throw error;
        alert("Account created successfully! You can now log in.");
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    if (theme === 'system') setTheme('dark');
    else if (theme === 'dark') setTheme('light');
    else setTheme('system');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  // ── SCREEN 1: LOGIN / SIGNUP ──
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 transition-colors">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-100 dark:border-slate-700">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">CBT Master</h1>
            <p className="text-slate-500 mt-1 text-sm">
              {isLogin ? 'Welcome back! Log in to continue.' : 'Create an account to track your progress.'}
            </p>
          </div>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center font-medium">{error}</div>}

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400" size={20} />
                <input 
                  type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>
            )}
            
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400" size={20} />
              <input 
                type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
              <input 
                type="password" placeholder={isLogin ? "Password" : "Create Password"} value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
            </div>

            {!isLogin && (
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                <input 
                  type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>
            )}
            
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold mt-2 transition-colors disabled:opacity-50">
              {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={switchMode} className="text-sm font-bold text-blue-600 hover:text-blue-800">
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── SCREEN 2: MODE SELECTION ──
  const modes = [
    { id: 'cbt', title: 'CBT Master (Real Exam)', desc: '4 subjects. 180 questions. 120 minutes.', icon: <MonitorPlay size={24} />, color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 hover:border-green-400' },
    { id: 'practice', title: 'Practice Mode', desc: 'Pick subjects. Choose your question count and timer.', icon: <BookOpen size={24} />, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:border-blue-400' },
    { id: 'learning', title: 'Learning Mode', desc: 'Pick specific topics. Get instant feedback.', icon: <GraduationCap size={24} />, color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:border-purple-400' }
  ];

  const handleModeSelect = (mode: any) => {
    setExamMode(mode);
    resetExam(); 
    if (mode === 'cbt') navigate('/cbt-setup');
    else if (mode === 'practice') navigate('/practice-setup');
    else if (mode === 'learning') navigate('/learning-setup');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 pb-24 max-w-2xl mx-auto transition-colors">
      <header className="mt-6 mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Welcome,</h1>
          <p className="text-blue-600 font-bold text-lg">{user.user_metadata?.full_name || user.email.split('@')[0]}</p>
          {profile && (
            <div className="flex items-center gap-1 mt-2 bg-orange-100 text-orange-600 px-2 py-1 rounded-lg w-fit text-sm font-bold border border-orange-200">
              <Flame size={16} className="fill-orange-500" /> {profile.streak} Day Streak!
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <button onClick={toggleTheme} className="p-2 text-slate-500 hover:text-blue-600 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            {theme === 'dark' ? <Moon size={16} /> : theme === 'light' ? <Sun size={16} /> : <MonitorPlay size={16} />}
          </button>
          <button onClick={() => navigate('/leaderboard')} className="text-xs font-bold text-yellow-700 bg-yellow-100 px-3 py-2 rounded-lg border border-yellow-300 hover:bg-yellow-200 flex items-center gap-1 dark:bg-yellow-900/30 dark:text-yellow-500 dark:border-yellow-700/50">
            <Trophy size={14} /> Leaderboard
          </button>
          {user.email === ADMIN_EMAIL && (
            <button onClick={() => navigate('/admin')} className="text-xs font-bold text-white bg-slate-800 px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-700 flex items-center gap-1">
              <Shield size={14} /> Admin
            </button>
          )}
          <button onClick={() => navigate('/dashboard')} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200 hover:bg-blue-100">
            My Progress
          </button>
          <button onClick={handleLogout} className="text-xs font-bold text-slate-400 hover:text-red-500 bg-white px-3 py-2 rounded-lg border border-slate-200">
            Log out
          </button>
        </div>
      </header>

      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Choose Your Mode</h2>
        {modes.map(mode => (
          <button key={mode.id} onClick={() => handleModeSelect(mode.id)} className={`w-full text-left p-5 rounded-xl border-2 transition-all flex items-start gap-4 ${mode.color}`}>
            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">{mode.icon}</div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-lg">{mode.title}</span>
                <ArrowRight size={20} className="opacity-50" />
              </div>
              <p className="text-sm opacity-80 leading-snug">{mode.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}


