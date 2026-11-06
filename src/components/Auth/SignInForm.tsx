"use client";

import { useState } from "react";
import { createClient } from "../../lib/supabase/client";
import styles from "./SignInForm.module.css";

type SignInFormProps = {
  // Where to send them after signing in
  next: string;
};

export default function SignInForm({ next }: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  function callbackUrl() {
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  }

  async function signInWithGoogle() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl() },
    });
    if (error) setStatus("error");
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl() },
    });
    setStatus(error ? "error" : "sent");
  }

  if (status === "sent") {
    return (
      <div className={styles.form}>
        <p className={styles.sent}>Check your email</p>
        <p className={styles.hint}>
          We sent a sign-in link to <strong>{email}</strong>. Open it in this browser to finish
          signing in.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.form}>
      <button type="button" className={styles.google} onClick={signInWithGoogle}>
        Continue with Google
      </button>

      <p className={styles.divider}>or get a link by email</p>

      <form className={styles.emailForm} onSubmit={sendMagicLink}>
        <label htmlFor="signin-email" className={styles.label}>
          Email
        </label>
        <input
          id="signin-email"
          type="email"
          required
          autoComplete="email"
          className={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <button type="submit" className={styles.submit} disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : "Email me a link"}
        </button>
      </form>

      {status === "error" && (
        <p className={styles.error} role="alert">
          Something went wrong. Please try again.
        </p>
      )}
    </div>
  );
}
