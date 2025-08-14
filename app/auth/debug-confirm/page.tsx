"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function DebugConfirmContent() {
  const [debugInfo, setDebugInfo] = useState<{
    token_hash?: string;
    type?: string | null;
    next?: string | null;
    url?: string;
    searchParams?: Record<string, string>;
  }>({});
  const searchParams = useSearchParams();

  useEffect(() => {
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    const next = searchParams.get("next");

    setDebugInfo({
      token_hash: token_hash ? "Present" : "Missing",
      type,
      next,
      url: window.location.href,
      searchParams: Object.fromEntries(searchParams.entries())
    });
  }, [searchParams]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Confirmation</h1>
      <pre className="bg-gray-100 p-4 rounded text-sm">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  );
}

export default function DebugConfirm() {
  // Only show in development environment
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Debug Not Available</h1>
        <p>Debug pages are only available in development mode.</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DebugConfirmContent />
    </Suspense>
  );
}
