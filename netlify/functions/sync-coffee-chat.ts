import type { Handler } from '@netlify/functions';
import { createClient } from '@sanity/client';

/**
 * Daily YouTube → Sanity sync for the Coffee Chat podcast.
 * Scheduled via netlify.toml: `schedule = "0 6 * * *"`
 *
 * For each video in the playlist:
 *   1. Build a stable Sanity _id from the videoId
 *   2. Read existing doc (if any) to preserve manually-edited fields
 *   3. createOrReplace, only overwriting fields listed in syncedFields
 */

const sanity = createClient({
  projectId: process.env.VITE_SANITY_PROJECT_ID!,
  dataset: process.env.VITE_SANITY_DATASET || 'production',
  apiVersion: process.env.VITE_SANITY_API_VERSION || '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN!,
  useCdn: false,
});

const DEFAULT_SYNCED_FIELDS = ['title', 'description', 'publishedAt', 'thumbnailUrl'];

interface PlaylistItem {
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    resourceId: { videoId: string };
    thumbnails: { high?: { url: string }; medium?: { url: string }; default?: { url: string } };
  };
}

export const handler: Handler = async () => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const playlistId = process.env.COFFEE_CHAT_PLAYLIST_ID;

  if (!apiKey || !playlistId) {
    return { statusCode: 500, body: JSON.stringify({ error: 'YOUTUBE_API_KEY and COFFEE_CHAT_PLAYLIST_ID required' }) };
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}`;
    const res = await fetch(url);

    if (!res.ok) {
      const text = await res.text();
      console.error('YouTube API error:', text);
      return { statusCode: 502, body: JSON.stringify({ error: 'YouTube API failed' }) };
    }

    const json = await res.json();
    const items: PlaylistItem[] = json.items || [];

    let created = 0;
    let updated = 0;

    for (const item of items) {
      const videoId = item.snippet.resourceId.videoId;
      const _id = `youtube-${videoId}`;
      const thumb = item.snippet.thumbnails.high || item.snippet.thumbnails.medium || item.snippet.thumbnails.default;

      const incoming = {
        videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        publishedAt: item.snippet.publishedAt,
        thumbnailUrl: thumb?.url || null,
      };

      const existing = await sanity.fetch(`*[_id == $id][0]`, { id: _id });

      if (!existing) {
        await sanity.createOrReplace({
          _id,
          _type: 'coffeeEpisode',
          ...incoming,
          syncedFields: DEFAULT_SYNCED_FIELDS,
        });
        created++;
      } else {
        const synced: string[] = existing.syncedFields || DEFAULT_SYNCED_FIELDS;
        const patch: Record<string, unknown> = {};
        for (const field of synced) {
          if (field in incoming) patch[field] = (incoming as Record<string, unknown>)[field];
        }
        if (Object.keys(patch).length > 0) {
          await sanity.patch(_id).set(patch).commit();
          updated++;
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, created, updated, total: items.length }),
    };
  } catch (err) {
    console.error('sync-coffee-chat error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
