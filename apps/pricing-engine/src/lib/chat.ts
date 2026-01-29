import { supabaseAdmin } from "@/lib/supabase-admin"
import { isUuid } from "@/lib/uuid"

export type ChatMessage = {
  id: string
  user_type: "user" | "agent"
  content: string
  created_at: string
  user_id: string
}

export { isUuid }

export async function getChatIdForMapping(
  reportId: string,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("credit_report_user_chats")
    .select("chat_id")
    .eq("report_id", reportId)
    .eq("user_id", userId)
    .maybeSingle()
  if (error) throw error
  return (data?.chat_id as string) || null
}

export async function getMessagesByChatId(
  chatId: string
): Promise<ChatMessage[]> {
  const { data, error } = await supabaseAdmin
    .from("credit_report_chat_messages")
    .select("id, user_type, content, created_at, user_id")
    .eq("credit_report_chat_id", chatId)
    .order("created_at", { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []).reverse() as ChatMessage[]
}

export async function insertMessage(
  chatId: string,
  userId: string,
  organizationId: string,
  content: string,
  userType: "user" | "agent" = "user"
) {
  const { data, error } = await supabaseAdmin
    .from("credit_report_chat_messages")
    .insert({
      credit_report_chat_id: chatId,
      user_id: userId,
      organization_id: organizationId,
      user_type: userType,
      content,
    })
    .select("id, user_type, content, created_at, user_id")
    .single()
  if (error) throw error
  return data
}

