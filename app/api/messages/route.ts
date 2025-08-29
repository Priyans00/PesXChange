import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Rate limiting cache 
const rateLimit = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_MAX = 100; // 100 requests per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const userLimit = rateLimit.get(identifier);
  
  if (!userLimit || now - userLimit.lastReset > RATE_LIMIT_WINDOW) {
    rateLimit.set(identifier, { count: 1, lastReset: now });
    return true;
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

// Input validation and sanitization
function sanitizeMessage(message: string): string {
  return message.trim().substring(0, 1000); // Limit message length
}

function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// GET: Fetch messages between two users
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting
  if (!checkRateLimit(user.id)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const user1 = searchParams.get("user1");
  const user2 = searchParams.get("user2");

  if (!user1 || !user2) {
    return NextResponse.json({ error: "Missing user ids" }, { status: 400 });
  }

  // Validate UUIDs
  if (!validateUUID(user1) || !validateUUID(user2)) {
    return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
  }

  // Authorization check: user must be part of the conversation
  if (user.id !== user1 && user.id !== user2) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Use parameterized query for security
    const { data, error } = await supabase
      .from("messages")
      .select("id, sender_id, receiver_id, message, created_at")
      .or(`and(sender_id.eq.${user1},receiver_id.eq.${user2}),and(sender_id.eq.${user2},receiver_id.eq.${user1})`)
      .order("created_at", { ascending: true })
      .limit(100); // Limit results for performance

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Send a message
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting for sending messages (stricter)
  if (!checkRateLimit(`send_${user.id}`)) {
    return NextResponse.json({ error: "Too many messages sent" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { sender_id, receiver_id, message } = body;

    if (!sender_id || !receiver_id || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate UUIDs
    if (!validateUUID(sender_id) || !validateUUID(receiver_id)) {
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
    }

    // Authorization check: sender must be the authenticated user
    if (user.id !== sender_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Sanitize message
    const sanitizedMessage = sanitizeMessage(message);
    if (!sanitizedMessage) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

    // Verify receiver exists
    const { data: receiverExists } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("id", receiver_id)
      .single();

    if (!receiverExists) {
      return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("messages")
      .insert([{ 
        sender_id, 
        receiver_id, 
        message: sanitizedMessage 
      }])
      .select("id, sender_id, receiver_id, message, created_at")
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
