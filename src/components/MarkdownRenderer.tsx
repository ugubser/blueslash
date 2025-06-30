import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  if (!content.trim()) return null;

  return (
    <div className={className}>
      <ReactMarkdown
        components={{
        // Customize rendering to match your app's styling
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-bold text-gray-800">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        a: ({ href, children }) => {
          // Ensure URLs have protocol and open in new tab
          let finalHref = href || '';
          if (finalHref && !finalHref.startsWith('http://') && !finalHref.startsWith('https://')) {
            finalHref = 'https://' + finalHref;
          }
          return (
            <a 
              href={finalHref} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-mario-blue hover:text-blue-700 underline"
            >
              {children}
            </a>
          );
        },
        ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
        li: ({ children }) => <li className="mb-1">{children}</li>,
        // Disable heading rendering since we handle titles separately
        h1: ({ children }) => <div className="font-bold text-base mb-1">{children}</div>,
        h2: ({ children }) => <div className="font-bold text-base mb-1">{children}</div>,
        h3: ({ children }) => <div className="font-bold text-base mb-1">{children}</div>,
        h4: ({ children }) => <div className="font-bold text-base mb-1">{children}</div>,
        h5: ({ children }) => <div className="font-bold text-base mb-1">{children}</div>,
        h6: ({ children }) => <div className="font-bold text-base mb-1">{children}</div>,
      }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;