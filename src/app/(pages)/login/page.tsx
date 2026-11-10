import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import SignInForm from "@components/Auth/SignInForm";
import { createClient } from "@lib/supabase/server";
import { safeRedirect } from "@lib/safeRedirect";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
};

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <main className={styles.page}>
      <h1>Sign in</h1>
      <p className={styles.text}>Sign in to heart movies and keep them on your profile.</p>

      {/* Reads the URL and login cookie at request time, so it sits inside Suspense */}
      <Suspense>
        <Login searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function Login({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const params = await searchParams;
  const next = safeRedirect(typeof params.next === "string" ? params.next : null);

  // Already signed in, skip straight to where they were going.
  // Supabase checks the session expiry with Date.now(), so wait for a real request first
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect(next);

  return (
    <>
      {params.error && (
        <p className={styles.error} role="alert">
          That sign-in link didn&apos;t work or has expired. Please try again.
        </p>
      )}
      <SignInForm next={next} />
    </>
  );
}
