import React, { useState } from 'react';

export default function CodeSnippet({ code, language = 'javascript' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-snippet">
      <div className="code-header">
        <span>{language}</span>
        <button onClick={handleCopy}>{copied ? 'Copied!' : 'Copy'}</button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}
