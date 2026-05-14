import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { server } from '../../test/setup';
import { tokenStorage } from '../../lib/auth';
import { ChatProvider } from '../../hooks/useChat';
import { RecentConversationsList } from './RecentConversationsList';

function wrapper({ children }: { children: ReactNode }) {
  return <ChatProvider firstName="Jane">{children}</ChatProvider>;
}

beforeEach(() => {
  tokenStorage.set('test-token', true);
});

afterEach(() => {
  tokenStorage.clear();
});

describe('RecentConversationsList', () => {
  it('renders nothing when recents list is empty', async () => {
    render(<RecentConversationsList />, { wrapper });
    // Wait for mount to settle
    await waitFor(() => {
      expect(screen.queryByText(/recent conversations/i)).not.toBeInTheDocument();
    });
  });

  it('shows conversations returned by GET /conversations with messageCount > 0', async () => {
    server.use(
      http.get('/api/chat/conversations', () =>
        HttpResponse.json([
          { id: 'c1', title: 'My first chat', updatedAt: new Date().toISOString(), messageCount: 2 },
          { id: 'c2', title: 'Another chat', updatedAt: new Date(Date.now() - 3600_000).toISOString(), messageCount: 1 },
        ]),
      ),
    );

    render(<RecentConversationsList />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('My first chat')).toBeInTheDocument();
      expect(screen.getByText('Another chat')).toBeInTheDocument();
    });
  });

  it('caps display at 5 rows', async () => {
    const convs = Array.from({ length: 7 }, (_, i) => ({
      id: `c${i}`,
      title: `Chat ${i}`,
      updatedAt: new Date().toISOString(),
      messageCount: 1,
    }));
    server.use(http.get('/api/chat/conversations', () => HttpResponse.json(convs)));

    render(<RecentConversationsList />, { wrapper });

    await waitFor(() => {
      const rows = screen.getAllByRole('button');
      expect(rows.length).toBe(5);
    });
  });

  it('highlights the active row', async () => {
    const convId = 'active-conv';
    server.use(
      http.get('/api/chat/conversations', () =>
        HttpResponse.json([
          { id: convId, title: 'Active chat', updatedAt: new Date().toISOString(), messageCount: 1 },
        ]),
      ),
    );

    render(<RecentConversationsList />, { wrapper });

    await waitFor(() => screen.getByText('Active chat'));

    const user = userEvent.setup();
    await act(async () => {
      server.use(
        http.get(`/api/chat/conversations/${convId}`, () =>
          HttpResponse.json({
            id: convId,
            title: 'Active chat',
            updatedAt: new Date().toISOString(),
            messages: [{ id: 'm1', role: 'assistant', content: 'hi', createdAt: new Date().toISOString() }],
          }),
        ),
      );
      await user.click(screen.getByText('Active chat'));
    });

    const row = screen.getByRole('button', { name: /active chat/i });
    expect(row.className).toContain('active');
  });

  it('shows relative time string for each row', async () => {
    server.use(
      http.get('/api/chat/conversations', () =>
        HttpResponse.json([
          {
            id: 'c1',
            title: 'Recent chat',
            updatedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
            messageCount: 1,
          },
        ]),
      ),
    );

    render(<RecentConversationsList />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('5m ago')).toBeInTheDocument();
    });
  });
});
