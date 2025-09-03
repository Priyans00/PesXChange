"use client";
import { Suspense } from "react";
import { ItemListingContents } from "./item-listing-contents";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import Head from "next/head";

export default function ItemListingPage() {
  return (
    <>
      <Head>
        <link rel="preload" href="/api/items" as="fetch" crossOrigin="anonymous" />
        <link rel="prefetch" href="/item/" />
        <link rel="prefetch" href="/chat" />
      </Head>
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <LoadingSpinner size="lg" />
          </div>
        }>
          <ItemListingContents />
        </Suspense>
      </div>
    </>
  );
}
