import { API_BASE_URL, getToken } from "./client";

export interface UploadResult {
  filename: string;
  url: string;
  path: string;
}

export async function uploadFile(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/api/v1/upload/`, {
    method: "POST",
    body: form,
    headers,
  });
  if (!res.ok) {
    let detail = await res.text();
    try {
      detail = JSON.parse(detail).detail ?? detail;
    } catch {
      /* giữ nguyên text */
    }
    throw new Error(detail || `Upload ${res.status}`);
  }
  return res.json();
}
