import { createClient } from "@/lib/supabase/server";
import { SellFormContents } from "./sell-form-contents";

export default async function SellPage() {
  const supabase = await createClient();
  
  // Middleware already ensures user is authenticated and has profile
  // Just get the user data for the component
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // At this point, user should always exist due to middleware protection
  if (!user) {
    // This shouldn't happen, but just in case
    throw new Error("Authentication error - please refresh the page");
  }

  return <SellFormContents user={user} />;
}