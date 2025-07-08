import React from 'react';
import { Copy } from 'lucide-react';

const MarkdownRenderer = ({ content, className = "", isStreaming = false }) => {
  const renderContent = (text) => {
    const parts = text.split(/(```[\s\S]*?```|`[^`]*`)/g);

    const renderedParts = parts.map((part, index) => {
      if (part.startsWith('```')) {
        const lines = part.split('\n');
        const language = lines[0].replace('```', '').trim();
        const code = lines.slice(1, -1).join('\n');

        return (
          <div key={index} className="my-3 bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50">
            {language && (
              <div className="bg-slate-700/30 px-4 py-2 text-xs text-slate-300 border-b border-slate-600/30 flex items-center justify-between">
                <span className="font-mono">{language}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(code)}
                  className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-600/30"
                  title="Copy code"
                >
                  <Copy size={14} />
                </button>
              </div>
            )}
            <div className="relative">
              <pre className="p-4 text-sm overflow-x-auto">
                <code className="text-emerald-400 font-mono">{code}</code>
              </pre>
              {!language && (
                <button
                  onClick={() => navigator.clipboard.writeText(code)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-600/30"
                  title="Copy code"
                >
                  <Copy size={14} />
                </button>
              )}
            </div>
          </div>
        );
      } else if (part.startsWith('`') && part.endsWith('`')) {
        const code = part.slice(1, -1);
        return (
          <code key={index} className="bg-slate-700/40 px-2 py-1 rounded-md text-sm text-emerald-400 font-mono border border-slate-600/30">
            {code}
          </code>
        );
      } else {
        return (
          <span key={index} className="whitespace-pre-wrap">
            {part.split(/(\*\*.*?\*\*|\*.*?\*)/g).map((subPart, subIndex) => {
              if (subPart.startsWith('**') && subPart.endsWith('**')) {
                return <strong key={subIndex} className="font-semibold">{subPart.slice(2, -2)}</strong>;
              } else if (subPart.startsWith('*') && subPart.endsWith('*')) {
                return <em key={subIndex} className="italic">{subPart.slice(1, -1)}</em>;
              }
              return subPart;
            })}
          </span>
        );
      }
    });

    if (isStreaming) {
      renderedParts.push(
        <span key="cursor" className="inline-block w-2 h-5 bg-emerald-400 ml-1 animate-pulse rounded-sm align-bottom"></span>
      );
    }

    return renderedParts;
  };

  return <div className={className}>{renderContent(content)}</div>;
};

export default MarkdownRenderer;