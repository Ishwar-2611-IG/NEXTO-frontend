import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { AppRoutes } from '../app/routes';
// Warm the lazy-loaded home chunk so the async heading assertion below is not
// timing-sensitive when the whole suite runs in parallel.
import '../pages/Home/HomePage';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </MemoryRouter>,
  );

describe('routing', () => {
  it('renders the home page', async () => {
    renderAt('/');
    expect(await screen.findByRole('heading', { name: /new arrivals/i }, { timeout: 5000 })).toBeInTheDocument();
  });

  it('shows a 404 page for unknown URLs', async () => {
    renderAt('/nope');
    expect(await screen.findByText('LOST IN THE STREETS.')).toBeInTheDocument();
  });

  it('does not expose the removed first-admin setup page', async () => {
    renderAt('/setup');
    expect(await screen.findByText('LOST IN THE STREETS.')).toBeInTheDocument();
  });

  it('lets shoppers dismiss the delivery and returns announcement', async () => {
    renderAt('/');
    const announcement = await screen.findByRole('region', { name: 'Store delivery and returns information' });
    await userEvent.setup().click(within(announcement).getByRole('button', { name: 'Dismiss delivery and returns announcement' }));
    expect(screen.queryByRole('region', { name: 'Store delivery and returns information' })).not.toBeInTheDocument();
  });

  it('redirects /account to the login page when signed out', async () => {
    renderAt('/account');
    expect(await screen.findByRole('tab', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('shows "product not found" for an unknown product id', async () => {
    renderAt('/product/99999');
    expect(await screen.findByText(/couldn't find that product/i)).toBeInTheDocument();
  });
});

describe('catalogue', () => {
  it('filters the grid when a category is ticked', async () => {
    renderAt('/men');
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: "Men's Collection" });
    const before = screen.getAllByRole('article').length;
    await user.click(screen.getByLabelText(/^Jackets/));
    await waitFor(() => expect(screen.getAllByRole('article').length).toBeLessThan(before));
  });
});

describe('cart', () => {
  it('shows a validation error on an empty sign-in', async () => {
    renderAt('/login');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Sign In to NEXTO' }));
    expect(await screen.findAllByRole('alert')).not.toHaveLength(0);
  });
});
