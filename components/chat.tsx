"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "./ui/button";

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at?: string;
};

const supabase = createClient();

export function Chat({ currentUserId, otherUserId }: { currentUserId: string, otherUserId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch messages directly from Supabase
  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
      .order("created_at", { ascending: true });
    if (!error && Array.isArray(data)) setMessages(data as Message[]);
  }, [currentUserId, otherUserId]);

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
            (msg.sender_id === otherUserId && msg.receiver_id === currentUserId) ||
            (msg.sender_id === currentUserId && msg.receiver_id === otherUserId)
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
  }, [fetchMessages, currentUserId, otherUserId]);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message directly to Supabase
  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    await supabase.from("messages").insert([
      {
        sender_id: currentUserId,
        receiver_id: otherUserId,
        message: input,
      },
    ]);
    setInput("");
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
            <span className="inline-block px-2 py-1 rounded bg-gray-900">{msg.message}</span>
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