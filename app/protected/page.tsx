"use client";
import { Suspense } from "react";
import { WithAuth } from "@/components/with-auth";
import { ProtectedPageContent } from "./protected-page-content";

export default function ProtectedPage() {
  return (
    <WithAuth>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }
      >
        <ProtectedPageContent />
      </Suspense>
    </WithAuth>
  );
}
