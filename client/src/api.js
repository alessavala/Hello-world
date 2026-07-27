const API_BASE = import.meta.env.VITE_API_BASE || '';

export async function uploadVideo(file) {
  const formData = new FormData();
  formData.append('video', file);
  const res = await fetch(`${API_BASE}/api/clips/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Upload failed');
  return res.json();
}

export async function trimClip({ fileId, start, end, mode, name }) {
  const res = await fetch(`${API_BASE}/api/clips/trim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId, start, end, mode, name }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Trim failed');
  return res.json();
}

export async function listClips() {
  const res = await fetch(`${API_BASE}/api/clips`);
  if (!res.ok) throw new Error('Failed to list clips');
  return res.json();
}

export async function deleteClip(id) {
  const res = await fetch(`${API_BASE}/api/clips/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete clip');
}

export function resolveUrl(url) {
  return `${API_BASE}${url}`;
}
