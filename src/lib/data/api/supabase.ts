import { Api } from "./ports";
// import { createClient } from "@/lib/supabaseClient"; // use yours

export const supabaseApi: Api = {
  vehicles: {
    async list() { throw new Error("TODO: implement with Supabase"); },
    async updateStatus() { throw new Error("TODO: implement"); },
    async add() { throw new Error("TODO: implement"); },
    async remove() { throw new Error("TODO: implement"); },
  },
  drivers: {
    async list() { throw new Error("TODO: implement"); },
    async updateStatus() { throw new Error("TODO: implement"); },
    async add() { throw new Error("TODO: implement"); },
  },
  schedules: {
    async listUpcoming() { throw new Error("TODO: implement"); },
  },
};
