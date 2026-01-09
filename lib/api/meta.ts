import { api } from "./client";

export type CompradoresResponse = {
  compradores: string[];
};

export async function getCompradores(signal?: AbortSignal) {
  return api<CompradoresResponse>("/api/meta/compradores", {
    method: "GET",
    signal,
  });
}
