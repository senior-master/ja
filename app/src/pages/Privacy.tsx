import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 pb-24 max-w-2xl mx-auto transition-colors">
      <header className="mt-4 mb-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Privacy Policy</h1>
      </header>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm leading-relaxed space-y-4">
        <p className="text-xs text-slate-400">Last Updated: November 2026</p>
        
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-4">1. Introduction</h2>
        <p>Welcome to CBT Master. We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you use our application.</p>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-4">2. Information We Collect</h2>
        <p>We collect the following types of information:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Account Data:</strong> Your name, email address, and encrypted password when you register.</li>
          <li><strong>Usage Data:</strong> Your exam scores, topic performance, and app activity (like streaks and leaderboard rankings).</li>
          <li><strong>AI Interactions:</strong> Questions or prompts you submit to the AI Tutor feature.</li>
        </ul>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-4">3. How We Use Your Data</h2>
        <p>We use your information to provide and improve the app, including:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Tracking your progress and displaying your scores.</li>
          <li>Powering the Leaderboard and Daily Streaks.</li>
          <li>Using AI (Google Gemini) to generate explanations for questions you ask about.</li>
          <li>Sending important updates or responding to your feedback.</li>
        </ul>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-4">4. Third-Party Services</h2>
        <p>We use secure third-party providers to run our app:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Supabase:</strong> For secure database hosting and authentication.</li>
          <li><strong>Google Gemini:</strong> For generating AI explanations. Your prompts are sent to Google securely.</li>
          <li><strong>Cloudflare:</strong> To securely route AI requests and protect our servers.</li>
        </ul>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-4">5. Data Security & Your Rights</h2>
        <p>We implement strict security measures (like Row Level Security) to protect your data. In accordance with the Nigeria Data Protection Act (NDPA), you have the right to access, correct, or delete your personal data. To delete your account, please contact us.</p>
        
        <p className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-700">If you have any questions, contact us at algotred.a1v1@gmail.com.</p>
      </div>
    </div>
  );
}
