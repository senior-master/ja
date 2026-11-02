import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/useExamStore';
import { BookOpen, GraduationCap, MonitorPlay, ArrowRight, User, Mail } from 'lucide-react';

export function Home() {
  const navigate = useNavigate();
  const { user, login, setExamMode, resetExam } = useExamStore();
  
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');

  // ── SCREEN 1: LOGIN ──
  if (!user) {
    const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if (name.trim() && contact.trim()) {
        login(name, contact);
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">CBT Master</h1>
            <p className="text-slate-500 mt-2 text-sm">Enter your details to start practicing</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email or Phone Number</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="e.g. john@example.com or 08012345678"
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold mt-4 transition-colors">
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── SCREEN 2: MODE SELECTION ──
  const modes = [
    {
      id: 'cbt',
      title: 'CBT Master (Real Exam)',
      desc: '4 subjects. 180 questions. 120 minutes. Simulate the real JAMB UTME.',
      icon: <MonitorPlay size={24} />,
      color: 'bg-green-50 text-green-700 border-green-200 hover:border-green-400'
    },
    {
      id: 'practice',
      title: 'Practice Mode',
      desc: 'Pick subjects. Choose your question count. Set your own time.',
      icon: <BookOpen size={24} />,
      color: 'bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-400'
    },
    {
      id: 'learning',
      title: 'Learning Mode',
      desc: 'Pick subjects. Get instant feedback with explanations after every answer.',
      icon: <GraduationCap size={24} />,
      color: 'bg-purple-50 text-purple-700 border-purple-200 hover:border-purple-400'
    }
  ];

  const handleModeSelect = (mode: any) => {
    setExamMode(mode);
    resetExam(); 
    
    if (mode === 'cbt') navigate('/cbt-setup');
    else if (mode === 'practice') navigate('/practice-setup');
    else if (mode === 'learning') navigate('/learning-setup');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-24 max-w-2xl mx-auto">
      <header className="mt-6 mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome back,</h1>
          <p className="text-blue-600 font-bold text-lg">{user.name}</p>
        </div>
        <button onClick={() => useExamStore.getState().logout()} className="text-xs font-bold text-slate-400 hover:text-red-500">
          Log out
        </button>
      </header>

      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Choose Your Mode</h2>
        {modes.map(mode => (
          <button
            key={mode.id}
            onClick={() => handleModeSelect(mode.id)}
            className={`w-full text-left p-5 rounded-xl border-2 transition-all flex items-start gap-4 ${mode.color}`}
          >
            <div className="p-2 bg-white rounded-lg shadow-sm">{mode.icon}</div>
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
