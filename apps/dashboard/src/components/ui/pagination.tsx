'use client';
import { useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage?: number;
}

export function Pagination({ currentPage, totalPages, totalItems, itemsPerPage = 20 }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updatePage = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-border bg-white px-6 py-4 sm:flex-row">
      <span className="text-sm font-medium text-slate-600">
        Showing <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
        <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{' '}
        <span className="font-bold text-slate-900">{totalItems}</span> results
      </span>
      
      <div className="flex items-center gap-2">
        <button
          disabled={currentPage <= 1}
          onClick={() => updatePage(currentPage - 1)}
          className="flex h-9 items-center justify-center gap-1 rounded-lg border border-border bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>
        
        <div className="flex items-center gap-1 px-2 text-sm font-medium text-slate-600">
          Page {currentPage} of {totalPages}
        </div>
        
        <button
          disabled={currentPage >= totalPages}
          onClick={() => updatePage(currentPage + 1)}
          className="flex h-9 items-center justify-center gap-1 rounded-lg border border-border bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
