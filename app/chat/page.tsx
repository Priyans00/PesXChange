"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Chat } from "@/components/chat";

type User = {
  id: string;
  name?: string;
  email: string;
};

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const otherUserId = searchParams.get("user");

  // Get current logged-in user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setCurrentUserId(data.user.id);
      }
    };
    getUser();
  }, [supabase.auth]);

  // Fetch all users from Supabase `users` table
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email"); // Add 'name' column if available

      if (!error && data) {
        setUsers(data);
      } else {
        console.error("Error fetching users:", error);
      }
      setLoading(false);
    };

    fetchUsers();
  }, [supabase]);

  if (loading) return <div className="p-4">Loading users...</div>;

  return (
    <div className="flex h-screen">
      {/* Sidebar for selecting user */}
      <div className="w-1/4 border-r p-4 overflow-y-auto">
        <h2 className="text-lg font-bold mb-2">Chats</h2>
        {users
          .filter((u) => u.id !== currentUserId) // Don't show self
          .map((user) => (
            <button
              key={user.id}
              onClick={() => router.push(`/chat?user=${user.id}`)}
              className={`block w-full text-left p-2 mb-2 rounded ${
                otherUserId === user.id ? "bg-blue-100" : "hover:bg-gray-100"
              }`}
            >
              {user.name || user.email}
            </button>
          ))}
      </div>

      {/* Chat box */}
      <div className="flex-1 p-4">
        {currentUserId && otherUserId ? (
          <Chat currentUserId={currentUserId} otherUserId={otherUserId} />
        ) : (
          <div className="text-gray-500">Select a user to start chatting.</div>
        )}
      </div>
    </div>
  );
}
