// Shared URL parsing for portfolio videos (TikTok, Instagram, YouTube).
// Kept separate from the rendering components so the gallery card (which
// needs to know aspect ratio + platform link before mounting any embed) and
// the playback modal (which mounts the real embed) agree on the same ids.

const YOUTUBE_ID_RE = /^[\w-]{11}$/;

export function tiktokVideoId(url: string): string | undefined {
  return url.match(/\/video\/(\d+)/)?.[1];
}

// Covers youtube.com/watch?v=, youtu.be/, youtube.com/shorts/,
// youtube.com/embed/ and youtube.com/live/ - whichever format a creator
// happens to paste - with a strict 11-char id check so a near-miss match
// doesn't produce a broken embed src.
export function youtubeVideoId(url: string): string | undefined {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]+)/);
  const id = match?.[1];
  return id && YOUTUBE_ID_RE.test(id) ? id : undefined;
}

export function isYoutubeShort(url: string): boolean {
  return /youtube\.com\/shorts\//.test(url);
}

export function isYoutubeLive(url: string): boolean {
  return /youtube\.com\/live\//.test(url);
}

/** Whether we know how to mount a real player for this item, vs. just linking out. */
export function canEmbed(platform: string, url: string): boolean {
  if (platform === "TIKTOK") return !!tiktokVideoId(url);
  if (platform === "YOUTUBE") return !!youtubeVideoId(url);
  if (platform === "INSTAGRAM") return true;
  return false;
}

/** 9:16 for TikTok/Instagram/Shorts, 16:9 for a regular YouTube upload. */
export function embedAspect(platform: string, url: string): "portrait" | "landscape" {
  if (platform === "YOUTUBE" && !isYoutubeShort(url)) return "landscape";
  return "portrait";
}

export const PLATFORM_HOME_LABEL: Record<string, string> = {
  TIKTOK: "Ver en TikTok",
  INSTAGRAM: "Ver en Instagram",
  YOUTUBE: "Ver en YouTube",
  FACEBOOK: "Ver en Facebook",
};
