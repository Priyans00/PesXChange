"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "./ui/button";

export function Chat({ currentUserId, otherUserId }: { currentUserId: string, otherUserId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const supabase = createClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch messages (move outside useEffect for reuse)
  async function fetchMessages() {
    const res = await fetch(`/api/messages?user1=${currentUserId}&user2=${otherUserId}`);
    const data = await res.json();
    setMessages(Array.isArray(data) ? data : []);
  }

  // Fetch messages
  useEffect(() => {
    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new;
          if (
            msg.sender_id === otherUserId &&
            msg.receiver_id === currentUserId
          ) {
            fetchMessages();
          }
        }
      )
      .subscribe();

    // Polling interval (every 3 seconds)
    const interval = setInterval(fetchMessages, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [currentUserId, otherUserId, supabase]);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender_id: currentUserId,
        receiver_id: otherUserId,
        message: input,
      }),
    });
    setInput("");
    // Re-fetch messages after sending
    fetchMessages();
  }

  return (
    <div className="flex flex-col h-full border rounded p-2">
      <div className="flex-1 overflow-y-auto mb-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`my-1 ${msg.sender_id === currentUserId ? "text-right" : "text-left"}`}
          >
            <span className="inline-block px-2 py-1 rounded bg-black-200">{msg.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          className="flex-1 border rounded px-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
}