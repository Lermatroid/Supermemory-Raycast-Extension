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
  "/spaces": {
    method: "get",
    output: z.object({
      spaces: z.array(
        z.object({
          id: z.number(),
          uuid: z.string(),
          name: z.string(),
          ownerId: z.number(),
          isPublic: z.boolean(),
          createdAt: z.string(),
          accessType: z.null(),
          favorited: z.boolean(),
          permissions: z.object({
            canRead: z.boolean(),
            canEdit: z.boolean(),
            isOwner: z.boolean(),
          }),
          owner: z.null(),
        }),
      ),
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

export async function createMemoryFromTab(tab: ActiveTab, spaces: string[]) {
  return fetcher("/add", {
    body: {
      content: tab.url,
      spaces: spaces.length > 0 ? spaces : undefined,
    },
  });
}

export async function getWriteableSpaces() {
  const { data, error } = await fetcher("/spaces");
  if (error) {
    throw error;
  }
  return data.spaces.filter((space) => space.permissions.canEdit || space.permissions.isOwner);
}
