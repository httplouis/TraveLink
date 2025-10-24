"use client";
import type { MaintAttachment } from "./maintenance.types";
import { uid } from "./maintenance.repo";

export async function fileToAttachment(file: File): Promise<MaintAttachment> {
  const name = file.name;
  const kind = file.type.includes("pdf") ? "pdf" : "image";
  const url = await readAsDataURL(file);
  return { id: uid("att"), name, kind, url };
}

function readAsDataURL(file: File) {
  return new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(fr.error);
    fr.onload = () => resolve(String(fr.result));
    fr.readAsDataURL(file);
  });
}
