import { describe, it, expect } from 'vitest';
import { formatPrice } from './format';

describe('formatPrice', () => {
    it('formats positive numbers correctly with VND currency', () => {
        // Note: The specific output depends on the Node.js locale data, 
        // but usually it is "100.000 ₫" or "100.000 ₫" (with non-breaking space)
        const result = formatPrice(100000);
        expect(result).toMatch(/100\.000/);
        expect(result).toContain('₫');
    });

    it('formats zero correctly', () => {
        const result = formatPrice(0);
        expect(result).toMatch(/0/);
        expect(result).toContain('₫');
    });

    it('formats large numbers correctly', () => {
        const result = formatPrice(1000000000);
        expect(result).toMatch(/1\.000\.000\.000/);
    });
});
