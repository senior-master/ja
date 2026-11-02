import { InlineMath, BlockMath } from 'react-katex';

export function MathText({ text, className = '' }: { text: string; className?: string }) {
  if (!text) return null;

  let parsedText = text;

  // ── AUTO-DETECT RAW MATH ──
  // If the AI didn't use $ delimiters, we look for raw exponents and subscripts
  if (!parsedText.includes('$') && !parsedText.includes('\\(') && !parsedText.includes('\\[')) {
    // 1. Wrap exponents (e.g. 2^x, x^2, x^{2})
    parsedText = parsedText.replace(/([a-zA-Z0-9]+)\^(\{[^}]+\}|[a-zA-Z0-9]+)/g, '\\($1^{$2}\\)');
    
    // 2. Wrap subscripts (e.g. log_2, H_2O)
    parsedText = parsedText.replace(/([a-zA-Z0-9]+)_(\{[^}]+\}|[a-zA-Z0-9]+)/g, '\\($1_{$2}\\)');
    
    // 3. Wrap raw fractions \frac{a}{b}
    parsedText = parsedText.replace(/(\\frac\{[^}]+\}\{[^}]+\})/g, '\\($1\\)');
    
    // 4. Wrap raw square roots \sqrt{x}
    parsedText = parsedText.replace(/(\\sqrt\{[^}]+\})/g, '\\($1\\)');
  }

  // ── SPLIT TEXT AND MATH ──
  // Matches $$...$$, \[...\], \(...\), or $...$
  const parts = parsedText.split(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$[^$]*?\$)/g);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          return <BlockMath key={index} math={part.slice(2, -2)} />;
        } else if (part.startsWith('\\[') && part.endsWith('\\]')) {
          return <BlockMath key={index} math={part.slice(2, -2)} />;
        } else if (part.startsWith('\\(') && part.endsWith('\\)')) {
          return <InlineMath key={index} math={part.slice(2, -2)} />;
        } else if (part.startsWith('$') && part.endsWith('$')) {
          return <InlineMath key={index} math={part.slice(1, -1)} />;
        } else {
          return <span key={index}>{part}</span>;
        }
      })}
    </span>
  );
}
