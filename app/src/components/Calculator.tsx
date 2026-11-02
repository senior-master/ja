import { useState } from 'react';
import { X } from 'lucide-react';

export function Calculator({ onClose }: { onClose: () => void }) {
  const [display, setDisplay] = useState('0');

  const handleBtn = (val: string) => {
    if (val === 'C') { setDisplay('0'); return; }
    if (val === '=') {
      try { setDisplay(eval(display).toString()); } catch { setDisplay('Error'); }
      return;
    }
    if (display === '0' || display === 'Error') setDisplay(val);
    else setDisplay(display + val);
  };

  const buttons = ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+', 'C'];

  return (
    <div className="fixed bottom-4 right-4 w-64 bg-white rounded-xl shadow-2xl border-2 border-slate-300 z-50 overflow-hidden">
      <div className="flex justify-between items-center p-2 bg-slate-800 text-white">
        <span className="text-xs font-bold tracking-wider">CALCULATOR</span>
        <button onClick={onClose} className="p-1 hover:bg-slate-600 rounded"><X size={16} /></button>
      </div>
      <div className="p-2 bg-slate-100">
        <div className="bg-white border text-right p-3 mb-2 rounded font-mono text-xl overflow-x-auto shadow-inner">
          {display}
        </div>
        <div className="grid grid-cols-4 gap-1">
          {buttons.map(b => (
            <button key={b} onClick={() => handleBtn(b)} className="bg-white border shadow-sm hover:bg-slate-200 p-2 rounded font-bold text-slate-700">
              {b}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
