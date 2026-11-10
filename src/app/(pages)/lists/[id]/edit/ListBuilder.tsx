"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import horrorFilters from "../../../../../data/horrorFilters.json";
import { SEARCH_MIN_CHARS, useMovieSearch } from "../../../../../hooks/useMovieSearch";
import {
  LIST_SIZE,
  LIST_TITLE_MAX,
  MAX_LIST_GENRES,
  type UserListMovie,
} from "../../../../../lib/userListShared";
import { publishList, saveList, type ListDraft } from "../../actions";
import styles from "../../lists.module.css";

const GENRES = [...horrorFilters.subgenres].sort((a, b) => a.name.localeCompare(b.name));

type ListBuilderProps = {
  listId: number;
  initial: ListDraft;
  // e.g. "Promoted Nov 10 to Nov 24", shown before publishing a first list
  promoNote: string | null;
};

export default function ListBuilder({ listId, initial, promoNote }: ListBuilderProps) {
  const [title, setTitle] = useState(initial.title);
  const [genreIds, setGenreIds] = useState(initial.genreIds);
  const [movies, setMovies] = useState(initial.movies);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [message, setMessage] = useState<{ text: string; error?: boolean }>();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const search = useMovieSearch();

  const draft: ListDraft = { title, genreIds, movies };
  const dirty = JSON.stringify(draft) !== saved;
  const full = movies.length === LIST_SIZE;
  const onList = new Set(movies.map((movie) => movie.id));

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (!dirty) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const sensors = useSensors(
    // A small move before a drag starts, so taps on the buttons still work
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    setMovies((list) => {
      const from = list.findIndex((movie) => movie.id === active.id);
      const to = list.findIndex((movie) => movie.id === over.id);
      return arrayMove(list, from, to);
    });
  }

  function move(index: number, by: number) {
    setMovies((list) => arrayMove(list, index, index + by));
  }

  function add(movie: UserListMovie) {
    if (full || onList.has(movie.id)) return;
    setMovies((list) => [...list, movie]);
  }

  function toggleGenre(id: number) {
    setGenreIds((ids) =>
      ids.includes(id) ? ids.filter((g) => g !== id) : [...ids, id].slice(0, MAX_LIST_GENRES),
    );
  }

  async function save() {
    const result = await saveList(listId, draft);
    if (result.error) {
      setMessage({ text: result.error, error: true });
      return false;
    }
    setSaved(JSON.stringify(draft));
    return true;
  }

  function onSave() {
    setMessage(undefined);
    startTransition(async () => {
      if (await save()) setMessage({ text: "Draft saved." });
    });
  }

  function onPublish() {
    setMessage(undefined);
    startTransition(async () => {
      // Publishing reads the saved copy, so save any changes first
      if (dirty && !(await save())) return;
      const result = await publishList(listId);
      if (result?.error) {
        setMessage({ text: result.error, error: true });
        setConfirming(false);
      }
    });
  }

  return (
    <div className={styles.builder}>
      <section className={styles.panel}>
        <label className={styles.field}>
          List title
          <input
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={LIST_TITLE_MAX}
            placeholder="e.g. Movies that ruined my sleep"
          />
        </label>

        <fieldset className={styles.genrePicker}>
          <legend className={styles.fieldLabel}>
            Genres <span className={styles.muted}>(up to {MAX_LIST_GENRES})</span>
          </legend>
          <div className={styles.chips}>
            {GENRES.map((genre) => {
              const selected = genreIds.includes(genre.id);
              return (
                <button
                  key={genre.id}
                  type="button"
                  className={`${styles.chip} ${selected ? styles.chipOn : ""}`}
                  aria-pressed={selected}
                  disabled={!selected && genreIds.length >= MAX_LIST_GENRES}
                  onClick={() => toggleGenre(genre.id)}
                >
                  {genre.name}
                </button>
              );
            })}
          </div>
        </fieldset>
      </section>

      <div className={styles.builderColumns}>
        <section className={styles.panel} aria-labelledby="find-movies">
          <h2 id="find-movies" className={styles.panelTitle}>
            Find movies
          </h2>
          <input
            className={styles.input}
            type="search"
            value={search.query}
            onChange={(e) => search.changeQuery(e.target.value)}
            placeholder="Search horror…"
            aria-label="Search horror movies to add"
          />
          {search.trimmed.length > 0 && search.trimmed.length < SEARCH_MIN_CHARS && (
            <p className={styles.muted}>Keep typing…</p>
          )}
          {search.loading && !search.results && (
            <p className={styles.muted}>Searching the crypt…</p>
          )}
          {search.results?.length === 0 && !search.loading && (
            <p className={styles.muted}>No horror movies match “{search.trimmed}”.</p>
          )}
          {search.results && search.results.length > 0 && (
            <ul className={styles.results}>
              {search.results.map((movie) => {
                const id = movie.id;
                if (id === undefined) return null;
                const added = onList.has(id);
                return (
                  <li key={id} className={styles.resultRow}>
                    <Thumb path={movie.poster_path} />
                    <span className={styles.movieText}>
                      <span className={styles.movieTitle}>{movie.title}</span>
                      <span className={styles.muted}>{movie.release_date?.slice(0, 4)}</span>
                    </span>
                    <button
                      type="button"
                      className={styles.small}
                      disabled={added || full}
                      onClick={() =>
                        add({
                          id,
                          title: movie.title ?? "Untitled",
                          poster_path: movie.poster_path ?? null,
                          release_date: movie.release_date ?? null,
                          vote_average: movie.vote_average ?? null,
                        })
                      }
                    >
                      {added ? "Added" : full ? "List full" : "Add"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className={styles.panel} aria-labelledby="your-list">
          <h2 id="your-list" className={styles.panelTitle}>
            Your Top {LIST_SIZE}{" "}
            <span className={styles.count}>
              {movies.length} / {LIST_SIZE}
            </span>
          </h2>
          {movies.length === 0 ? (
            <p className={styles.muted}>Search for movies and add them here.</p>
          ) : (
            <>
              <p className={styles.muted}>Drag the handle or use the arrows to reorder.</p>
              <DndContext
                id="list-builder"
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onDragEnd}
              >
                <SortableContext
                  items={movies.map((m) => m.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ol className={styles.ranked}>
                    {movies.map((movie, index) => (
                      <RankedRow
                        key={movie.id}
                        movie={movie}
                        rank={index + 1}
                        onUp={index > 0 ? () => move(index, -1) : undefined}
                        onDown={index < movies.length - 1 ? () => move(index, 1) : undefined}
                        onRemove={() => setMovies((list) => list.filter((m) => m.id !== movie.id))}
                      />
                    ))}
                  </ol>
                </SortableContext>
              </DndContext>
            </>
          )}
        </section>
      </div>

      <div className={styles.actionBar}>
        <p className={`${styles.status} ${message?.error ? styles.error : ""}`} aria-live="polite">
          {message?.text ?? (dirty ? "Unsaved changes" : "All changes saved")}
        </p>
        <button
          type="button"
          className={styles.secondary}
          onClick={onSave}
          disabled={pending || !dirty}
        >
          Save draft
        </button>
        <button
          type="button"
          className={styles.primary}
          onClick={() => setConfirming(true)}
          disabled={pending || !full || !title.trim()}
          title={!full ? `Add ${LIST_SIZE} movies to publish` : undefined}
        >
          Publish
        </button>
      </div>

      {confirming && (
        <div className={styles.confirm} role="alertdialog" aria-labelledby="confirm-title">
          <p id="confirm-title" className={styles.confirmTitle}>
            Publish “{title.trim()}”?
          </p>
          <p className={styles.muted}>
            Published lists can&apos;t be changed. To change it later, you&apos;d make a new list.
          </p>
          {promoNote && <p className={styles.promoNote}>{promoNote}</p>}
          <div className={styles.confirmButtons}>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => setConfirming(false)}
              disabled={pending}
            >
              Keep editing
            </button>
            <button type="button" className={styles.primary} onClick={onPublish} disabled={pending}>
              {pending ? "Publishing…" : "Publish for good"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Thumb({ path }: { path: string | null | undefined }) {
  return path ? (
    <Image
      className={styles.thumb}
      src={`https://image.tmdb.org/t/p/w92${path}`}
      alt=""
      width={40}
      height={60}
    />
  ) : (
    <span className={styles.thumb} />
  );
}

type RankedRowProps = {
  movie: UserListMovie;
  rank: number;
  onUp?: () => void;
  onDown?: () => void;
  onRemove: () => void;
};

function RankedRow({ movie, rank, onUp, onDown, onRemove }: RankedRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: movie.id });

  return (
    <li
      ref={setNodeRef}
      className={`${styles.rankedRow} ${isDragging ? styles.dragging : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        className={styles.handle}
        aria-label={`Drag to reorder ${movie.title}`}
        {...attributes}
        {...listeners}
      >
        <svg viewBox="0 0 12 18" aria-hidden="true">
          {[3, 9, 15].flatMap((y) => [
            <circle key={`l${y}`} cx="3" cy={y} r="1.6" />,
            <circle key={`r${y}`} cx="9" cy={y} r="1.6" />,
          ])}
        </svg>
      </button>
      <span className={styles.rank}>{rank}</span>
      <Thumb path={movie.poster_path} />
      <span className={styles.movieText}>
        <span className={styles.movieTitle}>{movie.title}</span>
        <span className={styles.muted}>{movie.release_date?.slice(0, 4)}</span>
      </span>
      <span className={styles.rowButtons}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onUp}
          disabled={!onUp}
          aria-label={`Move ${movie.title} up`}
        >
          ↑
        </button>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onDown}
          disabled={!onDown}
          aria-label={`Move ${movie.title} down`}
        >
          ↓
        </button>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onRemove}
          aria-label={`Remove ${movie.title}`}
        >
          ✕
        </button>
      </span>
    </li>
  );
}
