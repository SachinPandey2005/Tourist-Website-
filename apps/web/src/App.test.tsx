import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import App from './App.js';

// Mock global fetch for health check
global.fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () =>
      Promise.resolve({
        status: 'healthy',
        uptime: 10,
        timestamp: new Date().toISOString(),
        environment: 'test',
        version: '0.1.0',
        services: {
          api: 'healthy',
          database: 'pending',
        },
      }),
  })
);

describe('App Component', () => {
  it('renders landing page headline and title', async () => {
    await act(async () => {
      render(<App />);
    });
    const brandElements = screen.getAllByText(/VoyageVista/i);
    expect(brandElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Extraordinary Journeys/i)).toBeInTheDocument();
  });

  it('renders architecture cards', async () => {
    await act(async () => {
      render(<App />);
    });
    expect(screen.getByText(/apps\/web/i)).toBeInTheDocument();
    expect(screen.getByText(/apps\/api/i)).toBeInTheDocument();
    expect(screen.getByText(/packages\/shared/i)).toBeInTheDocument();
  });
});
