"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { InfoIcon } from "lucide-react";

export default function ProtectedPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) {
        router.replace("/auth/login");
      } else {
        setUser(data.user);
      }
      setLoading(false);
    });
  }, [router]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          After Login
        </div>
      </div>
    </div>
  );
}
