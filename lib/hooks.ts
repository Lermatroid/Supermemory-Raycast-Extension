import { useState, useEffect, useRef } from "react";
import { useCachedPromise } from "@raycast/utils";
import { getMemories } from "./supermemory";
import fetch from "node-fetch";
import { getPrefs } from "./prefs";

export function useCachedMemories() {
  const { data, isLoading, revalidate } = useCachedPromise(async () => {
    return await getMemories();
  });

  return { data: data?.data, error: data?.error, isLoading, revalidate };
}

interface SupermemoryResponse {
  answer: string;
  isLoading: boolean;
  error: Error | null;
}

export function useAskSupermemory(question: string): SupermemoryResponse {
  const [answer, setAnswer] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const requestIdRef = useRef(0);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!question) return;

    const currentRequestId = ++requestIdRef.current;
    const controller = new AbortController();

    const fetchAnswer = async () => {
      if (currentRequestId !== requestIdRef.current || !isMounted.current) return;

      setIsLoading(true);
      setAnswer("");
      setError(null);

      try {
        const apiKey = getPrefs().apikey;
        if (!apiKey) {
          throw new Error("API key is not set");
        }

        const response = await fetch("https://api.supermemory.ai/v1/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: `${question}\n\nNote: Use markdown formatting for your response! Markdown should be commonmark compatible.`,
              },
            ],
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch response: ${response.status} ${errorText}`);
        }

        if (!response.body) {
          throw new Error("Response body is empty");
        }

        // Convert Node.js ReadableStream to Web ReadableStream
        const webStream = new ReadableStream({
          start(controller) {
            (response.body as NodeJS.ReadableStream).on("data", (chunk) => {
              controller.enqueue(chunk);
            });
            (response.body as NodeJS.ReadableStream).on("end", () => {
              controller.close();
            });
            (response.body as NodeJS.ReadableStream).on("error", (err) => {
              controller.error(err);
            });
          },
        });

        // Create a transform stream to handle the response
        const stream = webStream.pipeThrough(
          new TransformStream({
            transform(chunk: Uint8Array, controller) {
              // Decode the chunk
              const text = new TextDecoder().decode(chunk);
              const lines = text.split("\n");

              for (const line of lines) {
                if (line.trim() === "") continue;
                // Remove any leading letter and colon (e.g., 'e:' or 'd:')
                let lineContent = line.trim();
                if (/^[a-z]:/.test(lineContent)) {
                  lineContent = lineContent.substring(2);
                }
                try {
                  // Try parsing as JSON first (new format)
                  const parsed = JSON.parse(lineContent);
                  if (parsed.finishReason === "stop") {
                    if (currentRequestId === requestIdRef.current && isMounted.current) {
                      setIsLoading(false);
                    }
                    continue; // do not enqueue termination message
                  }
                } catch (e) {
                  // Try old format if JSON parsing fails
                  if (line.startsWith('0:"')) {
                    const content = line.slice(3, -1).replace(/\\"/g, '"').replace(/\\n/g, "\n");
                    controller.enqueue(content);
                    continue;
                  }
                }
              }
            },
          }),
        );

        const reader = stream.getReader();

        try {
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              if (currentRequestId === requestIdRef.current && isMounted.current) {
                setIsLoading(false);
              }
              break;
            }

            if (currentRequestId === requestIdRef.current && isMounted.current) {
              setAnswer((prev) => prev + value);
            }
          }
        } finally {
          reader.releaseLock();
        }
      } catch (err) {
        if (currentRequestId === requestIdRef.current && isMounted.current) {
          setError(err instanceof Error ? err : new Error("Unknown error occurred"));
          setIsLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(fetchAnswer, 0);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [question]);

  return { answer, isLoading, error };
}
