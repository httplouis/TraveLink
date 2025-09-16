import { mockApi } from "./mock";
import { supabaseApi } from "./supabase";
import type { Api } from "./ports";

const which = process.env.NEXT_PUBLIC_API ?? "mock";
export const api: Api = which === "supabase" ? supabaseApi : mockApi;
