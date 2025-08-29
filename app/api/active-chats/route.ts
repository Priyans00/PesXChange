import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Cache for active chats
const chatCache = new Map<string, { data: unknown[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function validateUserID(id: string): boolean {
  // Accept both UUID format and SRN format (PES2UG24CS453)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const srnRegex = /^PES[0-9]{1}UG[0-9]{2}[A-Z]{2}[0-9]{3}$/;
  return uuidRegex.test(id) || srnRegex.test(id);
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  
  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  if (!validateUserID(userId)) {
    return NextResponse.json({ error: "Invalid userId format" }, { status: 400 });
  }

  // Authorization check
  if (user.id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check cache first
  const cacheKey = `active_chats_${userId}`;
  const cached = chatCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    // Optimized query: get unique conversation partners with last message time :>
    const { data: conversations, error } = await supabase
      .from("messages")
      .select(`
        sender_id,
        receiver_id,
        created_at,
        message
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(200); // Reasonable limit for performance

    if (error) {
      console.error("Database error in active-chats:", error);
      return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
    }

    if (!conversations || !Array.isArray(conversations)) {
      return NextResponse.json([]);
    }

    // Process conversations more efficiently
    const conversationMap = new Map<string, { 
      userId: string; 
      lastMessage: string; 
      lastMessageTime: string 
    }>();

    conversations.forEach((msg: { sender_id: string; receiver_id: string; message: string; created_at: string }) => {
      const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      
      // Keep only the most recent message per conversation
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          userId: otherUserId,
          lastMessage: msg.message,
          lastMessageTime: msg.created_at
        });
      }
    });

    if (conversationMap.size === 0) {
      chatCache.set(cacheKey, { data: [], timestamp: Date.now() });
      return NextResponse.json([]);
    }

    // Fetch user details in batch
    const otherUserIds = Array.from(conversationMap.keys());
    const { data: users, error: usersError } = await supabase
      .from("user_profiles")
      .select("id, name, srn")
      .in("id", otherUserIds);

    if (usersError) {
      console.error("Database error fetching user profiles:", usersError);
      return NextResponse.json({ error: "Failed to fetch user profiles" }, { status: 500 });
    }

    // Combine user data with conversation metadata
    const result = (users || []).map(user => {
      const conversation = conversationMap.get(user.id);
      return {
        id: user.id,
        name: user.name || user.srn || 'Unknown User',
        lastMessage: conversation?.lastMessage?.substring(0, 100), 
        lastMessageTime: conversation?.lastMessageTime
      };
    }).sort((a, b) => 
      new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime()
    );

    // Cache the result
    chatCache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    return NextResponse.json(result);

  } catch (error) {
    console.error("Unexpected error in active-chats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}