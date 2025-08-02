"use client";
import { Suspense } from "react";
import { ItemListingContents } from "./item-listing-contents";

export default function ItemListingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }>
        <ItemListingContents />
      </Suspense>
    </div>
  );
}
