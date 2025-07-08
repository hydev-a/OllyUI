import React, { useState } from 'react';
import { Copy } from 'lucide-react';

const CopyButton = ({ content, className = "" }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`text-slate-400 hover:text-white transition-all duration-200 p-1.5 rounded-lg hover:bg-slate-600/30 ${className}`}
      title={copied ? "Copied!" : "Copy message"}
    >
      <Copy size={14} />
      {copied && <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-xs px-2 py-1 rounded shadow-lg">Copied!</span>}
    </button>
  );
};

export default CopyButton;