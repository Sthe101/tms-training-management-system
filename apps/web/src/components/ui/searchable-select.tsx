'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export interface SelectOption {
  id: string;
  name: string;
}

interface SearchableSelectProps {
  placeholder: string;
  items: SelectOption[];
  selected: SelectOption | null;
  onSelect: (item: SelectOption) => void;
  disabled?: boolean;
}

export function SearchableSelect({
  placeholder,
  items,
  selected,
  onSelect,
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3 py-2 border rounded-md text-sm transition-colors ${
          disabled
            ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200'
            : 'bg-white text-gray-900 cursor-pointer border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0891b2] focus:border-transparent'
        }`}
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded border border-gray-200">
              <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="flex-1 text-sm bg-transparent outline-none text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-3">No results found</p>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelect(item);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-[#e0f2fe] transition-colors ${
                    selected?.id === item.id
                      ? 'bg-[#e0f2fe] text-[#0891b2] font-medium'
                      : 'text-gray-800'
                  }`}
                >
                  {item.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
