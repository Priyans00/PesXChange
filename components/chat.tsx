"use client";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at?: string;
};

// Message cache to reduce API calls
const messageCache = new Map<string, { messages: Message[]; timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
const CACHE_MAX_ENTRIES = 50;

// Helper to set cache with size limit and cleanup
function setMessageCache(key: string, value: { messages: Message[]; timestamp: number }) {
  // Clean up expired entries
  const now = Date.now();
  for (const [k, v] of messageCache) {
    if (now - v.timestamp > CACHE_DURATION) {
      messageCache.delete(k);
    }
  }
  
  // If cache is full, delete the oldest entry
  if (messageCache.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = messageCache.keys().next().value;
    if (oldestKey) {
      messageCache.delete(oldestKey);
    }
  }
  
  messageCache.set(key, value);
}

// Helper to get cache and cleanup expired
function getMessageCache(key: string): { messages: Message[]; timestamp: number } | undefined {
  const now = Date.now();
  const entry = messageCache.get(key);
  if (entry && now - entry.timestamp <= CACHE_DURATION) {
    return entry;
  } else if (entry) {
    messageCache.delete(key);
  }
  return undefined;
}

const supabase = createClient();

export function Chat({
  currentUserId,
  otherUserId,
}: {
  currentUserId: string;
  otherUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Memoize conversation key for consistent caching
  const conversationKey = useMemo(() => {
    const [user1, user2] = [currentUserId, otherUserId].sort();
    return `${user1}-${user2}`;
  }, [currentUserId, otherUserId]);

  const fetchMessages = useCallback(async () => {
    try {
      // Check cache first
      const cached = getMessageCache(conversationKey);
      if (cached) {
        setMessages(cached.messages);
        return;
      }

      const res = await fetch(
        `/api/messages?user1=${currentUserId}&user2=${otherUserId}`,
        {
          headers: {
            'Cache-Control': 'no-cache',
          }
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch messages: ${res.status}`);
      }

      const data = await res.json();
      const messageList = Array.isArray(data) ? data : [];
      
      setMessages(messageList);
      
      // Update cache
      setMessageCache(conversationKey, {
        messages: messageList,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  }, [currentUserId, otherUserId, conversationKey]);

  // Memoized message update handler
  const handleNewMessage = useCallback((newMessage: Message) => {
    if (
      (newMessage.sender_id === currentUserId && newMessage.receiver_id === otherUserId) ||
      (newMessage.sender_id === otherUserId && newMessage.receiver_id === currentUserId)
    ) {
      setMessages(prevMessages => {
        // Prevent duplicates
        const exists = prevMessages.some(msg => msg.id === newMessage.id);
        if (exists) return prevMessages;
        
        const updated = [...prevMessages, newMessage];
        
        // Update cache
        setMessageCache(conversationKey, {
          messages: updated,
          timestamp: Date.now()
        });
        
        return updated;
      });
    }
  }, [currentUserId, otherUserId, conversationKey]);

  useEffect(() => {
    fetchMessages();

    // Set up real-time subscription
    const channel = supabase
      .channel(`messages_${conversationKey}`)
      .on(
        "postgres_changes",
        { 
          event: "INSERT", 
          schema: "public", 
          table: "messages",
          filter: `or(and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId}))`
        },
        (payload) => {
          handleNewMessage(payload.new as Message);
        }
      )
      .subscribe();

    // Reduced polling frequency - rely more on real-time updates
    const interval = setInterval(fetchMessages, 30000); // 30 seconds instead of 5

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchMessages, currentUserId, otherUserId, conversationKey, handleNewMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    setIsSending(true);

    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: currentUserId,
          receiver_id: otherUserId,
          message: input.trim(),
        }),
      });
      setInput("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  }

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender_id === currentUserId ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  msg.sender_id === currentUserId
                    ? "bg-primary text-primary-foreground ml-auto"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <p className="text-sm">{msg.message}</p>
                <p className="text-xs opacity-70 mt-1">
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Message Input */}
      <div className="border-t p-4">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            className="flex-1 px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isSending}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || isSending}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
