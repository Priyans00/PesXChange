"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Chat } from "@/components/chat";
import { useAuth } from "@/contexts/auth-context";
import { messagesService } from "@/lib/services";

import type { Conversation } from "@/lib/services";

export function ChatPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [activeChats, setActiveChats] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Use PESU Auth
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const currentUserId = currentUser?.id || null;

  const otherUserId = params.get("user") ?? null;
  const otherUser = otherUserId
    ? activeChats.find((conversation) => conversation.other_user_id === otherUserId)
    : null;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (authLoading) return; // Wait for auth to load
    
    if (!currentUser) {
      router.push('/auth/login?redirectTo=/chat');
      return;
    }
  }, [currentUser, authLoading, router]);

  // Fetch active chats and optionally merge listing seller
  useEffect(() => {
    if (authLoading || !currentUserId) return;

    const fetchActiveChats = async () => {
      try {
        const response = await messagesService.getActiveChats();
        
        let data = response.data || [];

        // Ensure data is an array
        if (!Array.isArray(data)) {
          console.warn('Active chats API did not return an array:', data);
          data = [];
        }

        // Merge seller from listing page if not present
        if (otherUserId) {
          const supabase = createClient();
          const { data: sellerUser } = await supabase
            .from("user_profiles")
            .select("id, name, nickname")
            .eq("id", otherUserId)
            .single();

          const name = sellerUser?.nickname || sellerUser?.name || "Unknown";
          const exists = data.some((conversation) => conversation.other_user_id === otherUserId);

          if (!exists) {
            // Add a new conversation entry for this user
            data = [{
              other_user_id: otherUserId,
              other_user_name: name,
              other_user_nickname: name,
              unread_count: 0,
              last_message: undefined
            }, ...data];
          }
        }

        setActiveChats(data);
      } catch (err) {
        console.error("Failed to fetch active chats:", err);
        setActiveChats([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchActiveChats();
  }, [currentUserId, otherUserId]);

  const filteredChats = useMemo(
    () => activeChats.filter((conversation) => conversation.other_user_id !== currentUserId),
    [activeChats, currentUserId]
  );

  if (loading) return <div className="p-4 text-lg">Loading users...</div>;

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <div className="w-1/4 border-r border-gray-700 dark:border-gray-300 p-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-black dark:text-white">Chats</h2>
          <ThemeSwitcher />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">No chats yet</p>
          ) : (
            filteredChats.map((conversation) => (
              <button
                key={conversation.other_user_id}
                onClick={() => router.push(`/chat?user=${conversation.other_user_id}`)}
                className={`block w-full text-left px-3 py-2 mb-2 rounded-lg transition ${
                  conversation.other_user_id === otherUserId
                    ? "bg-indigo-600 text-white"
                    : "hover:bg-indigo-500/30 dark:hover:bg-indigo-400/30"
                }`}
              >
                <span className="text-lg font-medium">{conversation.other_user_nickname || conversation.other_user_name}</span>
              </button>
            ))
          )}
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