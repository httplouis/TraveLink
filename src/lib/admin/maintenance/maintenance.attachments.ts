import type { MaintAttachment } from "./maintenance.types";

/** Map a File → MaintAttachment (keeps your dataURL behavior) */
export async function fileToAttachment(file: File): Promise<MaintAttachment> {
  const name = file.name;
  const kind = file.type.startsWith("image/") ? "img" : "pdf";
  const url = await readAsDataURL(file);
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    name,
    kind,
    url,
  };
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(fr.error);
    fr.onload = () => resolve(String(fr.result));
    fr.readAsDataURL(file);
  });
}
