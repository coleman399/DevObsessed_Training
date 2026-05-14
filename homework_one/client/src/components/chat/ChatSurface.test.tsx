import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { server } from '../../test/setup';
import { tokenStorage } from '../../lib/auth';
import { ChatProvider } from '../../hooks/useChat';
import { ChatHeader } from './ChatHeader';
import { ChatInput } from './ChatInput';
import { MessageList } from './MessageList';

function ChatSurface() {
  return (
    <div className="wc-chat">
      <ChatHeader />
      <MessageList />
      <ChatInput />
    </div>
  );
}

function wrapper({ children }: { children: ReactNode }) {
  return <ChatProvider firstName="Jane">{children}</ChatProvider>;
}

beforeEach(() => {
  tokenStorage.set('test-token', true);
});

afterEach(() => {
  tokenStorage.clear();
});

describe('ChatSurface', () => {
  it('renders Nova greeting on mount', async () => {
    render(<ChatSurface />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Hey Jane/i)).toBeInTheDocument();
    });
  });

  it('renders chat header with "New conversation" title', async () => {
    render(<ChatSurface />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText(/new conversation/i)).toBeInTheDocument();
    });
  });

  it('send button is disabled when input is empty', async () => {
    render(<ChatSurface />, { wrapper });
    const sendBtn = screen.getByRole('button', { name: /send/i });
    expect(sendBtn).toBeDisabled();
  });

  it('user message appears in thread after submit', async () => {
    const user = userEvent.setup();
    const convId = 'submit-test';
    server.use(
      http.post('/api/chat/conversations', () =>
        HttpResponse.json(
          { id: convId, title: 'New conversation', updatedAt: new Date().toISOString(), messages: [] },
          { status: 201 },
        ),
      ),
      http.post(`/api/chat/conversations/${convId}/messages`, () => {
        const encoder = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(encoder.encode('data: {"token":"Great"}\n\n'));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          },
        });
        return new HttpResponse(stream, {
          headers: { 'Content-Type': 'text/event-stream' },
        });
      }),
    );

    render(<ChatSurface />, { wrapper });
    await waitFor(() => screen.getByText(/Hey Jane/i));

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'What is my plan?');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('What is my plan?')).toBeInTheDocument();
    });
  });

  it('composer disables during streaming and re-enables after', async () => {
    const user = userEvent.setup();
    const convId = 'stream-disable-test';

    let streamController: ReadableStreamDefaultController<Uint8Array>;
    const encoder = new TextEncoder();

    server.use(
      http.post('/api/chat/conversations', () =>
        HttpResponse.json(
          { id: convId, title: 'New conversation', updatedAt: new Date().toISOString(), messages: [] },
          { status: 201 },
        ),
      ),
      http.post(`/api/chat/conversations/${convId}/messages`, () => {
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            streamController = controller;
          },
        });
        return new HttpResponse(stream, {
          headers: { 'Content-Type': 'text/event-stream' },
        });
      }),
    );

    render(<ChatSurface />, { wrapper });
    await waitFor(() => screen.getByText(/Hey Jane/i));

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'hi');
    await user.keyboard('{Enter}');

    // Close the stream
    await act(async () => {
      streamController!.enqueue(encoder.encode('data: {"token":"ok"}\n\n'));
      streamController!.enqueue(encoder.encode('data: [DONE]\n\n'));
      streamController!.close();
    });

    await waitFor(() => {
      expect(screen.getByText('ok')).toBeInTheDocument();
    });
  });
});
