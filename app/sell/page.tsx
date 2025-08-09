import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SellFormContents } from "./sell-form-contents";

export default async function SellPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/sell");
  }

  return <SellFormContents user={user} />;
}