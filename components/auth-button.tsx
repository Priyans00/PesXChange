"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/client";
import { LogoutButton } from "./logout-button";
import { useEffect, useState } from "react";
import { User } from '@supabase/supabase-js';

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    // Get initial user - handle missing session gracefully
    supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        // Don't log auth session missing as an error - it's normal for logged out users :>
        if (error.message !== "Auth session missing!") {
          console.error("Error fetching user:", error.message);
        }
        setUser(null);
      } else {
        setUser(data.user);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
      </div>
    );
  }

  return user ? (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600 dark:text-gray-300">
        Hey, {user.email?.split('@')[0]}!
      </span>
      <LogoutButton />
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Button asChild size="sm" variant="ghost">
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/auth/signup">Sign up</Link>
      </Button>
    </div>
  );
}
