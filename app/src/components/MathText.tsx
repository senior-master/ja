import { InlineMath, BlockMath } from 'react-katex';

export function MathText({ text, className = '' }: { text: string; className?: string }) {
  if (!text) return null;

  // Split by block math ($$...$$) or inline math ($...$)
  // This regex captures the math blocks so they stay in the array
  const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/g);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          // Block Math (centered, large)
          const math = part.slice(2, -2);
          return <BlockMath key={index} math={math} />;
        } else if (part.startsWith('$') && part.endsWith('$')) {
          // Inline Math
          const math = part.slice(1, -1);
          return <InlineMath key={index} math={math} />;
        } else {
          // Plain text
          return <span key={index}>{part}</span>;
        }
      })}
    </span>
  );
}
