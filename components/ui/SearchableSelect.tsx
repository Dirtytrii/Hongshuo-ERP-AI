import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export interface SearchableSelectOption {
  value: string | number;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  maxHeight?: string;
  disabled?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = '请选择或输入检索...',
  className = '',
  inputClassName = '',
  maxHeight = '240px',
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const displayText = selectedOption ? selectedOption.label : '';

  const filteredOptions = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (opt: SearchableSelectOption) => {
    onChange(opt.value);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => !disabled && setOpen(!open)}
        className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between cursor-pointer min-h-[47px] ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${inputClassName}`}
      >
        <span className={selectedOption ? 'text-slate-800' : 'text-slate-400'}>{displayText || placeholder}</span>
        <ChevronDown size={18} className={`text-slate-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && (
        <div
          className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
          style={{ maxHeight: 'min(400px, 60vh)' }}
        >
          <div className="p-2 border-b bg-slate-50 sticky top-0">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="输入关键字检索..."
                className="flex-1 outline-none text-sm min-w-0"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="overflow-y-auto overscroll-contain py-1" style={{ maxHeight }} role="listbox">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-6 text-center text-slate-400 text-sm">无匹配项</div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  role="option"
                  aria-selected={opt.value === value}
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-100 focus:bg-slate-100 outline-none ${opt.value === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'}`}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
