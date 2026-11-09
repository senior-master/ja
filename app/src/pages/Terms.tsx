import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 pb-24 max-w-2xl mx-auto transition-colors">
      <header className="mt-4 mb-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Terms of Service</h1>
      </header>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm leading-relaxed space-y-4">
        <p className="text-xs text-slate-400">Last Updated: November 2026</p>
        
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-4">1. Acceptance of Terms</h2>
        <p>By creating an account and using CBT Master, you agree to these Terms of Service. If you do not agree, please do not use the app.</p>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-4">2. Not Affiliated with JAMB</h2>
        <p><strong>CBT Master is an independent educational platform.</strong> We are not affiliated with, endorsed by, or connected to the Joint Admissions and Matriculation Board (JAMB) or any official examination body. </p>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-4">3. Use of AI and Content Accuracy</h2>
        <p>Our questions and explanations are generated or enhanced using Artificial Intelligence. While we strive for accuracy, AI can occasionally make mistakes. You agree that you use the app for practice purposes and will verify critical information with official JAMB materials. We are not liable for any exam scores or academic outcomes.</p>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-4">4. User Conduct</h2>
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Use the app for any illegal purpose.</li>
          <li>Attempt to hack, scrape, or reverse-engineer the platform.</li>
          <li>Create multiple fake accounts to manipulate the Leaderboard.</li>
        </ul>
        <p>We reserve the right to ban accounts that violate these rules.</p>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-4">5. Modifications to Service</h2>
        <p>We may update, pause, or discontinue the app (or introduce premium paid features) at any time. We will try to provide advance notice of major changes.</p>
        
        <p className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-700">By using this app, you acknowledge that you have read and understood these terms.</p>
      </div>
    </div>
  );
}
