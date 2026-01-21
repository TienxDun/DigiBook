
import React, { useState, useEffect, useRef } from 'react';
import { mapService, AddressResult } from '../services/map';

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
        <div className="relative group" ref={wrapperRef}>
            <input
                type="text"
                value={value}
                onChange={handleInputChange}
                placeholder=" "
                autoComplete="off"
                className={`peer w-full pt-6 pb-2 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:bg-white focus:border-indigo-500 transition-all font-bold text-slate-800 placeholder-shown:pt-4 placeholder-shown:pb-4 ${className}`}
                {...props}
            />
            <label className="absolute left-4 top-4 text-slate-400 text-xs font-bold uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[9px] peer-focus:text-indigo-500 pointer-events-none">
                {label}
            </label>

            {isLoading && (
                <div className="absolute right-4 top-4">
                    <i className="fa-solid fa-circle-notch fa-spin text-indigo-500"></i>
                </div>
            )}

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-[1000] left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto overflow-hidden">
                    <ul>
                        {suggestions.map((item) => (
                            <li
                                key={item.place_id}
                                onClick={() => handleSelect(item)}
                                className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 text-sm text-slate-700 font-medium transition-colors flex items-start gap-3"
                            >
                                <i className="fa-solid fa-location-dot text-indigo-400 mt-1 shrink-0"></i>
                                <span className="line-clamp-2">{item.display_name}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
