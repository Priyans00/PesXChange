"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MessageCircle, User as UserIcon, ArrowLeft } from "lucide-react";
import { Chat } from "@/components/chat";
import { User } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface sellerInfo {
    email?: string;
    id: string;
}

export function ProtectedPageContent() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [sellerInfo, setSellerInfo] = useState<sellerInfo | null>(null);
  const [sellerLoading, setSellerLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sellerId = searchParams.get("sellerId");

  useEffect(() => {
    const supabase = createClient();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setLoading(false);
      } else {
        setUser(null);
        setLoading(false);
        router.replace("/auth/login");
      }
    });

    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) {
        router.replace("/auth/login");
      } else {
        setUser(data.user);
      }
      setLoading(false);
    });

    // Fetch seller info if sellerId exists
    if (sellerId) {
      setSellerLoading(true);
      fetch(`/api/users/${sellerId}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setSellerInfo({
              id: data.id,
              email: data.email
            });
          }
        })
        .catch(error => {
          console.error('Error fetching seller info:', error);
        })
        .finally(() => {
          setSellerLoading(false);
        });
    }

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router, sellerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!sellerId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Chat Selected</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          You need to specify a seller ID to start a conversation. Please select a seller from the marketplace.
        </p>
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b bg-card p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-semibold">
                  {sellerLoading ? (
                    <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  ) : (
                    sellerInfo?.email?.split('@')[0] || 'Seller'
                  )}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {sellerLoading ? (
                    <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                  ) : (
                    sellerInfo?.email || 'seller@example.com'
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span className="text-sm text-muted-foreground">Online</span>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-card rounded-b-lg overflow-hidden">
        <Chat currentUserId={user!.id} otherUserId={sellerId} />
      </div>
    </div>
  );
}