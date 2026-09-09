'use client';

import React from 'react';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export function MarkdownPreview({ content, className = '' }: MarkdownPreviewProps) {
  if (!content || !content.trim()) {
    return (
      <div className={`p-8 text-center text-sm text-slate-400 italic ${className}`}>
        No content written yet. Write some markdown to see the live formatted preview.
      </div>
    );
  }

  // Parse markdown lines into structured elements
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let codeBlockLang = '';
  let inList = false;
  let listItems: string[] = [];
  let isNumberedList = false;
  let inTable = false;
  let tableRows: string[][] = [];

  const flushList = () => {
    if (!inList) return;
    const ListTag = isNumberedList ? 'ol' : 'ul';
    const listClass = isNumberedList
      ? 'list-decimal list-inside space-y-1 my-3 text-slate-700 text-sm'
      : 'list-disc list-inside space-y-1 my-3 text-slate-700 text-sm';
    elements.push(
      <ListTag key={`list-${elements.length}`} className={listClass}>
        {listItems.map((item, idx) => (
          <li key={idx} className="leading-relaxed">
            {formatInlineText(item)}
          </li>
        ))}
      </ListTag>
    );
    inList = false;
    listItems = [];
    isNumberedList = false;
  };

  const flushCodeBlock = () => {
    if (!inCodeBlock) return;
    elements.push(
      <div key={`code-${elements.length}`} className="my-4 overflow-hidden rounded-xl bg-slate-900 text-slate-100 shadow-md">
        {codeBlockLang && (
          <div className="border-b border-slate-800 bg-slate-950 px-4 py-1.5 text-[11px] font-mono font-bold text-slate-400">
            {codeBlockLang}
          </div>
        )}
        <pre className="p-4 font-mono text-xs leading-relaxed overflow-x-auto">
          <code>{codeBlockLines.join('\n')}</code>
        </pre>
      </div>
    );
    inCodeBlock = false;
    codeBlockLines = [];
    codeBlockLang = '';
  };

  const flushTable = () => {
    if (!inTable) return;
    if (tableRows.length > 0) {
      const headerRow = tableRows[0];
      const bodyRows = tableRows.slice(1);
      elements.push(
        <div key={`table-${elements.length}`} className="my-4 overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
              <tr>
                {headerRow.map((cell, idx) => (
                  <th key={idx} className="px-4 py-2.5">
                    {formatInlineText(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/50">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-2.5 text-slate-700">
                      {formatInlineText(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    inTable = false;
    tableRows = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        flushList();
        flushTable();
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Tables
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      flushList();
      const cells = line
        .trim()
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());

      // Check if it's separator row (e.g. |---|---|)
      if (cells.every((c) => /^:?-+:?$/.test(c))) {
        continue;
      }

      inTable = true;
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Headings
    if (line.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={`h1-${i}`} className="mt-6 mb-3 text-2xl font-black text-slate-900 border-b border-slate-200 pb-2">
          {formatInlineText(line.slice(2))}
        </h1>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={`h2-${i}`} className="mt-5 mb-2.5 text-xl font-extrabold text-slate-900">
          {formatInlineText(line.slice(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${i}`} className="mt-4 mb-2 text-lg font-bold text-slate-800">
          {formatInlineText(line.slice(4))}
        </h3>
      );
      continue;
    }
    if (line.startsWith('#### ')) {
      flushList();
      elements.push(
        <h4 key={`h4-${i}`} className="mt-3 mb-1.5 text-base font-bold text-slate-800">
          {formatInlineText(line.slice(5))}
        </h4>
      );
      continue;
    }

    // Horizontal Rule
    if (/^(\*\*\*|---|___)$/.test(line.trim())) {
      flushList();
      elements.push(<hr key={`hr-${i}`} className="my-6 border-slate-200" />);
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="my-3 rounded-r-xl border-l-4 border-primary bg-primary/5 px-4 py-3 italic text-slate-700 text-sm"
        >
          {formatInlineText(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Unordered List
    if (/^[-*+]\s+/.test(line.trim())) {
      if (!inList || isNumberedList) {
        flushList();
        inList = true;
        isNumberedList = false;
      }
      listItems.push(line.trim().replace(/^[-*+]\s+/, ''));
      continue;
    }

    // Numbered List
    if (/^\d+\.\s+/.test(line.trim())) {
      if (!inList || !isNumberedList) {
        flushList();
        inList = true;
        isNumberedList = true;
      }
      listItems.push(line.trim().replace(/^\d+\.\s+/, ''));
      continue;
    }

    // Plain empty line
    if (!line.trim()) {
      flushList();
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={`p-${i}`} className="my-2.5 text-sm leading-relaxed text-slate-700">
        {formatInlineText(line)}
      </p>
    );
  }

  flushList();
  flushCodeBlock();
  flushTable();

  return <div className={`prose-slate max-w-none text-left ${className}`}>{elements}</div>;
}

// Inline Markdown Formatter: bold, italic, inline code, links, images
function formatInlineText(text: string): React.ReactNode {
  if (!text) return null;

  // Split by markdown delimiters and parse iteratively
  const tokens: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Images: ![alt](url)
    const imgMatch = remaining.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (imgMatch) {
      tokens.push(
        <img
          key={key++}
          src={imgMatch[2]}
          alt={imgMatch[1]}
          className="my-3 max-h-96 rounded-xl border border-slate-200 object-cover shadow-sm"
        />
      );
      remaining = remaining.slice(imgMatch[0].length);
      continue;
    }

    // Links: [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      tokens.push(
        <a
          key={key++}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary underline hover:text-primary/80"
        >
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Bold: **text**
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      tokens.push(
        <strong key={key++} className="font-bold text-slate-900">
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic: *text* or _text_
    const italicMatch = remaining.match(/^\*([^*]+)\*/) || remaining.match(/^_([^_]+)_/);
    if (italicMatch) {
      tokens.push(
        <em key={key++} className="italic text-slate-800">
          {italicMatch[1]}
        </em>
      );
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Inline code: `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      tokens.push(
        <code
          key={key++}
          className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-primary border border-slate-200/80"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Strikethrough: ~~text~~
    const strikeMatch = remaining.match(/^~~([^~]+)~~/);
    if (strikeMatch) {
      tokens.push(
        <span key={key++} className="line-through text-slate-400">
          {strikeMatch[1]}
        </span>
      );
      remaining = remaining.slice(strikeMatch[0].length);
      continue;
    }

    // Regular character slice until next delimiter
    const nextSpecial = remaining.search(/(\!\[|\[|\*\*|\*|_|`|~~)/);
    if (nextSpecial === -1) {
      tokens.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      tokens.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      tokens.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return <>{tokens}</>;
}
