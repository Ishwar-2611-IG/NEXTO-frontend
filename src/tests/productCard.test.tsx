import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ProductCard } from '../components/common/ProductCard';
import type { Product } from '../types';

const product: Product = {
  id: 991,
  name: 'Test Oversized Tee',
  price: 1799,
  category: 'T-Shirts',
  img: '/images/fashion-fallback.svg',
  colors: ['#2E2D2B'],
};

describe('ProductCard quick add', () => {
  it('renders a quick-add control that adds the current product to the bag', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();

    render(
      <MemoryRouter>
        <ProductCard
          product={product}
          addLabel="Add to Bag"
          wishlisted={false}
          onAdd={onAdd}
          onToggleWishlist={vi.fn()}
        />
      </MemoryRouter>,
    );

    const quickAdd = screen.getByRole('button', { name: 'Quick add Test Oversized Tee to bag' });
    expect(quickAdd).toHaveClass('product-card-add');
    expect(quickAdd).toHaveClass('group-hover:translate-y-0');

    await user.click(quickAdd);
    expect(onAdd).toHaveBeenCalledWith(product);
  });
});
