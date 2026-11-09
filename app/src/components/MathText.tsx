import { InlineMath, BlockMath } from 'react-katex';

export function MathText({ text, className = '' }: { text: string; className?: string }) {
  if (!text) return null;

  let parsedText = text;

  if (!parsedText.includes('$') && !parsedText.includes('\\(') && !parsedText.includes('\\[')) {
    parsedText = parsedText.replace(/([a-zA-Z0-9]+)\^(\{[^}]+\}|[a-zA-Z0-9]+)/g, '\\($1^{$2}\\)');
    parsedText = parsedText.replace(/([a-zA-Z0-9]+)_(\{[^}]+\}|[a-zA-Z0-9]+)/g, '\\($1_{$2}\\)');
    parsedText = parsedText.replace(/(\\frac\{[^}]+\}\{[^}]+\})/g, '\\($1\\)');
    parsedText = parsedText.replace(/(\\sqrt\{[^}]+\})/g, '\\($1\\)');
  }

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
