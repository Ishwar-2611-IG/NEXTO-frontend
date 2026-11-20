import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface SortOption<T extends string = string> {
  label: string;
  value: T;
}

interface SortDropdownProps<T extends string> {
  label?: string;
  options: SortOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SortDropdown<T extends string>({
  label = 'Sort by',
  options,
  value,
  onChange,
}: SortDropdownProps<T>) {
  const id = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const selectedOption = options[selectedIndex];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) optionRefs.current[activeIndex]?.focus();
  }, [activeIndex, isOpen]);

  const openDropdown = (index = selectedIndex) => {
    setActiveIndex(index);
    setIsOpen(true);
  };

  const selectOption = (option: SortOption<T>) => {
    onChange(option.value);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleListboxKeyDown = (event: ReactKeyboardEvent<HTMLUListElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((index) => (index + direction + options.length) % options.length);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      setActiveIndex(event.key === 'Home' ? 0 : options.length - 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const option = options[activeIndex];
      if (option) selectOption(option);
    }
  };

  return (
    <div ref={dropdownRef} role="group" aria-labelledby={`${id}-label`} className="inline-flex items-center gap-2.5 font-sans">
      <span id={`${id}-label`} className="text-sm font-medium text-[#66645F]">
        {label}:
      </span>
      <div className="relative min-w-[190px]">
        <button
          ref={triggerRef}
          type="button"
          aria-label={selectedOption ? `${label}: ${selectedOption.label}` : label}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={`${id}-listbox`}
          disabled={options.length === 0}
          onClick={() => (isOpen ? setIsOpen(false) : openDropdown())}
          onKeyDown={(event) => {
            if (!isOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
              event.preventDefault();
              openDropdown();
            }
          }}
          className="flex w-full items-center justify-between rounded-lg border border-[#7E7C77]/25 bg-[#FFFCF7] px-3.5 py-2.5 text-sm font-medium text-[#2E2D2B] shadow-sm transition hover:border-[#6B7B6E]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6B7B6E] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>{selectedOption?.label ?? 'Select an option'}</span>
          <ChevronDown
            aria-hidden="true"
            className={`size-4 text-[#7E7C77] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <ul
            id={`${id}-listbox`}
            role="listbox"
            aria-label={label}
            onKeyDown={handleListboxKeyDown}
            className="absolute right-0 z-20 mt-1.5 max-h-60 w-full overflow-y-auto rounded-lg border border-[#7E7C77]/20 bg-[#FFFCF7] py-1 shadow-lg ring-1 ring-black/5"
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <li
                  key={option.value}
                  ref={(element) => {
                    optionRefs.current[index] = element;
                  }}
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={activeIndex === index ? 0 : -1}
                  onFocus={() => setActiveIndex(index)}
                  onClick={() => selectOption(option)}
                  className={`flex cursor-pointer items-center justify-between px-3.5 py-2 text-sm transition-colors focus:outline-none ${
                    isSelected
                      ? 'bg-[#6B7B6E]/10 font-semibold text-[#526457]'
                      : 'text-[#2E2D2B] hover:bg-[#F0EBE2]'
                  }`}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check aria-hidden="true" className="size-4 text-[#526457]" />}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default SortDropdown;
