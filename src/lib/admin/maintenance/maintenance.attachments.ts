import type { Attachment } from "./maintenance.types";

export function isImage(mime: string) {
  return mime.startsWith("image/");
}
export function isPdf(mime: string) {
  return mime === "application/pdf";
}

/** Convert <input type="file" multiple> → Attachment[] (object URLs; offline-friendly) */
export async function filesToAttachments(list: FileList | File[]): Promise<Attachment[]> {
  const files = Array.from(list || []);
  const accepted = files.filter(f => isImage(f.type) || isPdf(f.type));
  return accepted.map(f => ({
    id: crypto.randomUUID(),
    name: f.name,
    url: URL.createObjectURL(f),
    mime: f.type,
    size: f.size,
  }));
}
