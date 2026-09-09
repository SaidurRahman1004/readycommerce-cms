'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink, CheckSquare, Square, Info } from 'lucide-react';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export function MarkdownPreview({ content, className = '' }: MarkdownPreviewProps) {
  if (!content || !content.trim()) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 text-center text-xs text-slate-400 italic ${className}`}>
        <Info className="h-4 w-4 mb-1 text-slate-300" />
        No documentation written yet.
      </div>
    );
  }

  // Parse markdown lines into structured React elements
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let codeBlockLang = '';
  let inList = false;
  let listItems: Array<{ text: string; isTask?: boolean; isChecked?: boolean }> = [];
  let isNumberedList = false;
  let inTable = false;
  let tableRows: string[][] = [];

  const flushList = () => {
    if (!inList) return;
    const ListTag = isNumberedList ? 'ol' : 'ul';
    const listClass = isNumberedList
      ? 'list-decimal list-outside pl-5 space-y-1.5 my-3 text-slate-700 text-sm'
      : 'list-disc list-outside pl-5 space-y-1.5 my-3 text-slate-700 text-sm';

    elements.push(
      <ListTag key={`list-${elements.length}`} className={listClass}>
        {listItems.map((item, idx) => {
          if (item.isTask) {
            return (
              <li key={idx} className="list-none -ml-5 flex items-start gap-2 text-sm leading-relaxed text-slate-700">
                {item.isChecked ? (
                  <CheckSquare className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                ) : (
                  <Square className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
                )}
                <span>{formatInlineText(item.text)}</span>
              </li>
            );
          }
          return (
            <li key={idx} className="leading-relaxed">
              {formatInlineText(item.text)}
            </li>
          );
        })}
      </ListTag>
    );
    inList = false;
    listItems = [];
    isNumberedList = false;
  };

  const flushCodeBlock = () => {
    if (!inCodeBlock) return;
    elements.push(
      <div key={`code-${elements.length}`} className="my-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 text-slate-100 shadow-md">
        {codeBlockLang && (
          <div className="border-b border-slate-800 bg-slate-950/80 px-4 py-1.5 text-[11px] font-mono font-bold text-slate-400">
            {codeBlockLang}
          </div>
        )}
        <pre className="p-4 font-mono text-xs leading-relaxed overflow-x-auto text-slate-200">
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
        <div key={`table-${elements.length}`} className="my-4 overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
              <tr>
                {headerRow.map((cell, idx) => (
                  <th key={idx} className="px-3.5 py-2.5">
                    {formatInlineText(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/60 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3.5 py-2.5 text-slate-700 leading-relaxed">
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
        <h1 key={`h1-${i}`} className="mt-5 mb-2.5 text-xl font-bold text-slate-900 border-b border-slate-200/80 pb-2">
          {formatInlineText(line.slice(2))}
        </h1>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={`h2-${i}`} className="mt-4 mb-2 text-lg font-bold text-slate-900">
          {formatInlineText(line.slice(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${i}`} className="mt-3.5 mb-1.5 text-base font-semibold text-slate-800">
          {formatInlineText(line.slice(4))}
        </h3>
      );
      continue;
    }
    if (line.startsWith('#### ')) {
      flushList();
      elements.push(
        <h4 key={`h4-${i}`} className="mt-3 mb-1 text-sm font-semibold text-slate-800">
          {formatInlineText(line.slice(5))}
        </h4>
      );
      continue;
    }

    // Horizontal Rule
    if (/^(\*\*\*|---|___)$/.test(line.trim())) {
      flushList();
      elements.push(<hr key={`hr-${i}`} className="my-5 border-slate-200" />);
      continue;
    }

    // Blockquote (Notes, Tips, Warnings)
    if (line.startsWith('> ')) {
      flushList();
      const quoteText = line.slice(2);
      const isWarning = quoteText.toLowerCase().includes('warning') || quoteText.toLowerCase().includes('caution');
      const isTip = quoteText.toLowerCase().includes('tip:') || quoteText.toLowerCase().includes('note:');

      elements.push(
        <blockquote
          key={`quote-${i}`}
          className={`my-3 rounded-xl border-l-4 px-4 py-3 text-sm leading-relaxed ${
            isWarning
              ? 'border-amber-500 bg-amber-50/70 text-amber-900'
              : isTip
              ? 'border-primary bg-primary/5 text-slate-800'
              : 'border-slate-300 bg-slate-50 text-slate-700 italic'
          }`}
        >
          {formatInlineText(quoteText)}
        </blockquote>
      );
      continue;
    }

    // Task items: - [ ] or - [x]
    if (/^[-*+]\s+\[([ xX])\]\s+/.test(line.trim())) {
      if (!inList) {
        flushList();
        inList = true;
        isNumberedList = false;
      }
      const match = line.trim().match(/^[-*+]\s+\[([ xX])\]\s+(.*)$/);
      if (match) {
        const isChecked = match[1].toLowerCase() === 'x';
        listItems.push({ text: match[2], isTask: true, isChecked });
        continue;
      }
    }

    // Unordered List (- item or * item)
    if (/^[-*+]\s+/.test(line.trim())) {
      if (!inList || isNumberedList) {
        flushList();
        inList = true;
        isNumberedList = false;
      }
      listItems.push({ text: line.trim().replace(/^[-*+]\s+/, '') });
      continue;
    }

    // Numbered List (1. item)
    if (/^\d+\.\s+/.test(line.trim())) {
      if (!inList || !isNumberedList) {
        flushList();
        inList = true;
        isNumberedList = true;
      }
      listItems.push({ text: line.trim().replace(/^\d+\.\s+/, '') });
      continue;
    }

    // Empty line
    if (!line.trim()) {
      flushList();
      continue;
    }

    // Regular Paragraph
    flushList();
    elements.push(
      <p key={`p-${i}`} className="my-2 text-sm leading-relaxed text-slate-700">
        {formatInlineText(line)}
      </p>
    );
  }

  // Flush remaining buffers
  flushList();
  flushCodeBlock();
  flushTable();

  return <div className={`prose prose-slate max-w-none ${className}`}>{elements}</div>;
}

// Inline formatting parser (bold, italic, strikethrough, inline code, links)
function formatInlineText(text: string): React.ReactNode[] {
  if (!text) return [];

  // Tokenizer pattern
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Bold (**text**)
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Italic (*text*)
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={index} className="italic text-slate-800">
          {part.slice(1, -1)}
        </em>
      );
    }

    // Strikethrough (~~text~~)
    if (part.startsWith('~~') && part.endsWith('~~') && part.length >= 4) {
      return (
        <del key={index} className="line-through text-slate-400">
          {part.slice(2, -2)}
        </del>
      );
    }

    // Inline Code (`code`)
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={index}
          className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[12px] font-semibold text-slate-800 border border-slate-200/60"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Link ([text](url))
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const linkText = linkMatch[1];
      const linkUrl = linkMatch[2];
      const isInternal = linkUrl.startsWith('/');

      if (isInternal) {
        return (
          <Link
            key={index}
            href={linkUrl}
            className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
          >
            {linkText}
          </Link>
        );
      }

      return (
        <a
          key={index}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 font-semibold text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
        >
          <span>{linkText}</span>
          <ExternalLink className="h-3 w-3 inline ml-0.5 opacity-70" />
        </a>
      );
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}
