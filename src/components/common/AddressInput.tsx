
import React, { useState, useEffect, useRef } from 'react';
import { mapService, AddressResult } from '@/services/map';

// Implementing simple debounce hook locally if not exists to ensure self-contained component
function useLocalDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

interface AddressInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onSelect'> {
    label: string;
    value: string;
    onChange: (value: string) => void;
    onSelect?: (address: AddressResult) => void;
}

export const AddressInput: React.FC<AddressInputProps> = ({
    label,
    value,
    onChange,
    onSelect,
    className,
    ...props
}) => {
    const [suggestions, setSuggestions] = useState<AddressResult[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Only search if user is actively typing and value is changed
    const debouncedSearchTerm = useLocalDebounce(value, 800);

    useEffect(() => {
        const fetchAddresses = async () => {
            if (debouncedSearchTerm && debouncedSearchTerm.length > 2) {
                setIsLoading(true);
                try {
                    const results = await mapService.searchAddress(debouncedSearchTerm);
                    setSuggestions(results);
                    setShowSuggestions(true);
                } catch (error) {
                    console.error("Failed to fetch addresses", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        };

        // Only fetch if suggestions aren't already showing (to avoid re-fetching on selection)
        // Actually, we want to fetch when *debounced* term changes. 
        // Optimization: If the current value matches exactly one of the known suggestions, strictly speaking we might not need to search,
        // but users might still be typing. Let's keep it simple.
        fetchAddresses();
    }, [debouncedSearchTerm]);

    // Close suggestions when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const handleSelect = (address: AddressResult) => {
        onChange(address.display_name);
        setShowSuggestions(false);
        if (onSelect) {
            onSelect(address);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
        // Hide suggestions immediately if cleared, otherwise wait for debounce
        if (e.target.value.length < 3) {
            setShowSuggestions(false);
        }
    };

    return (
        <div className="space-y-1.5" ref={wrapperRef}>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
            <div className="relative group w-full">
                <div className="relative">
                    <input
                        type="text"
                        value={value}
                        onChange={handleInputChange}
                        placeholder="Hãy nhập địa chỉ..."
                        autoComplete="off"
                        className={`w-full py-2.5 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold text-slate-800 text-sm shadow-sm hover:border-indigo-300 ${className}`}
                        {...props}
                    />

                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                        <i className="fa-solid fa-map-location-dot text-xs"></i>
                    </div>

                    {isLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <i className="fa-solid fa-circle-notch fa-spin text-indigo-500 text-xs"></i>
                        </div>
                    )}
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-[1000] left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto overflow-hidden animate-slideDown">
                        <ul className="py-2">
                            {suggestions.map((item) => (
                                <li
                                    key={item.place_id}
                                    onClick={() => handleSelect(item)}
                                    className="px-4 py-2 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0 text-xs text-slate-700 font-medium transition-colors flex items-start gap-3 group/item"
                                >
                                    <i className="fa-solid fa-location-dot text-slate-300 group-hover/item:text-indigo-500 mt-0.5 shrink-0 transition-colors"></i>
                                    <span className="line-clamp-2">{item.display_name}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};
