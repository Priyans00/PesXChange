"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at?: string;
};

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
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`
    )
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error.message);
    return;
  }

  if (data) {
    setMessages(data as Message[]);
  }
  }, [currentUserId, otherUserId]);
  
  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new as Message;
          if (
            (m.sender_id === currentUserId && m.receiver_id === otherUserId) ||
            (m.sender_id === otherUserId && m.receiver_id === currentUserId)
          ) {
            setMessages((prevMessages) => [...prevMessages, m]);
          }
        }
      )
      .subscribe();

    const interval = setInterval(fetchMessages, 3000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchMessages, currentUserId, otherUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
  }

  return (
    <div className="flex flex-col h-full bg-gray-200 dark:bg-gray-900 rounded-lg p-4">
      <div className="flex-1 overflow-y-auto mb-4 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender_id === currentUserId ? "justify-end" : "justify-start"
            }`}
          >
            <p
              className={`max-w-xs px-4 py-2 rounded-lg text-lg ${
                msg.sender_id === currentUserId
                  ? "text-black dark:text-white"
                  : "bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white"
              }`}
            >
              {msg.message}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          className="flex-1 border-2 border-gray-600 dark:border-gray-300 rounded-lg px-3 py-2 bg-gray-900 dark:bg-white text-white dark:text-black placeholder-gray-400"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button
          type="submit"
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
        >
          Send
        </button>
      </form>
    </div>
  );
}
