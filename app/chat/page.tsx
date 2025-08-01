"use client";

import { Suspense } from "react";
import { ChatPageContent } from "./chat-page-contents";

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-4 text-lg">Loading chat...</div>}>
      <ChatPageContent />
    </Suspense>
  );
}