"use client";
import { Suspense } from "react";
import { ProtectedPageContent } from "./protected-page-content";

export default function ProtectedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
    >
      <ProtectedPageContent />
    </Suspense>
  );
}
