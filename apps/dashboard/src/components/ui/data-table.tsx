'use client';
import { ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Skeleton, EmptyState } from './primitives';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (row: T) => ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  emptyState?: ReactNode;
  onRowClick?: (row: T) => void;
  // Bulk Selection
  enableSelection?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  emptyState,
  onRowClick,
  enableSelection = false,
  selectedIds = new Set(),
  onSelectionChange,
}: DataTableProps<T>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSortKey = searchParams.get('sort');
  const currentSortOrder = searchParams.get('order') || 'asc';

  const handleSort = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (currentSortKey === key) {
      if (currentSortOrder === 'asc') {
        params.set('order', 'desc');
      } else {
        params.delete('sort');
        params.delete('order');
      }
    } else {
      params.set('sort', key);
      params.set('order', 'asc');
    }
    
    router.replace(`${pathname}?${params.toString()}`);
  };

  const toggleSelectAll = () => {
    if (!onSelectionChange) return;
    if (selectedIds.size === data.length && data.length > 0) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(data.map(keyExtractor)));
    }
  };

  const toggleRowSelect = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (!onSelectionChange) return;
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    onSelectionChange(newSet);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((x) => (
          <Skeleton key={x} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      emptyState || (
        <EmptyState title="No results found." description="Try adjusting your filters or search query." />
      )
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
          <tr>
            {enableSelection && (
              <th className="px-5 py-4 w-12 text-center">
                <input
                  type="checkbox"
                  checked={data.length > 0 && selectedIds.size === data.length}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                />
              </th>
            )}
            
            {columns.map((col) => (
              <th 
                key={col.key} 
                className={`px-5 py-4 font-bold ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}`}
              >
                {col.sortable ? (
                  <button
                    onClick={() => handleSort(col.key)}
                    className="group inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors"
                  >
                    {col.label}
                    <span className="flex items-center">
                      {currentSortKey === col.key ? (
                        currentSortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-50" />
                      )}
                    </span>
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row) => {
            const id = keyExtractor(row);
            const isSelected = selectedIds.has(id);
            
            return (
              <tr 
                key={id} 
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition duration-200 ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'} ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {enableSelection && (
                  <td className="px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => toggleRowSelect(id, e)}
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                    />
                  </td>
                )}
                
                {columns.map((col) => (
                  <td 
                    key={col.key} 
                    className={`px-5 py-4 ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}`}
                  >
                    {col.render ? col.render(row) : (row as any)[col.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
