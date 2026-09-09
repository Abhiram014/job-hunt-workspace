"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Send, Plus, Trash2, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  createConversation,
  sendMessage,
  getConversationMessages,
  deleteConversation,
} from "@/app/actions/ai";
import { cn } from "@/lib/utils";
import type { Message } from "@prisma/client";
import type { ConversationListItem } from "@/types/ai";

export function ChatPanel({
  conversations,
  applicationId,
  resumeId,
  emptyLabel,
}: {
  conversations: ConversationListItem[];
  applicationId?: string | null;
  resumeId?: string | null;
  emptyLabel: string;
}) {
  const [list, setList] = useState(conversations);
  const [activeId, setActiveId] = useState<string | null>(conversations[0]?.id ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Re-syncs local list state when the server component re-renders with
    // fresh `conversations` (e.g. after a revalidatePath from a server
    // action elsewhere), while preserving optimistic local additions between renders.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from a changed prop reference, not a value computable during render
    setList(conversations);
    if (!activeId && conversations[0]) setActiveId(conversations[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]);

  useEffect(() => {
    if (!activeId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing stale data from the previous conversation, not derivable during render
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    getConversationMessages(activeId)
      .then(setMessages)
      .catch(() => toast.error("Couldn't load conversation"))
      .finally(() => setLoadingMessages(false));
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleNewConversation() {
    try {
      const conversation = await createConversation({ applicationId, resumeId });
      setList((prev) => [
        { ...conversation, application: null, resume: null, _count: { messages: 0 } } as unknown as ConversationListItem,
        ...prev,
      ]);
      setActiveId(conversation.id);
      setMessages([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start conversation");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this conversation?")) return;
    try {
      await deleteConversation(id);
      setList((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) setActiveId(null);
    } catch {
      toast.error("Couldn't delete conversation");
    }
  }

  async function handleSend() {
    const content = draft.trim();
    if (!content) return;

    setSending(true);
    setDraft("");

    let conversationId = activeId;
    try {
      if (!conversationId) {
        const conversation = await createConversation({ applicationId, resumeId });
        conversationId = conversation.id;
        setActiveId(conversationId);
        setList((prev) => [
          { ...conversation, application: null, resume: null, _count: { messages: 0 } } as unknown as ConversationListItem,
          ...prev,
        ]);
      }

      setMessages((prev) => [
        ...prev,
        { id: `optimistic-${Date.now()}`, conversationId, role: "USER", content, createdAt: new Date() } as Message,
      ]);

      await sendMessage({ conversationId, content });
      // Refresh from server so both messages have real IDs and correct ordering.
      const refreshed = await getConversationMessages(conversationId);
      setMessages(refreshed);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
      setMessages((prev) => prev.filter((m) => !m.id.startsWith("optimistic-")));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
      <div className="space-y-1">
        <Button size="sm" variant="outline" className="w-full" onClick={handleNewConversation}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> New Chat
        </Button>
        <ul className="mt-2 space-y-1">
          {list.map((c) => (
            <li key={c.id} className="group flex items-center gap-1">
              <button
                onClick={() => setActiveId(c.id)}
                className={cn(
                  "flex-1 truncate rounded-md px-2 py-1.5 text-left text-xs",
                  activeId === c.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"
                )}
              >
                {c.title || "New conversation"}
              </button>
              <button
                onClick={() => handleDelete(c.id)}
                className="hidden shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive group-hover:block"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
        {list.length === 0 && (
          <p className="px-1 py-2 text-xs text-muted-foreground">{emptyLabel}</p>
        )}
      </div>

      <div className="flex h-[28rem] flex-col rounded-lg border">
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3">
          {loadingMessages ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <MessageSquare className="h-6 w-6" />
              Ask about this job: interview prep, resume feedback, recruiter outreach...
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={cn("flex", m.role === "USER" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm",
                    m.role === "USER" ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}
                >
                  {m.content}
                  <p
                    className={cn(
                      "mt-1 text-[10px] opacity-60",
                      m.role === "USER" ? "text-primary-foreground" : "text-muted-foreground"
                    )}
                  >
                    {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              </div>
            </div>
          )}
        </div>
        <div className="flex items-end gap-2 border-t p-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Message..."
            rows={2}
            className="resize-none"
          />
          <Button size="icon" onClick={handleSend} disabled={sending || !draft.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
