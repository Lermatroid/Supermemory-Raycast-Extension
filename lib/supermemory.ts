import { createFetch, createSchema } from "@better-fetch/fetch";
import { getPrefs } from "./prefs";
import { z } from "zod";
import type { ActiveTab } from "./active-tab";
import { fetch, Headers } from "cross-fetch";

global.Headers = Headers;

const superMemoryAPISchema = createSchema({
  "/add": {
    method: "post",
    input: z.object({
      content: z.string(),
      spaces: z.array(z.string()).optional(),
      preferred: z
        .object({
          contentToVectorize: z.string(),
          contentToSave: z.string(),
          title: z.string(),
          type: z.string(),
          description: z.string().optional(),
          ogImage: z.string().optional(),
        })
        .optional(),
    }),
    output: z.object({
      message: z.string(),
      id: z.string(),
      type: z.string(),
    }),
  },
});

const fetcher = createFetch({
  baseURL: "https://api.supermemory.ai/api",
  auth: {
    type: "Bearer",
    token: getPrefs().apikey,
  },
  schema: superMemoryAPISchema,
  customFetchImpl: fetch,
});

export async function createMemoryFromTab(tab: ActiveTab) {
  return fetcher("/add", {
    body: {
      content: tab.url,
    },
  });
}
