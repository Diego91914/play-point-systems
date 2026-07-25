"use client";

export type TriviaSseMessage = {
  event: string;
  data: string;
};

export function parseTriviaSseBlock(block: string): TriviaSseMessage | null {
  const lines = block.replace(/\r/g, "").split("\n");
  let event = "message";
  const data: string[] = [];

  for (const line of lines) {
    if (!line || line.startsWith(":")) {
      continue;
    }
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      data.push(line.slice(5).trimStart());
    }
  }

  return data.length > 0 ? { event, data: data.join("\n") } : null;
}

export function subscribeToTriviaStream<T>(args: {
  url: string;
  token?: string | null;
  onSnapshot: (snapshot: T) => void;
  onConnectionChange: (connected: boolean) => void;
}) {
  let stopped = false;
  let activeRequest: AbortController | null = null;

  const waitToReconnect = () => new Promise<void>((resolve) => {
    window.setTimeout(resolve, 1500);
  });

  const connect = async () => {
    while (!stopped) {
      activeRequest = new AbortController();

      try {
        const response = await fetch(args.url, {
          cache: "no-store",
          credentials: "same-origin",
          headers: {
            Accept: "text/event-stream",
            ...(args.token ? { Authorization: `Bearer ${args.token}` } : {}),
          },
          signal: activeRequest.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`Trivia stream failed with status ${response.status}.`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let reconnectRequested = false;

        while (!stopped && !reconnectRequested) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
          let boundary = buffer.indexOf("\n\n");

          while (boundary >= 0) {
            const message = parseTriviaSseBlock(buffer.slice(0, boundary));
            buffer = buffer.slice(boundary + 2);

            if (message?.event === "snapshot") {
              args.onSnapshot(JSON.parse(message.data) as T);
            } else if (message?.event === "ready") {
              args.onConnectionChange(true);
            } else if (message && ["fallback", "expired", "reconnect"].includes(message.event)) {
              reconnectRequested = true;
              break;
            }

            boundary = buffer.indexOf("\n\n");
          }
        }

        await reader.cancel().catch(() => undefined);
      } catch (error) {
        if (!stopped && !(error instanceof DOMException && error.name === "AbortError")) {
          // Polling remains active while the stream reconnects.
        }
      } finally {
        activeRequest = null;
        args.onConnectionChange(false);
      }

      if (!stopped) {
        await waitToReconnect();
      }
    }
  };

  void connect();

  return () => {
    stopped = true;
    activeRequest?.abort();
    args.onConnectionChange(false);
  };
}
