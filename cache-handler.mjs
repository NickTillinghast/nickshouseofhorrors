// Shared cache for "use cache", wired up in next.config.ts as cacheHandlers.default.
//
// Two layers:
//   1. Memory: instant, but only inside one running server (one Lambda copy)
//   2. DynamoDB: shared by every Lambda copy and survives restarts
//
// So a TMDB or Watchmode result is fetched once per cache period for the whole site,
// and updateTag() (e.g. publishing a list) reaches every copy, not just the one that ran it.
//
// DynamoDB is only used when CACHE_TABLE is set at runtime (on AWS). Locally and during
// `next build` it's memory only. Any DynamoDB error falls back to memory, never breaks a page.
//
// Contract: node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/cacheHandlers.md

import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";

const require = createRequire(import.meta.url);

// Memory layer size, the same default Next uses
const MEMORY_MAX_BYTES = 50 * 1024 * 1024;
// DynamoDB items max out at 400 KB, leave room for the other attributes
const DYNAMO_MAX_VALUE_BYTES = 350 * 1024;
// Re-read tag invalidations from DynamoDB at most this often
const TAG_REFRESH_MS = 5_000;
// Never keep anything in DynamoDB longer than this, even "max" cache lives
const MAX_TTL_SECONDS = 30 * 24 * 60 * 60;
const TAGS_PARTITION = "tags";

const debug = process.env.NEXT_PRIVATE_DEBUG_CACHE
  ? console.debug.bind(console, "[cache-handler]")
  : () => {};

// Decided per call, not at import: the config (and so this file) is baked in at build time,
// but CACHE_TABLE only exists on Lambda
function dynamoTable() {
  if (process.env.NEXT_PHASE === "phase-production-build") return null;
  return process.env.CACHE_TABLE || null;
}

let client;
function dynamo() {
  client ??= new DynamoDBClient({});
  return client;
}

// Tag invalidations. Next's whole-page cache reads the same internal map, so syncing
// DynamoDB into it makes updateTag() refresh cached pages on every copy too.
// It's an internal module: if a Next upgrade moves it, fall back to our own map.
let tagsManifest;
try {
  tagsManifest =
    require("next/dist/server/lib/incremental-cache/tags-manifest.external.js").tagsManifest;
} catch {
  tagsManifest = new Map();
}

const now = () => Math.round(performance.timeOrigin + performance.now());

function areTagsExpired(tags, timestamp) {
  const time = now();
  return tags.some((tag) => {
    const expired = tagsManifest.get(tag)?.expired;
    return typeof expired === "number" && expired <= time && expired > timestamp;
  });
}

function areTagsStale(tags, timestamp) {
  return tags.some((tag) => (tagsManifest.get(tag)?.stale ?? 0) > timestamp);
}

// ---- Memory layer: a small LRU bounded by bytes ----

const memory = new Map();
let memoryBytes = 0;

function memoryGet(key) {
  const item = memory.get(key);
  if (!item) return undefined;
  // Move to the end, so it's the last to be evicted
  memory.delete(key);
  memory.set(key, item);
  return item;
}

function memorySet(key, item) {
  const existing = memory.get(key);
  if (existing) {
    memoryBytes -= existing.value.byteLength;
    memory.delete(key);
  }
  memory.set(key, item);
  memoryBytes += item.value.byteLength;
  for (const [oldKey, old] of memory) {
    if (memoryBytes <= MEMORY_MAX_BYTES) break;
    memory.delete(oldKey);
    memoryBytes -= old.value.byteLength;
  }
}

// ---- DynamoDB layer ----

// Cache keys can be long, DynamoDB keys can't, so store a hash
const entryKey = (cacheKey) => `entry#${createHash("sha256").update(cacheKey).digest("hex")}`;

async function dynamoGet(table, cacheKey) {
  const { Item } = await dynamo().send(
    new GetItemCommand({
      TableName: table,
      Key: { pk: { S: entryKey(cacheKey) }, sk: { S: "_" } },
    }),
  );
  if (!Item?.value?.B) return undefined;
  return {
    entry: JSON.parse(Item.meta.S),
    value: Item.value.B,
  };
}

async function dynamoSet(table, cacheKey, entry, value) {
  // Expire from DynamoDB when Next would stop using it anyway
  const lifetime = Number.isFinite(entry.expire)
    ? Math.min(entry.expire, MAX_TTL_SECONDS)
    : MAX_TTL_SECONDS;
  await dynamo().send(
    new PutItemCommand({
      TableName: table,
      Item: {
        pk: { S: entryKey(cacheKey) },
        sk: { S: "_" },
        meta: { S: JSON.stringify(entry) },
        value: { B: value },
        ttl: { N: String(Math.ceil(entry.timestamp / 1000) + lifetime) },
      },
    }),
  );
}

let lastTagRefresh = 0;
let tagRefresh;

