import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import type { Conversation } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No session -> straight to the login page.
  if (!user) {
    redirect("/login");
  }

  const { data: conversations } = await supabase
    .from("conversations")
    .select("*")
    .order("updated_at", { ascending: false })
    .returns<Conversation[]>();

  return <AppShell initialConversations={conversations ?? []} />;
}
