"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Chat } from "@/components/chat"; 

type User = { id: string; name?: string; email: string };

export function ChatPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const otherUserId = params.get("user") ?? "";
  const otherUser = users.find((u) => u.id === otherUserId);

  useEffect(() => {
    const supabase = createClient();
  
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  
    supabase
      .from("users")
      .select("id, name, email")
      .then(({ data }) => {
        if (data) setUsers(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-4 text-lg">Loading users...</div>;

  return (
    <div className="flex h-screen bg-gray-100 text-white dark:bg-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <div className="w-1/4 border-r border-gray-700 dark:border-gray-300 p-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold dark:text-white">Chats</h2>
          <ThemeSwitcher />
        </div>
        <div className="flex-1 overflow-y-auto">
          {users.filter(u => u.id !== currentUserId).map(u => (
            <button
              key={u.id}
              onClick={() => router.push(`/chat?user=${u.id}`)}
              className={`block w-full text-left px-3 py-2 mb-2 rounded-lg transition ${
                u.id === otherUserId
                  ? "bg-indigo-600 text-white"
                  : "hover:bg-indigo-500/30 dark:hover:bg-indigo-400/30"
              }`}
            >
              <span className="text-lg font-medium">{u.name || u.email}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 p-4">
        {currentUserId && otherUserId && otherUser ? (
          <Chat currentUserId={currentUserId} otherUserId={otherUserId} />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl text-gray-400">
            Select a chat to start messaging.
          </div>
        )}
      </div>
    </div>
  );
}