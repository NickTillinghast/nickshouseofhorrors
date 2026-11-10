"use client";

import { useRouter } from "next/navigation";
import { UsernameForm } from "../../../components/Comments/CommentSection";

// Lists show "Picked by {username}", so a username comes first
export default function UsernameGate() {
  const router = useRouter();
  return (
    <UsernameForm
      label="Pick a username first, it shows on your lists"
      onSaved={() => router.refresh()}
    />
  );
}
