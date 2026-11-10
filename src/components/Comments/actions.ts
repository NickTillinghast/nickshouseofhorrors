"use server";

import { createClient } from "@lib/supabase/server";
import { COMMENT_MAX_LENGTH, THREAD_PATTERN, USERNAME_PATTERN } from "@lib/comments";

// Errors come back as values, thrown errors lose their message in production
type Result = { error?: string };

async function getSignedInClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  return { supabase, userId };
}

export async function createProfile(username: string): Promise<Result> {
  if (typeof username !== "string" || !USERNAME_PATTERN.test(username)) {
    return { error: "Use 3 to 20 letters, numbers or underscores." };
  }
  const { supabase, userId } = await getSignedInClient();
  if (!userId) return { error: "Sign in first." };

  const { error } = await supabase.from("profiles").insert({ id: userId, username });
  // 23505 = unique violation, someone already has it (in any upper/lower case)
  if (error?.code === "23505") return { error: "That username is taken." };
  if (error) return { error: "Couldn't save your username, try again." };
  return {};
}

export async function addComment(
  thread: string,
  body: string,
  parentId: number | null = null,
): Promise<Result> {
  const text = typeof body === "string" ? body.trim() : "";
  if (!THREAD_PATTERN.test(thread)) return { error: "Unknown thread." };
  if (!text || text.length > COMMENT_MAX_LENGTH) {
    return { error: `Comments can be 1 to ${COMMENT_MAX_LENGTH} characters.` };
  }
  if (parentId !== null && !Number.isInteger(parentId)) return { error: "Unknown comment." };

  const { supabase, userId } = await getSignedInClient();
  if (!userId) return { error: "Sign in to comment." };

  const { error } = await supabase
    .from("comments")
    .insert({ thread, body: text, parent_id: parentId, user_id: userId });
  // 23503 = foreign key: no profile yet, or the parent comment is gone
  if (error?.code === "23503")
    return { error: "Pick a username first, or the comment was deleted." };
  if (error) return { error: "Couldn't post your comment, try again." };
  return {};
}

export async function deleteComment(id: number): Promise<Result> {
  if (!Number.isInteger(id)) return { error: "Unknown comment." };
  const { supabase, userId } = await getSignedInClient();
  if (!userId) return { error: "Sign in first." };

  // Row Level Security only lets people delete their own
  const { error } = await supabase.from("comments").delete().eq("id", id).eq("user_id", userId);
  if (error) return { error: "Couldn't delete the comment, try again." };
  return {};
}

export async function reportComment(id: number): Promise<Result> {
  if (!Number.isInteger(id)) return { error: "Unknown comment." };
  const { supabase, userId } = await getSignedInClient();
  if (!userId) return { error: "Sign in to report." };

  const { error } = await supabase
    .from("comment_reports")
    .insert({ comment_id: id, reporter_id: userId });
  // Reporting twice is fine, the first one counts
  if (error && error.code !== "23505") return { error: "Couldn't send the report, try again." };
  return {};
}
