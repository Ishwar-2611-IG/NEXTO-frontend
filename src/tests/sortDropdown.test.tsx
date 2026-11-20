import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SortDropdown } from '../components/common/SortDropdown';

const options = [
  { label: 'Featured', value: 'featured' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
];

describe('SortDropdown', () => {
  it('updates the selected value when an option is chosen', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<SortDropdown options={options} value="featured" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Sort by: Featured' }));

    await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Price: Low to High' }));

    expect(onChange).toHaveBeenCalledWith('price-asc');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<SortDropdown options={options} value="featured" onChange={vi.fn()} />);

    const trigger = screen.getByRole('button', { name: 'Sort by: Featured' });
    await user.click(trigger);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
