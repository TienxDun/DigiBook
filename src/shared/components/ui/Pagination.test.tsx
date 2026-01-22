
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Pagination from './Pagination';
import React from 'react';

describe('Pagination Component', () => {
    it('renders all pages when totalPages is small (<= 5)', () => {
        const onPageChange = vi.fn();
        render(<Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />);

        // Should see buttons 1, 2, 3, 4, 5
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.queryByText('...')).not.toBeInTheDocument();
    });

    it('highlights the current page', () => {
        const onPageChange = vi.fn();
        render(<Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />);

        const activePage = screen.getByText('3');
        // Check for active class properties (e.g., bg-indigo-600 or just check if it's there)
        // Since we use Tailwind classes, exact class match might be brittle, 
        // checking if it renders is often enough for unit test, but let's check class for "active" state indication
        expect(activePage.className).toContain('bg-indigo-600');
    });

    it('calls onPageChange when a page is clicked', () => {
        const onPageChange = vi.fn();
        render(<Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />);

        fireEvent.click(screen.getByText('3'));
        expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('calls onPageChange on Next/Prev click', () => {
        const onPageChange = vi.fn();
        render(<Pagination currentPage={2} totalPages={5} onPageChange={onPageChange} />);

        const prevBtn = screen.getByLabelText('Previous page');
        const nextBtn = screen.getByLabelText('Next page');

        fireEvent.click(prevBtn);
        expect(onPageChange).toHaveBeenCalledWith(1);

        fireEvent.click(nextBtn);
        expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('disables Prev button on first page', () => {
        const onPageChange = vi.fn();
        render(<Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />);

        const prevBtn = screen.getByLabelText('Previous page') as HTMLButtonElement;
        expect(prevBtn.disabled).toBe(true);
    });

    it('disables Next button on last page', () => {
        const onPageChange = vi.fn();
        render(<Pagination currentPage={5} totalPages={5} onPageChange={onPageChange} />);

        const nextBtn = screen.getByLabelText('Next page') as HTMLButtonElement;
        expect(nextBtn.disabled).toBe(true);
    });

    it('renders ellipsis correctly for many pages', () => {
        // Case: 1 ... 4 5 6 ... 10 (Current: 5, Total: 10)
        const onPageChange = vi.fn();
        render(<Pagination currentPage={5} totalPages={10} onPageChange={onPageChange} />);

        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getAllByText('•••')).toHaveLength(2); // Should see 2 ellipsis
    });

    it('renders only right ellipsis when at start', () => {
        // Case: 1 2 3 ... 10 (Current: 1, Total: 10)
        const onPageChange = vi.fn();
        render(<Pagination currentPage={1} totalPages={10} onPageChange={onPageChange} />);

        // Logic: 1, delta is 1 -> end is min(9, 1+1=2) -> 1, 2. But start is max(2, 0).
        // Let's re-verify the logic in Pagination.tsx
        // If totalPages > 5:
        // push 1
        // currentPage=1. Not > delta+2 (1 !> 3). No left ellipsis.
        // start = max(2, 0) = 2. end = min(9, 2) = 2.
        // loop 2 to 2. push 2.
        // currentPage=1 < 10 - 2 = 8. Push right ellipsis.
        // push 10.
        // Result: 1, 2, ..., 10.

        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getAllByText('•••')).toHaveLength(1);
    });
});