async function syncTagsFromDynamo(table) {
  let startKey;
  do {
    const page = await dynamo().send(
      new QueryCommand({
        TableName: table,
        KeyConditionExpression: "pk = :pk",
        ExpressionAttributeValues: { ":pk": { S: TAGS_PARTITION } },
        ExclusiveStartKey: startKey,
      }),
    );
    for (const item of page.Items ?? []) {
      const tag = item.sk.S;
      const local = tagsManifest.get(tag) ?? {};
      const stale = item.stale ? Number(item.stale.N) : undefined;
      const expired = item.expired ? Number(item.expired.N) : undefined;
      // Keep whichever invalidation is newer, ours or the shared one
      tagsManifest.set(tag, {
        ...local,
        ...(stale !== undefined && stale > (local.stale ?? 0) ? { stale } : {}),
        ...(expired !== undefined && expired > (local.expired ?? 0) ? { expired } : {}),
      });
    }
    startKey = page.LastEvaluatedKey;
  } while (startKey);
}

// ---- The handler ----

const pendingSets = new Map();

/** @type {import("next/cache").CacheHandler} */
const cacheHandler = {
  async get(cacheKey, softTags) {
    try {
      await pendingSets.get(cacheKey);

      let item = memoryGet(cacheKey);
      const table = dynamoTable();
      if (!item && table) {
        item = await dynamoGet(table, cacheKey);
        if (item) {
          debug("dynamo hit", cacheKey);
          memorySet(cacheKey, item);
        }
      }
      if (!item) return undefined;

      const { entry, value } = item;
      // Past its expire time Next regenerates it anyway (it checks this itself too)
      if (now() > entry.timestamp + entry.expire * 1000) return undefined;

      // An updateTag()/revalidatePath() after this entry was made: treat as missing
      if (
        areTagsExpired(entry.tags, entry.timestamp) ||
        areTagsExpired(softTags, entry.timestamp)
      ) {
        return undefined;
      }
      // Stale tags: serve it, and let Next refresh it in the background
      const stale =
        areTagsStale(entry.tags, entry.timestamp) || areTagsStale(softTags, entry.timestamp);

      return {
        ...entry,
        revalidate: stale ? -1 : entry.revalidate,
        value: new ReadableStream({
          start(controller) {
            controller.enqueue(value);
            controller.close();
          },
        }),
      };
    } catch (error) {
      // Next doesn't catch errors from get(), so a cache problem must never become a page error
      console.error("[cache-handler] get failed, treating as a miss", error);
      return undefined;
    }
  },

  async set(cacheKey, pendingEntry) {
    let done;
    pendingSets.set(
      cacheKey,
      new Promise((resolve) => {
        done = resolve;
      }),
    );
    try {
      // The cached function itself failed (e.g. TMDB 404): nothing to store, and not a cache problem
      const entry = await pendingEntry.catch(() => null);
      if (!entry) return;
      // expire 0 means "dynamic": Next never serves it back, so don't store it
      if (entry.expire === 0) return;

      // Read the stream exactly once, keep the bytes
      const value = new Uint8Array(await new Response(entry.value).arrayBuffer());
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- drop the used-up stream
      const { value: _stream, ...meta } = entry;
      memorySet(cacheKey, { entry: meta, value });

      const table = dynamoTable();
      if (!table) return;
      if (value.byteLength > DYNAMO_MAX_VALUE_BYTES) {
        console.warn(
          `[cache-handler] ${Math.round(value.byteLength / 1024)} KB entry is too big for DynamoDB, kept in memory only`,
        );
        return;
      }
      await dynamoSet(table, cacheKey, meta, value);
    } catch (error) {
      // The page was already sent, losing a cache write just means a fresh fetch next time
      console.error("[cache-handler] set failed", error);
    } finally {
      done();
      pendingSets.delete(cacheKey);
    }
  },

  async refreshTags() {
    const table = dynamoTable();
    if (!table) return;
    // Runs before the first cache read of every request, so only hit DynamoDB every few seconds.
    // Concurrent requests share one in-flight refresh
    if (now() - lastTagRefresh < TAG_REFRESH_MS) return tagRefresh;
    lastTagRefresh = now();
    tagRefresh = syncTagsFromDynamo(table).catch((error) => {
      console.error("[cache-handler] tag refresh failed", error);
    });
    return tagRefresh;
  },

  async getExpiration(tags) {
    return Math.max(0, ...tags.map((tag) => tagsManifest.get(tag)?.expired ?? 0));
  },

  async updateTags(tags, durations) {
    const time = now();
    const table = dynamoTable();

    await Promise.all(
      tags.map(async (tag) => {
        const update = { ...(tagsManifest.get(tag) ?? {}) };
        if (durations) {
          // Serve while refreshing, fully expire after the profile's expire time
          update.stale = time;
          if (durations.expire !== undefined) update.expired = time + durations.expire * 1000;
        } else {
          // updateTag(): this request's next read must miss
          update.expired = time;
        }
        tagsManifest.set(tag, update);

        if (!table) return;
        try {
          await dynamo().send(
            new PutItemCommand({
              TableName: table,
              Item: {
                pk: { S: TAGS_PARTITION },
                sk: { S: tag },
                ...(update.stale !== undefined ? { stale: { N: String(update.stale) } } : {}),
                ...(update.expired !== undefined ? { expired: { N: String(update.expired) } } : {}),
                // Old invalidations stop mattering once every entry they could affect is gone
                ttl: { N: String(Math.ceil(time / 1000) + MAX_TTL_SECONDS) },
              },
            }),
          );
        } catch (error) {
          console.error("[cache-handler] couldn't share tag update", tag, error);
        }
      }),
    );
  },
};

export default cacheHandler;
