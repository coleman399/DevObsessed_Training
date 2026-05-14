import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  createConversation,
  deriveTitle,
  getConversation,
  listConversations,
  streamChat,
} from '../lib/chat';

// ── Local types ───────────────────────────────────────────────────────────────

export interface LocalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export interface LocalConversation {
  id: string;
  title: string;
  messages: LocalMessage[];
  updatedAt: Date;
  userTurnsCount: number;
  isStub: boolean;
}

// ── Context ───────────────────────────────────────────────────────────────────

interface ChatCtx {
  conversations: LocalConversation[];
  activeConversationId: string;
  activeConversation: LocalConversation | undefined;
  recentConversations: LocalConversation[];
  streaming: boolean;
  sendMessage: (text: string) => Promise<void>;
  startNewConversation: () => void;
  selectConversation: (id: string) => Promise<void>;
}

const ChatContext = createContext<ChatCtx | null>(null);

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildStub(firstName: string): LocalConversation {
  return {
    id: `stub-${crypto.randomUUID()}`,
    title: 'New conversation',
    messages: [
      {
        id: `local-greeting-${Date.now()}`,
        role: 'assistant',
        content: `Hey ${firstName}, what are we working on first?`,
        createdAt: new Date(),
      },
    ],
    updatedAt: new Date(),
    userTurnsCount: 0,
    isStub: true,
  };
}

function serverMsgToLocal(m: { id: string; role: string; content: string; createdAt: string }): LocalMessage {
  return {
    id: m.id,
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content,
    createdAt: new Date(m.createdAt),
  };
}

// ── Provider ──────────────────────────────────────────────────────────────────

interface ChatProviderProps {
  firstName: string;
  children: ReactNode;
}

export function ChatProvider({ firstName, children }: ChatProviderProps) {
  const [conversations, setConversations] = useState<LocalConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState('');
  const [streaming, setStreaming] = useState(false);
  // Prevent double-init in StrictMode dev
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    listConversations()
      .then((summaries) => {
        const loaded: LocalConversation[] = summaries.map((s) => ({
          id: s.id,
          title: s.title,
          messages: [],
          updatedAt: new Date(s.updatedAt),
          userTurnsCount: s.messageCount,
          isStub: false,
        }));
        const stub = buildStub(firstName);
        setConversations([stub, ...loaded]);
        setActiveConversationId(stub.id);
      })
      .catch(() => {
        const stub = buildStub(firstName);
        setConversations([stub]);
        setActiveConversationId(stub.id);
      });
  }, [firstName]);

  const sendMessage = useCallback(
    async (text: string) => {
      setConversations((prev) => {
        const active = prev.find((c) => c.id === activeConversationId);
        if (!active || streaming) return prev;
        return prev;
      });

      const activeConv = conversations.find((c) => c.id === activeConversationId);
      if (!activeConv || streaming) return;

      const localStubId = activeConversationId;
      let convId = localStubId;

      // Materialize stub on first user message
      if (activeConv.isStub) {
        try {
          const detail = await createConversation();
          convId = detail.id;
          setConversations((prev) =>
            prev.map((c) =>
              c.id === localStubId
                ? { ...c, id: convId, isStub: false, title: deriveTitle(text) }
                : c,
            ),
          );
          setActiveConversationId(convId);
        } catch {
          return;
        }
      }

      const now = new Date();
      const userMsgId = `msg-user-${Date.now()}`;
      const draftMsgId = `msg-draft-${Date.now()}`;

      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  { id: userMsgId, role: 'user' as const, content: text, createdAt: now },
                  { id: draftMsgId, role: 'assistant' as const, content: '', createdAt: now },
                ],
                userTurnsCount: c.userTurnsCount + 1,
                updatedAt: now,
              }
            : c,
        ),
      );

      setStreaming(true);

      try {
        await streamChat(convId, text, (token) => {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === convId
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === draftMsgId ? { ...m, content: m.content + token } : m,
                    ),
                  }
                : c,
            ),
          );
        });
      } catch {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === draftMsgId
                      ? { ...m, content: "I'm offline at the moment — try again in a sec." }
                      : m,
                  ),
                }
              : c,
          ),
        );
      } finally {
        setStreaming(false);
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, updatedAt: new Date() } : c)),
        );
      }
    },
    [activeConversationId, conversations, streaming],
  );

  const startNewConversation = useCallback(() => {
    const stub = buildStub(firstName);
    setConversations((prev) => [stub, ...prev]);
    setActiveConversationId(stub.id);
  }, [firstName]);

  const selectConversation = useCallback(
    async (id: string) => {
      const conv = conversations.find((c) => c.id === id);
      if (!conv) return;

      if (!conv.isStub && conv.messages.length === 0) {
        try {
          const detail = await getConversation(id);
          setConversations((prev) =>
            prev.map((c) =>
              c.id === id
                ? {
                    ...c,
                    messages: detail.messages
                      .filter((m) => m.role !== 'system')
                      .map(serverMsgToLocal),
                    title: detail.title,
                    updatedAt: new Date(detail.updatedAt),
                  }
                : c,
            ),
          );
        } catch {
          // Switch anyway; empty messages renders gracefully
        }
      }

      setActiveConversationId(id);
    },
    [conversations],
  );

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId),
    [conversations, activeConversationId],
  );

  const recentConversations = useMemo(
    () => conversations.filter((c) => !c.isStub && c.userTurnsCount > 0).slice(0, 5),
    [conversations],
  );

  const value = useMemo<ChatCtx>(
    () => ({
      conversations,
      activeConversationId,
      activeConversation,
      recentConversations,
      streaming,
      sendMessage,
      startNewConversation,
      selectConversation,
    }),
    [
      conversations,
      activeConversationId,
      activeConversation,
      recentConversations,
      streaming,
      sendMessage,
      startNewConversation,
      selectConversation,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useChat(): ChatCtx {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within <ChatProvider>');
  return ctx;
}
