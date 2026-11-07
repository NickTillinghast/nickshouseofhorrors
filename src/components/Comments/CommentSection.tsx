"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import { useFavorites } from "../Favorites/FavoritesProvider";
import { setCommentCount } from "../../hooks/useCommentCount";
import {
  COMMENT_COLUMNS,
  COMMENT_MAX_LENGTH,
  USERNAME_PATTERN,
  timeAgo,
  type Comment,
} from "../../lib/comments";
import { addComment, createProfile, deleteComment, reportComment } from "./actions";
import styles from "./CommentSection.module.css";

async function fetchComments(thread: string) {
  const { data, error } = await createClient()
    .from("comments")
    .select(COMMENT_COLUMNS)
    .eq("thread", thread)
    .order("created_at", { ascending: true })
    .overrideTypes<Comment[], { merge: false }>();
  return error ? null : data;
}

type CommentSectionProps = {
  thread: string;
  id?: string;
};

export default function CommentSection({ thread, id }: CommentSectionProps) {
  const { user, openSignIn } = useFavorites();
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  // undefined while loading, null when they haven't picked a username yet
  const [username, setUsername] = useState<string | null | undefined>(undefined);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [reported, setReported] = useState<Set<number>>(new Set());

  function show(data: Comment[] | null) {
    setLoadError(!data);
    if (!data) return;
    setComments(data);
    setCommentCount(thread, data.length);
  }

  async function load() {
    show(await fetchComments(thread));
  }

  useEffect(() => {
    let cancelled = false;
    fetchComments(thread).then((data) => {
      if (!cancelled) show(data);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread]);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    createClient()
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setUsername(data?.username ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function post(body: string, parentId: number | null = null) {
    const result = await addComment(thread, body, parentId);
    if (!result.error) {
      setReplyingTo(null);
      await load();
    }
    return result;
  }

  async function remove(comment: Comment) {
    if (!window.confirm("Delete this comment? Any replies to it will be deleted too.")) return;
    const result = await deleteComment(comment.id);
    if (result.error) window.alert(result.error);
    else await load();
  }

  async function report(comment: Comment) {
    if (!window.confirm("Report this comment to the site owner?")) return;
    const result = await reportComment(comment.id);
    if (result.error) window.alert(result.error);
    else setReported((current) => new Set(current).add(comment.id));
  }

  function startReply(commentId: number) {
    if (!user) openSignIn();
    else setReplyingTo(replyingTo === commentId ? null : commentId);
  }

  const canPost = Boolean(user && username);
  // Newest conversations first, replies read top to bottom under them
  const topLevel = (comments ?? []).filter((c) => c.parent_id === null).reverse();
  const repliesTo = (parentId: number) => (comments ?? []).filter((c) => c.parent_id === parentId);

  function renderComment(comment: Comment, isReply = false) {
    const name = comment.profiles?.username ?? "deleted";
    const isOwn = comment.user_id === userId;

    return (
      <article className={styles.comment}>
        <span className={styles.avatar} aria-hidden="true">
          {name[0].toUpperCase()}
        </span>
        <div className={styles.commentBody}>
          <p className={styles.meta}>
            <span className={styles.author}>{name}</span>
            <time
              dateTime={comment.created_at}
              title={new Date(comment.created_at).toLocaleString()}
            >
              {timeAgo(comment.created_at)}
            </time>
          </p>
          <p className={styles.text}>{comment.body}</p>
          <div className={styles.actions}>
            {!isReply && (
              <button type="button" onClick={() => startReply(comment.id)}>
                Reply
              </button>
            )}
            {isOwn ? (
              <button type="button" onClick={() => remove(comment)}>
                Delete
              </button>
            ) : (
              user &&
              (reported.has(comment.id) ? (
                <span className={styles.reported}>Reported</span>
              ) : (
                <button type="button" onClick={() => report(comment)}>
                  Report
                </button>
              ))
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <section id={id} className={styles.section} aria-label="Comments">
      <h3 className={styles.heading}>
        Comments {comments && <span className={styles.total}>{comments.length}</span>}
      </h3>

      {!user ? (
        <button type="button" className={styles.signIn} onClick={openSignIn}>
          Sign in to join the conversation
        </button>
      ) : username === null ? (
        <UsernameForm onSaved={setUsername} />
      ) : username ? (
        <CommentForm placeholder="What did you think?" onSubmit={(body) => post(body)} />
      ) : null}

      {loadError && <p className={styles.error}>Couldn&apos;t load comments.</p>}
      {comments?.length === 0 && <p className={styles.empty}>No comments yet. Be the first.</p>}

      <ol className={styles.list}>
        {topLevel.map((comment) => (
          <li key={comment.id}>
            {renderComment(comment)}

            <ol className={styles.replies}>
              {repliesTo(comment.id).map((reply) => (
                <li key={reply.id}>{renderComment(reply, true)}</li>
              ))}
              {replyingTo === comment.id && canPost && (
                <li>
                  <CommentForm
                    placeholder={`Reply to ${comment.profiles?.username ?? "this comment"}`}
                    autoFocus
                    onSubmit={(body) => post(body, comment.id)}
                    onCancel={() => setReplyingTo(null)}
                  />
                </li>
              )}
              {replyingTo === comment.id && user && username === null && (
                <li className={styles.empty}>Pick a username above to reply.</li>
              )}
            </ol>
          </li>
        ))}
      </ol>
    </section>
  );
}

type CommentFormProps = {
  placeholder: string;
  autoFocus?: boolean;
  onSubmit: (body: string) => Promise<{ error?: string }>;
  onCancel?: () => void;
};

function CommentForm({ placeholder, autoFocus, onSubmit, onCancel }: CommentFormProps) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    const result = await onSubmit(body);
    setSending(false);
    setError(result.error);
    if (!result.error) setBody("");
  }

  const remaining = COMMENT_MAX_LENGTH - body.length;

  return (
    <form className={styles.form} onSubmit={submit}>
      <textarea
        className={styles.textarea}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        maxLength={COMMENT_MAX_LENGTH}
        rows={3}
        autoFocus={autoFocus}
        required
      />
      <div className={styles.formFooter}>
        <span className={remaining < 100 ? styles.countLow : styles.countHint}>
          {remaining < 100 ? `${remaining} left` : ""}
        </span>
        {onCancel && (
          <button type="button" className={styles.cancel} onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className={styles.submit} disabled={sending || !body.trim()}>
          {sending ? "Posting…" : "Post"}
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </form>
  );
}

// Also used by the quiz, so scores show a username instead of a real name
export function UsernameForm({
  onSaved,
  label = "Pick a username to start commenting",
}: {
  onSaved: (username: string) => void;
  label?: string;
}) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const valid = USERNAME_PATTERN.test(value);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = await createProfile(value);
    setSaving(false);
    if (result.error) setError(result.error);
    else onSaved(value);
  }

  return (
    <form className={styles.usernameForm} onSubmit={submit}>
      <label htmlFor="username" className={styles.usernameLabel}>
        {label}
      </label>
      <p className={styles.usernameHint}>
        It shows on everything you post. Don&apos;t use your real name. 3 to 20 letters, numbers or
        underscores.
      </p>
      <div className={styles.usernameRow}>
        <input
          id="username"
          className={styles.input}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(undefined);
          }}
          maxLength={20}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={value.length > 0 && !valid}
          aria-describedby="username-error"
        />
        <button type="submit" className={styles.submit} disabled={!valid || saving}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      <p id="username-error" className={styles.error} aria-live="polite">
        {error ?? (value.length > 0 && !valid ? "3 to 20 letters, numbers or underscores." : "")}
      </p>
    </form>
  );
}
